// SERVER-ONLY Supabase client (service_role) — RLS-i keçir, is_plus yaza bilir.
// YALNIZ server (API route/webhook) daxilində istifadə et; heç vaxt client-ə import etmə.
//
// SUPABASE_SERVICE_ROLE_KEY Cloudflare Worker SECRET-idir — `process.env`-dən OXUNMUR
// (OpenNext-in Cloudflare adapteri process.env-i Worker secret-ləri ilə doldurmur).
// Buna görə async və `getCloudflareContext().env` işlədilir. Bax cloudflare-env.d.ts.
// NEXT_PUBLIC_SUPABASE_URL isə build zamanı Next.js tərəfindən inline edilir —
// o, adi process.env ilə işləyir (runtime Worker env-dən asılı deyil).

import { createClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const { env } = await getCloudflareContext({ async: true });
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin mühiti yoxdur (SERVICE_ROLE_KEY)");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
