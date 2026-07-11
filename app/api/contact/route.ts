import { NextResponse } from "next/server";
import { sendEmails, emailShell, escapeHtml } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { name, email, message } = await request.json().catch(() => ({}));
  if (!name || !email || !message) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  const to = process.env.EMAIL_ADMIN;
  if (!to) {
    console.log("[contact] EMAIL_ADMIN not set — message:", { name, email, message });
    return NextResponse.json({ ok: true });
  }
  await sendEmails([
    {
      to,
      subject: `Contact form: ${String(name).slice(0, 60)}`,
      html: emailShell({
        heading: "New contact message",
        bodyHtml: `<p><strong>${escapeHtml(String(name).slice(0, 100))}</strong> · ${escapeHtml(String(email).slice(0, 100))}</p><p style="white-space:pre-wrap;">${escapeHtml(String(message).slice(0, 4000))}</p>`,
      }),
    },
  ]);
  return NextResponse.json({ ok: true });
}
