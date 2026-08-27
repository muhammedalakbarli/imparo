// Imparo Plus — premium status. Bayraq DB-də (user_stats.is_plus), müştəri YAZA BİLMİR.
// Yalnız ödəniş (webhook/service_role) qoya bilər; oxu get_plus() RPC ilə (təhlükəsiz).
// Bax: supabase/migrations/0024_plus_flag.sql

import { createClient } from "./supabase/client";

// Cari istifadəçinin Plus statusunu oxu (server tərəfdən yoxlanır).
export async function loadPlus(): Promise<boolean> {
  try {
    const { data } = await createClient().rpc("get_plus");
    return data === true;
  } catch {
    return false;
  }
}
