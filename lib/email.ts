// Resend email engine.
//
// The header logo is a PNG, not the SVG the site uses: Gmail and Outlook strip
// SVG entirely, so the header would come through blank. It is transparent so it
// sits on the sea band, drawn at 4x for retina, and carries alt="GassDi Caravan"
// so the brand still reads in clients that block images by default.
//
// Gracefully no-ops when RESEND_API_KEY is unset so the
// app runs fine in development without email configured.

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
const FROM =
  process.env.EMAIL_FROM ?? "GassDi Caravan <onboarding@resend.dev>";

export type Mail = { to: string; subject: string; html: string };

export async function sendEmails(mails: Mail[]): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const clean = mails.filter((m) => m.to && m.to.includes("@"));
  if (clean.length === 0) return;
  if (!key) {
    console.error(`[email] RESEND_API_KEY not set — DROPPED ${clean.length} email(s):`,
      clean.map((m) => `${m.to} · ${m.subject}`));
    return;
  }
  // Resend batch endpoint takes up to 100 messages per call.
  for (let i = 0; i < clean.length; i += 100) {
    const chunk = clean.slice(i, i + 100).map((m) => ({ from: FROM, ...m }));
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) console.error("[email] Resend error", res.status, await res.text());
  }
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
      <img src="${SITE}/email-logo.png" width="172" height="22" alt="GassDi Caravan"
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
