import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmails, emailShell, escapeHtml } from "@/lib/email";

export const runtime = "nodejs";

// A single quiet notification for direct (forwarder-to-forwarder) messages,
// so a DM doesn't sit unseen for days. Deliberately minimal: no message body
// in the email, just a nudge to the inbox.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { messageId } = await request.json().catch(() => ({}));
  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[message-created] SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: msg, error: msgErr } = await admin
    .from("messages")
    .select("id, sender_id, recipient_id, rfq_id")
    .eq("id", messageId)
    .single();
  if (msgErr) {
    console.error("[message-created] lookup failed:", msgErr.message);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  // Only the sender may trigger the notification, and only for direct messages.
  if (!msg || msg.sender_id !== user.id || msg.rfq_id !== null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: recipient } = await admin
    .from("profiles")
    .select("email")
    .eq("id", msg.recipient_id)
    .single();
  if (!recipient?.email) return NextResponse.json({ ok: true, notified: 0 });

  // Sender's company name (falls back to their profile name).
  const { data: senderFwd } = await admin
    .from("forwarder_companies")
    .select("company_name")
    .eq("owner_id", msg.sender_id)
    .maybeSingle();
  let senderName = senderFwd?.company_name ?? null;
  if (!senderName) {
    const { data: senderProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", msg.sender_id)
      .single();
    senderName = senderProfile?.full_name ?? "A member";
  }

  await sendEmails([
    {
      to: recipient.email,
      subject: `New message from ${senderName}`,
      html: emailShell({
        heading: "You have a new message",
        bodyHtml: `<p style="font-size:15px;color:#22303C;"><strong>${escapeHtml(
          senderName
        )}</strong> sent you a direct message on the platform.</p>`,
        ctaLabel: "Read & reply",
        ctaPath: "/messages",
      }),
    },
  ]);

  console.log(`[message-created] notified recipient of DM from ${senderName}`);
  return NextResponse.json({ ok: true, notified: 1 });
}
