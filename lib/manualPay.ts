// Əl ilə ödəniş (kart köçürməsi / m10) — client qatı (migration 0059).
//
// Niyə var: LemonSqueezy mağazası təsdiq gözlədiyi üçün test rejimindən çıxa
// bilmir. Bu axın xarici provayderdən ASILI DEYİL: valideyn köçürmə edir, qəbz
// nömrəsini yazır, admin bank tərəfdə yoxlayıb təsdiqləyir.

import { createClient } from "./supabase/client";

/** Ödəniş rekvizitləri .env-dən gəlir — kod içində saxlanılmır. */
export const PAY_TARGET = {
  card: process.env.NEXT_PUBLIC_MANUAL_PAY_CARD ?? "",
  m10: process.env.NEXT_PUBLIC_MANUAL_PAY_M10 ?? "",
  name: process.env.NEXT_PUBLIC_MANUAL_PAY_NAME ?? "",
};

/** Rekvizit yoxdursa əl ilə ödəniş bölməsi ÜMUMİYYƏTLƏ göstərilmir. */
export const manualPayEnabled = (): boolean => !!(PAY_TARGET.card || PAY_TARGET.m10);

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await createClient().rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export type PayKind = "plus" | "sponsor";
export type PayMethod = "card" | "m10" | "other";
export type PayStatus = "pending" | "approved" | "rejected";

export interface MyPaymentRequest {
  id: string;
  kind: PayKind;
  plan: string;
  amount_cents: number;
  status: PayStatus;
  reference: string | null;
  created_at: string;
  decided_note: string | null;
}

export const myPaymentRequest = () =>
  rpc<MyPaymentRequest[]>("my_payment_request").then((r) => r?.[0] ?? null).catch(() => null);

export const requestManualPayment = (
  kind: PayKind, plan: string, amountCents: number,
  method: PayMethod, reference: string, note?: string,
) =>
  rpc<string>("request_manual_payment", {
    p_kind: kind, p_plan: plan, p_amount_cents: Math.round(amountCents),
    p_method: method, p_reference: reference || null, p_note: note || null,
  });

/* ── Admin ── */

export interface AdminPaymentRequest {
  id: string;
  user_id: string;
  email: string | null;
  name: string;
  kind: PayKind;
  plan: string;
  amount_cents: number;
  method: PayMethod;
  reference: string | null;
  note: string | null;
  status: PayStatus;
  created_at: string;
  is_plus: boolean;
  plus_until: string | null;
}

export const adminPaymentRequests = () =>
  rpc<AdminPaymentRequest[]>("admin_payment_requests").catch(() => [] as AdminPaymentRequest[]);

export async function adminDecidePaymentRequest(
  id: string, approve: boolean, note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await createClient().rpc("admin_decide_payment_request", {
    p_id: id, p_approve: approve, p_note: note ?? null,
  });
  return { ok: !error, error: error?.message };
}
