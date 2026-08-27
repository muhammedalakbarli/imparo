// Brauzer (client) üçün Supabase client-i.
// "use client" komponentlərində istifadə olunur (login/signup, auth vəziyyəti).

import { createBrowserClient } from "@supabase/ssr";

// `secure` cookie brauzer tərəfindən YALNIZ HTTPS-də qəbul olunur — lokal HTTP (localhost:3000)
// inkişafda onu qoysaq, sessiya heç saxlanmaz. Ona görə yalnız HTTPS-də tətbiq edirik.
const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // httpOnly YOXDUR (qəsdən) — bax lib/supabase/server.ts.
    { cookieOptions: { secure: isHttps, sameSite: "lax" } },
  );
}
