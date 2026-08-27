// POST /api/auth/logout — cari sessiyanı bağlayır (session cookie silinir).

import { createClient } from "@/lib/supabase/server";
import { ok } from "@/lib/api/http";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return ok({ success: true });
}
