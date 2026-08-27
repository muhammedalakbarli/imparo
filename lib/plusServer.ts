// Plus-u SERVER tərəfdən aktivləşdir/söndür (ödəniş webhooku üçün). service_role işlədir —
// user_stats.is_plus qoruyucu trigger service_role-a icazə verir (bax 0025 migration).

import { adminClient } from "./supabase/admin";

export async function grantPlusServer(userId: string, months: number): Promise<void> {
  const until = new Date();
  until.setMonth(until.getMonth() + Math.max(1, months));
  const admin = await adminClient();
  await admin
    .from("user_stats")
    .upsert(
      { user_id: userId, is_plus: true, plus_until: until.toISOString() },
      { onConflict: "user_id" },
    );
}

export async function revokePlusServer(userId: string): Promise<void> {
  const admin = await adminClient();
  await admin.from("user_stats").update({ is_plus: false, plus_until: null }).eq("user_id", userId);
}
