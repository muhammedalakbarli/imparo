// Sponsorluğu SERVER tərəfdən qeyd edir (ödəniş webhooku üçün).
//
// `record_sponsorship` RPC-si `authenticated`-dən QƏSDƏN geri alınıb (0057):
// havuzu yalnız real ödəniş böyüdə bilər. Ona görə çağırış service_role ilə gedir —
// eyni prinsip `plusServer.ts`-dəki kimidir.

import { adminClient } from "./supabase/admin";

export async function recordSponsorshipServer(
  userId: string | null,
  seats: number,
  amountCents = 0,
  currency = "AZN",
  note?: string,
): Promise<void> {
  const admin = await adminClient();
  await admin.rpc("record_sponsorship", {
    p_uid: userId,
    p_seats: Math.max(1, Math.round(seats)),
    p_amount_cents: Math.max(0, Math.round(amountCents)),
    p_currency: currency,
    p_note: note ?? null,
  });
}
