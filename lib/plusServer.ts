// Plus-u SERVER tərəfdən idarə edir (ödəniş webhooku üçün). service_role işlədir —
// `user_stats.is_plus` qoruyucu trigger service_role-a icazə verir (bax 0025).
//
// Müddət ÜSTƏ GƏLİR, üzərinə yazılmır (0058 `grant_plus_paid`): 3 ayı qalmış
// istifadəçi illik alanda həmin 3 ayı itirməməlidir.

import { adminClient } from "./supabase/admin";

/** Plus verir/uzadır və yeni bitmə tarixini qaytarır. */
export async function grantPlusServer(userId: string, days: number): Promise<string | null> {
  const admin = await adminClient();
  const { data, error } = await admin.rpc("grant_plus_paid", {
    p_uid: userId,
    p_days: Math.max(1, Math.round(days)),
  });
  if (error) throw error;
  return (data as string) ?? null;
}

export async function revokePlusServer(userId: string): Promise<void> {
  const admin = await adminClient();
  const { error } = await admin.rpc("revoke_plus_paid", { p_uid: userId });
  if (error) throw error;
}

/**
 * Ödəniş hadisəsini jurnala yazır. `false` qaytarırsa — bu hadisə ARTIQ emal olunub
 * (LemonSqueezy təkrar göndərib) və heç nə edilməməlidir.
 */
export async function claimPaymentEvent(
  id: string,
  event: string,
  userId: string | null,
  kind: string,
  amountCents = 0,
  currency = "AZN",
  detail?: string,
): Promise<boolean> {
  const admin = await adminClient();
  const { data, error } = await admin.rpc("record_payment_event", {
    p_id: id,
    p_event: event,
    p_uid: userId,
    p_kind: kind,
    p_amount_cents: Math.max(0, Math.round(amountCents)),
    p_currency: currency,
    p_detail: detail ?? null,
  });
  if (error) throw error;
  return data === true;
}

/**
 * `claimPaymentEvent`-in qeydini geri alır. Emal yarıda uğursuz olanda çağırılır:
 * qeyd qalsaydı, LemonSqueezy-nin təkrar göndərişi "dublikat" sayılıb atılardı və
 * ödəniş edilmiş Plus/sponsorluq HEÇ VAXT verilməzdi.
 */
export async function releasePaymentEvent(id: string): Promise<void> {
  const admin = await adminClient();
  const { error } = await admin.from("payment_events").delete().eq("id", id);
  if (error) throw error;
}
