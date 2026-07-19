import { NextResponse } from "next/server";
import { kesApproxLine } from "@/lib/rates";

export const runtime = "nodejs";

// Approximate display conversions for a KES amount (default: Premium price).
// Cached daily upstream in lib/rates; charging always happens in KES.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const amount = Number(searchParams.get("amount") ?? "2500") || 2500;
  const approx = await kesApproxLine(amount);
  return NextResponse.json({ approx });
}
