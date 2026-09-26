// SMTP email engine, over the mail server DirectAdmin runs for the domain.
//
// The header logo is a PNG, not the SVG the site uses: Gmail and Outlook strip
// SVG entirely, so the header would come through blank. It is transparent so it
// sits on the sea band, drawn at 4x for retina, and carries alt="PortiQuote"
// so the brand still reads in clients that block images by default.
//
// Gracefully no-ops when SMTP_HOST is unset so the app runs fine in development
// without email configured.

import nodemailer, { type Transporter } from "nodemailer";
import { appOrigin } from "@/lib/runtime";

// Links in email must come back to the environment that sent them, so a
// staging notification never walks the recipient into production.
const SITE = appOrigin();
const FROM = process.env.EMAIL_FROM ?? "PortiQuote <noreply@portiquote.com>";

export type Mail = { to: string; subject: string; html: string };

// One pooled transport per container. Pooling matters here because a single RFQ
// can notify a dozen forwarders, and a fresh TLS handshake per message would
// both be slow and look like a burst of separate logins to the mail server.
let cached: Transporter | null = null;

function transport(): Transporter | null {
  if (cached) return cached;

  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  cached = nodemailer.createTransport({
    host,
    port,
    // 465 is implicit TLS; 587 starts plaintext and upgrades via STARTTLS.
    secure: port === 465,
    requireTLS: port !== 465,
    auth: user && pass ? { user, pass } : undefined,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  });
  return cached;
}

export async function sendEmails(mails: Mail[]): Promise<void> {
  const clean = mails.filter((m) => m.to && m.to.includes("@"));
  if (clean.length === 0) return;

  const mailer = transport();
  if (!mailer) {
    console.error(
      `[email] SMTP_HOST not set — DROPPED ${clean.length} email(s):`,
      clean.map((m) => `${m.to} · ${m.subject}`)
    );
    return;
  }

  // Sent individually rather than as one message with many recipients, so that
  // recipients never see each other's addresses. Failures are logged and
  // skipped: one bad address must not stop the rest of a notification batch.
  const results = await Promise.allSettled(
    clean.map((m) => mailer.sendMail({ from: FROM, ...m }))
  );
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[email] failed to ${clean[i].to}:`, r.reason?.message ?? r.reason);
    }
  });
}

// Branded shell — palette inlined for email-client compatibility.
export function emailShell(opts: {
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaPath?: string;
}): string {
  const cta =
    opts.ctaLabel && opts.ctaPath
      ? `<a href="${SITE}${opts.ctaPath}" style="display:inline-block;margin-top:20px;background:#F2A83B;color:#062A2E;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;padding:11px 22px;">${opts.ctaLabel}</a>`
      : "";
  return `<!doctype html><html><body style="margin:0;background:#E9F0EE;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:28px 16px;">
    <div style="background:#0B4A54;border-radius:14px 14px 0 0;padding:22px 26px;">
      <img src="${SITE}/email-logo.png" width="120" height="26" alt="PortiQuote"
           style="display:block;border:0;outline:none;text-decoration:none;" />
      <h1 style="color:#FBFCFB;font-size:21px;margin:8px 0 0;">${opts.heading}</h1>
    </div>
    <div style="background:#FBFCFB;border-radius:0 0 14px 14px;padding:24px 26px;color:#062A2E;font-size:14px;line-height:1.6;">
      ${opts.bodyHtml}
      ${cta}
      <p style="margin-top:26px;color:#062A2E;opacity:.45;font-size:12px;">Rooted in Africa. Moving cargo worldwide.<br>${SITE.replace(/^https?:\/\//, "")}</p>
    </div>
  </div></body></html>`;
}

// Escape user-provided strings before interpolating into email HTML.
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
