// Müəllim qeydiyyatı — dəvət linki, strukturlu müraciət, "müəllim niyyəti".
// Bax: supabase/migrations/0063_teacher_onboarding.sql
//
// "MÜƏLLİM NİYYƏTİ" NƏDİR
// Google girişi brauzeri saytdan çıxarır və /auth/callback → /dashboard-a qaytarır.
// Yeni hesab o anda "onboarded" deyil, ona görə adi halda ŞAGİRD onboardinginə
// düşərdi. Müəllim axınına başlayan şəxsin niyyəti localStorage-da saxlanılır və
// qayıdandan sonra `useAuthUser` + `TeacherIntentRedirect` onu /muellim-ol-a
// qaytarır. URL parametrinə (redirect_to?next=) QƏSDƏN güvənilmir: Supabase
// redirect allowlist-i yol uyğunluğunda etibarsızdır (bax RecoveryRedirect).

import { createClient } from "./supabase/client";

export const TEACHER_INTENT_KEY = "imparo.teacherIntent";
/** Niyyət bu müddətdən sonra unudulur — yarımçıq axın hesabı əbədi tələyə salmasın. */
export const TEACHER_INTENT_TTL_MS = 2 * 60 * 60 * 1000;

export interface TeacherIntent {
  invite?: string;
  at: number;
}

type KV = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function store(): KV | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Dəvət tokeni formatı (DB ilə eyni: 32 hex simvol). */
export function isInviteToken(s: string | null | undefined): s is string {
  return typeof s === "string" && /^[0-9a-f]{32}$/.test(s);
}

export function setTeacherIntent(invite?: string | null, kv: KV | null = store(), now = Date.now()): void {
  if (!kv) return;
  const v: TeacherIntent = { at: now, ...(isInviteToken(invite) ? { invite } : {}) };
  try {
    kv.setItem(TEACHER_INTENT_KEY, JSON.stringify(v));
  } catch {
    /* gizli rejim və s. — axın yenə də işləyir, sadəcə avtomatik qayıdış olmur */
  }
}

export function getTeacherIntent(kv: KV | null = store(), now = Date.now()): TeacherIntent | null {
  if (!kv) return null;
  try {
    const raw = kv.getItem(TEACHER_INTENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<TeacherIntent>;
    if (typeof v.at !== "number" || now - v.at > TEACHER_INTENT_TTL_MS || v.at > now + 60_000) {
      kv.removeItem(TEACHER_INTENT_KEY);
      return null;
    }
    return { at: v.at, ...(isInviteToken(v.invite) ? { invite: v.invite } : {}) };
  } catch {
    return null;
  }
}

export function clearTeacherIntent(kv: KV | null = store()): void {
  try {
    kv?.removeItem(TEACHER_INTENT_KEY);
  } catch {
    /* yox */
  }
}

/** Niyyətə görə müəllim axınının ünvanı. */
export function teacherFlowPath(intent: TeacherIntent | null): string {
  return intent?.invite ? `/muellim-ol?devet=${intent.invite}` : "/muellim-ol";
}

// ── Dəvət ────────────────────────────────────────────────────────────────────

export type InviteStatus = "ok" | "not_found" | "revoked" | "expired" | "used_up";
export interface InviteInfo {
  status: InviteStatus;
  email_hint: string | null;
  needs_google: boolean;
}

export async function teacherInviteInfo(token: string): Promise<InviteInfo> {
  const fallback: InviteInfo = { status: "not_found", email_hint: null, needs_google: false };
  if (!isInviteToken(token)) return fallback;
  const { data, error } = await createClient().rpc("teacher_invite_info", { p_token: token });
  if (error || !data) return fallback;
  return data as InviteInfo;
}

export type ClaimResult =
  | "ok"
  | "already"
  | "not_found"
  | "revoked"
  | "expired"
  | "used_up"
  | "email_mismatch"
  | "need_google"
  | "auth_required"
  | "error";

export async function claimTeacherInvite(token: string): Promise<ClaimResult> {
  const { data, error } = await createClient().rpc("claim_teacher_invite", { p_token: token });
  if (error) return "error";
  return (data as ClaimResult) ?? "error";
}

// ── Müraciət ─────────────────────────────────────────────────────────────────

export const TEACHER_SUBJECTS = [
  "Riyaziyyat",
  "Azərbaycan dili",
  "İngilis dili",
  "İbtidai siniflər",
  "İnformatika",
  "Digər",
] as const;

export interface TeacherRequestInput {
  school: string;
  subject: string;
  note?: string;
}

export function validateTeacherRequest(input: TeacherRequestInput): string | null {
  if (input.school.trim().length < 2) return "Məktəbin adını yazın.";
  if (!input.subject.trim()) return "Fənni seçin.";
  return null;
}

/**
 * Müraciəti göndər və admin-ə bildiriş tələb et. Bildiriş alınmasa da müraciət
 * qüvvədədir — admin onu /admin/muellimler növbəsində görür.
 */
export async function submitTeacherRequest(input: TeacherRequestInput): Promise<{ ok: boolean; error?: string }> {
  const bad = validateTeacherRequest(input);
  if (bad) return { ok: false, error: bad };
  const { error } = await createClient().rpc("request_teacher", {
    p_note: input.note?.trim() ?? "",
    p_school: input.school.trim(),
    p_subject: input.subject.trim(),
  });
  if (error) return { ok: false, error: "Müraciət göndərilmədi. Bir az sonra yenidən cəhd edin." };
  await fetch("/api/teacher/notify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "request" }),
  }).catch(() => null);
  return { ok: true };
}

/** Admin təsdiqindən sonra müəllimə "hesabınız hazırdır" məktubu. */
export async function notifyTeacherApproved(uid: string): Promise<boolean> {
  try {
    const r = await fetch("/api/teacher/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "approved", uid }),
    });
    const j = (await r.json().catch(() => ({}))) as { mailed?: boolean };
    return r.ok && j.mailed === true;
  } catch {
    return false;
  }
}

/**
 * Hesabı müəllim kimi işarələ: şagird onboardingi bir daha göstərilməsin, girişdən
 * sonra birbaşa müəllim panelinə düşsün. `role` yalnız naviqasiya üçündür —
 * icazə HƏMİŞƏ serverdəki `teachers` cədvəlindən yoxlanılır.
 */
export async function markTeacherAccount(): Promise<void> {
  await createClient()
    .auth.updateUser({ data: { role: "teacher", onboarded: true } })
    .catch(() => null);
}

export function isTeacherAccount(meta: Record<string, unknown> | undefined | null): boolean {
  return meta?.role === "teacher";
}

/**
 * Girişdən sonra hara: müəllim axını yarımçıqdırsa ora, müəllim hesabıdırsa
 * müəllim panelinə, qalan hər kəs şagird panelinə.
 */
export function postLoginPath(meta: Record<string, unknown> | undefined | null, intent = getTeacherIntent()): string {
  if (intent) return teacherFlowPath(intent);
  return isTeacherAccount(meta) ? "/mekteb/muellim" : "/dashboard";
}
