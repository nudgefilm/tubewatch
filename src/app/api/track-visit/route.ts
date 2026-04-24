import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = process.env.VISIT_HASH_SALT ?? "tw-salt";
  const data = encoder.encode(ip + salt);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ipHash = await hashIp(ip);
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10); // YYYY-MM-DD (KST)

  await supabaseAdmin
    .from("site_visits")
    .upsert({ visit_date: today, ip_hash: ipHash }, { onConflict: "visit_date,ip_hash", ignoreDuplicates: true });

  return NextResponse.json({ ok: true });
}
