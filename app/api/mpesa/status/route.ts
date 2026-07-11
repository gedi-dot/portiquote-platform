import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Lightweight polling endpoint: the upgrade page checks this until the payment
// resolves. RLS ensures a user can only read their own payments.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("paymentId");
  if (!id) return NextResponse.json({ error: "paymentId required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data } = await supabase
    .from("payments")
    .select("status, mpesa_receipt")
    .eq("id", id)
    .single();

  return NextResponse.json({
    status: data?.status ?? "unknown",
    receipt: data?.mpesa_receipt ?? null,
  });
}
