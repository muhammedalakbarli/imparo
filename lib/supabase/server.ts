// Server (RSC / route handler) üçün Supabase client-i.
// Next 16-da `cookies()` async-dır — ona görə funksiya async-dır.
// Gələcəkdə server tərəfdə progress/DB sorğuları üçün istifadə olunacaq.

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  // `secure` cookie-ni brauzer YALNIZ HTTPS-də qəbul edir — lokal HTTP-də qoysaq sessiya itər.
  // Ona görə real protokola baxırıq (Cloudflare/proxy arxasında `x-forwarded-proto`).
  let isHttps = true;
  try {
    const h = await headers();
    isHttps = (h.get("x-forwarded-proto") ?? "https").split(",")[0].trim() === "https";
  } catch {
    // headers() əlçatmazdırsa təhlükəsiz default (secure) qalsın.
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // httpOnly QƏSDƏN yoxdur — middleware-siz arxitekturada brauzer client-i sessiyanı
      // özü yeniləmək üçün JS-dən oxuya/yaza bilməlidir. `secure` yalnız production-da
      // (lokal HTTP inkişafda brauzer secure cookie-ni qəbul etmir → sessiya itərdi).
      cookieOptions: { secure: isHttps, sameSite: "lax" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // RSC-dən çağırılanda cookie yazıla bilməz — səhvi udmaq təhlükəsizdir
          // (sessiya middleware/route handler tərəfindən yenilənir).
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // no-op
          }
        },
      },
    },
  );
}
