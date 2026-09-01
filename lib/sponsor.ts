// Sponsorluq və burs — client qatı (migration 0057).
//
// Model: sponsor ödəyir → havuza yer düşür → ehtiyacı olan şagird müraciət edir →
// admin təsdiqləyir → pulsuz Plus verilir. Statistika ictimaidir (aqreqat, PII yoxdur).

import { createClient } from "./supabase/client";

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await createClient().rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export interface SponsorStats {
  sponsors: number;
  seats_funded: number;
  students_helped: number;
  seats_available: number;
}

export const sponsorStats = () =>
  rpc<SponsorStats[]>("sponsor_stats")
    .then((r) => r?.[0] ?? null)
    .catch(() => null);

export type ScholarshipStatus = "pending" | "approved" | "rejected";
export interface MyScholarship {
  status: ScholarshipStatus;
  reason: string | null;
  created_at: string;
  plus_days: number | null;
}

export const myScholarship = () =>
  rpc<MyScholarship[]>("my_scholarship")
    .then((r) => r?.[0] ?? null)
    .catch(() => null);

export const requestScholarship = (reason: string) =>
  rpc<ScholarshipStatus>("request_scholarship", { p_reason: reason });

export const endorseStudent = (classId: string, uid: string) =>
  rpc<null>("teacher_endorse_student", { p_class_id: classId, p_uid: uid });

export interface MySponsorship {
  seats: number;
  amount_cents: number;
  currency: string;
  created_at: string | null;
}
export const mySponsorship = () =>
  rpc<MySponsorship[]>("my_sponsorship")
    .then((r) => r?.[0] ?? null)
    .catch(() => null);

/* ── Admin ── */

export interface AdminScholarshipRow {
  user_id: string;
  email: string | null;
  name: string;
  status: ScholarshipStatus;
  reason: string | null;
  endorser_email: string | null;
  created_at: string;
  is_plus: boolean;
  plus_until: string | null;
}

export const adminScholarshipList = () =>
  rpc<AdminScholarshipRow[]>("admin_scholarship_list").catch(() => [] as AdminScholarshipRow[]);

export async function adminDecideScholarship(
  uid: string, approve: boolean, days = 365,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await createClient().rpc("admin_decide_scholarship", {
    p_uid: uid, p_approve: approve, p_days: days,
  });
  return { ok: !error, error: error?.message };
}

export interface SponsorPool { funded: number; used: number; available: number }
export const sponsorPool = () =>
  rpc<SponsorPool[]>("sponsor_pool").then((r) => r?.[0] ?? null).catch(() => null);
