// GET /api/client-ip — real client IP-ni qaytarır (Cloudflare/proxy başlıqlarından).
// Client-side signup rate-limit yoxlaması üçün (bax lib/auth.ts, migration 0038) — browser JS-də
// sorğu başlıqlarına birbaşa giriş yoxdur, ona görə bu kiçik server endpoint lazımdır.

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";
  return NextResponse.json({ ip });
}
