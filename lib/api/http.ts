// Route handler-lər üçün ortaq köməkçilər: JSON cavab, xəta formatı, auth guard.
// Bütün API cavabları eyni formada qayıdır: uğur → data, xəta → { error }.

import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "../supabase/server";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// Sorğu gövdəsini təhlükəsiz JSON kimi oxu (yanlış JSON → null).
export async function readJson<T = Record<string, unknown>>(
  req: Request,
): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

// Cari autentifikasiya olunmuş istifadəçini qaytar (yoxdursa null).
// Sessiya cookie-dən oxunur (Supabase SSR). QEYD: cookie httpOnly DEYİL — brauzer client-i
// (middleware-siz arxitektura) sessiyanı özü yeniləmək üçün ona JS-dən yaza bilməlidir.
export async function currentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
