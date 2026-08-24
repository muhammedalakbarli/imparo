// Admin CRUD — content cədvəllərinə yazır (RLS `is_admin()` qoruyur).
// Oxuma üçün lib/content/db.ts fetchContentTree istifadə olunur.

import { createClient } from "./supabase/client";
import type { Task, TaskType, RuleSection } from "./types";

// Cari istifadəçi admindirmi?
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data } = await supabase.rpc("is_admin");
    return data === true;
  } catch {
    return false;
  }
}

// Unikal id yarat (parent prefiksi + qısa təsadüfi).
export function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}

type Res = { ok: boolean; error?: string };
async function write(
  fn: () => PromiseLike<{ error: { message: string } | null }>,
): Promise<Res> {
  try {
    const { error } = await fn();
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

// ── Fənlər ──
export interface SubjectInput {
  id: string;
  name: string;
  grade: number;
  icon: string;
  color: string;
  sort_order: number;
}
export function upsertSubject(row: SubjectInput): Promise<Res> {
  const sb = createClient();
  return write(() => sb.from("subjects").upsert(row, { onConflict: "id" }));
}
export function deleteSubject(id: string): Promise<Res> {
  const sb = createClient();
  return write(() => sb.from("subjects").delete().eq("id", id));
}

// ── Bölmələr ──
export interface UnitInput {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  sort_order: number;
}
export function upsertUnit(row: UnitInput): Promise<Res> {
  const sb = createClient();
  return write(() => sb.from("units").upsert(row, { onConflict: "id" }));
}
export function deleteUnit(id: string): Promise<Res> {
  const sb = createClient();
  return write(() => sb.from("units").delete().eq("id", id));
}

// ── Dərslər ──
export interface LessonInput {
  id: string;
  unit_id: string;
  title: string;
  intro: string;
  visual: string | null;
  sections: RuleSection[] | null;
  sort_order: number;
}
export function upsertLesson(row: LessonInput): Promise<Res> {
  const sb = createClient();
  return write(() => sb.from("lessons").upsert(row, { onConflict: "id" }));
}
export function deleteLesson(id: string): Promise<Res> {
  const sb = createClient();
  return write(() => sb.from("lessons").delete().eq("id", id));
}

// ── Tapşırıqlar ──
// Form dəyərləri (tip-spesifik) → jsonb data (seed.ts taskData ilə uyğun).
export interface TaskForm {
  id: string;
  lesson_id: string;
  type: TaskType;
  prompt: string;
  xp: number;
  bonus: boolean;
  sort_order: number;
  // tip-spesifik
  options?: string[];
  correctIndex?: number;
  accepted?: string[];
  answer?: number;
  tolerance?: number;
  words?: string[]; // word_order: söz bankı
  sentence?: string; // word_order: düzgün cümlə
  translation?: string; // word_order: azərbaycanca ipucu (istəyə bağlı)
  audioText?: string; // listening: səsləndiriləcək İngilis mətni
  figure?: Task["figure"];
}

export function buildTaskData(f: TaskForm): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  if (f.figure) d.figure = f.figure;
  if (f.bonus) d.bonus = true;
  if (f.type === "multiple_choice") {
    d.options = f.options ?? [];
    d.correctIndex = f.correctIndex ?? 0;
  } else if (f.type === "fill_blank") {
    d.accepted = f.accepted ?? [];
  } else if (f.type === "word_order") {
    d.words = f.words ?? [];
    d.answer = f.sentence ?? "";
    if (f.translation && f.translation.trim()) d.translation = f.translation.trim();
  } else if (f.type === "listening") {
    d.audioText = f.audioText ?? "";
    d.options = f.options ?? [];
    d.correctIndex = f.correctIndex ?? 0;
  } else {
    d.answer = f.answer ?? 0;
    if (f.tolerance !== undefined) d.tolerance = f.tolerance;
  }
  return d;
}

export function upsertTask(f: TaskForm): Promise<Res> {
  const sb = createClient();
  return write(() =>
    sb.from("tasks").upsert(
      {
        id: f.id,
        lesson_id: f.lesson_id,
        type: f.type,
        prompt: f.prompt,
        data: buildTaskData(f),
        xp: f.xp,
        sort_order: f.sort_order,
      },
      { onConflict: "id" },
    ),
  );
}
export function deleteTask(id: string): Promise<Res> {
  const sb = createClient();
  return write(() => sb.from("tasks").delete().eq("id", id));
}

// ── Sıralama ──
// Verilmiş sıra üzrə hər sətrin sort_order-ini yenilə (0..n-1).
export async function reorderLevel(
  table: "subjects" | "units" | "lessons" | "tasks",
  ids: string[],
): Promise<Res> {
  try {
    const sb = createClient();
    for (let i = 0; i < ids.length; i++) {
      const { error } = await sb.from(table).update({ sort_order: i }).eq("id", ids[i]);
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

// ── Admin · İstifadəçi datası (yalnız is_admin; bax 0026 migration) ──
export interface AdminUserRow {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
  total_xp: number;
  streak_days: number;
  last_active_date: string | null;
  gems: number;
  is_plus: boolean;
  completed: number;
  last_sign_in_at: string | null;
  active_seconds: number;
  provider: string;
  email_confirmed: boolean;
  grade: number | null;
}
export interface AdminUserStats {
  total: number;
  active7: number;
  active30: number;
  plus_count: number;
  new7: number;
  total_xp: number;
}

export async function adminUserStats(): Promise<AdminUserStats | null> {
  try {
    const { data } = await createClient().rpc("admin_user_stats");
    return (data?.[0] as AdminUserStats) ?? null;
  } catch {
    return null;
  }
}

export async function adminUsers(search = "", limit = 200, offset = 0): Promise<AdminUserRow[]> {
  try {
    const { data } = await createClient().rpc("admin_users", {
      p_search: search,
      p_limit: limit,
      p_offset: offset,
    });
    return (data as AdminUserRow[]) ?? [];
  } catch {
    return [];
  }
}

// ── İstifadəçi detalı ──
export interface AdminUserDetail {
  user_id: string;
  email: string;
  name: string;
  username: string | null;
  is_bot: boolean;
  banned: boolean;
  banned_until: string | null;
  ban_reason: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  provider: string;
  total_xp: number;
  streak_days: number;
  gems: number;
  hearts: number;
  is_plus: boolean;
  plus_until: string | null;
  active_seconds: number;
  last_active_date: string | null;
  completed: number;
  subjects: { subject: string; done: number }[];
}

export async function adminUserDetail(uid: string): Promise<AdminUserDetail | null> {
  try {
    const { data } = await createClient().rpc("admin_user_detail", { p_uid: uid });
    return (data as AdminUserDetail) ?? null;
  } catch {
    return null;
  }
}

// ── Admin əməliyyatları ──
export async function adminSetBot(uid: string, isBot: boolean): Promise<Res> {
  const { error } = await createClient().rpc("admin_set_bot", { p_uid: uid, p_is_bot: isBot });
  return { ok: !error, error: error?.message };
}
export async function adminGrantPlus(uid: string, months = 12): Promise<Res> {
  const { error } = await createClient().rpc("admin_grant_plus", { p_uid: uid, p_months: months });
  return { ok: !error, error: error?.message };
}
export async function adminRevokePlus(uid: string): Promise<Res> {
  const { error } = await createClient().rpc("admin_revoke_plus", { p_uid: uid });
  return { ok: !error, error: error?.message };
}
export async function adminDeleteUser(uid: string): Promise<Res> {
  const { error } = await createClient().rpc("admin_delete_user", { p_uid: uid });
  return { ok: !error, error: error?.message };
}

// ── Böyümə / Retensiya ──
export interface AdminGrowth {
  dau: number;
  wau: number;
  mau: number;
  funnel: { signed_up: number; activated: number; retained7: number; plus: number };
  signups_daily: { d: string; n: number }[];
  active_daily: { d: string; n: number }[];
}
export async function adminGrowth(): Promise<AdminGrowth | null> {
  try {
    const { data } = await createClient().rpc("admin_growth");
    return (data as AdminGrowth) ?? null;
  } catch {
    return null;
  }
}

// ── Fənn statistikası ──
export interface AdminSubjectStat {
  subject: string;
  completions: number;
  learners: number;
}
export async function adminSubjectStats(): Promise<AdminSubjectStat[]> {
  try {
    const { data } = await createClient().rpc("admin_subject_stats");
    return (data as AdminSubjectStat[]) ?? [];
  } catch {
    return [];
  }
}

// ── Məktəb (B2B) ──
export interface AdminSchool {
  class_id: string;
  name: string;
  code: string;
  subject_slug: string;
  grade: number;
  teacher_email: string | null;
  members: number;
  assignments: number;
  created_at: string;
}
export async function adminSchools(): Promise<AdminSchool[]> {
  try {
    const { data } = await createClient().rpc("admin_schools");
    return (data as AdminSchool[]) ?? [];
  } catch {
    return [];
  }
}

// ── Elanlar ──
export interface Announcement {
  id: string;
  title: string;
  body: string;
  active: boolean;
  created_at: string;
}
export async function adminListAnnouncements(): Promise<Announcement[]> {
  try {
    const { data } = await createClient().rpc("admin_list_announcements");
    return (data as Announcement[]) ?? [];
  } catch {
    return [];
  }
}
export async function adminPostAnnouncement(title: string, body: string): Promise<Res> {
  const { error } = await createClient().rpc("admin_post_announcement", { p_title: title, p_body: body });
  return { ok: !error, error: error?.message };
}
export async function adminSetAnnouncementActive(id: string, active: boolean): Promise<Res> {
  const { error } = await createClient().rpc("admin_set_announcement_active", { p_id: id, p_active: active });
  return { ok: !error, error: error?.message };
}
export async function adminDeleteAnnouncement(id: string): Promise<Res> {
  const { error } = await createClient().rpc("admin_delete_announcement", { p_id: id });
  return { ok: !error, error: error?.message };
}

// ── Müəllim təsdiqi (Duolingo for Schools kimi) ──
export interface AdminTeacherRequest {
  user_id: string;
  email: string;
  name: string;
  status: string;
  note: string | null;
  created_at: string;
}
export interface AdminTeacher {
  user_id: string;
  email: string;
  name: string;
  approved_at: string;
  classes: number;
}
export async function adminListTeacherRequests(): Promise<AdminTeacherRequest[]> {
  try {
    const { data } = await createClient().rpc("admin_list_teacher_requests");
    return (data as AdminTeacherRequest[]) ?? [];
  } catch { return []; }
}
export async function adminListTeachers(): Promise<AdminTeacher[]> {
  try {
    const { data } = await createClient().rpc("admin_list_teachers");
    return (data as AdminTeacher[]) ?? [];
  } catch { return []; }
}
export async function adminApproveTeacher(uid: string): Promise<Res> {
  const { error } = await createClient().rpc("admin_approve_teacher", { p_uid: uid });
  return { ok: !error, error: error?.message };
}
export async function adminRejectTeacher(uid: string): Promise<Res> {
  const { error } = await createClient().rpc("admin_reject_teacher", { p_uid: uid });
  return { ok: !error, error: error?.message };
}
export async function adminRevokeTeacher(uid: string): Promise<Res> {
  const { error } = await createClient().rpc("admin_revoke_teacher", { p_uid: uid });
  return { ok: !error, error: error?.message };
}

// ── Admin Pro (audit, gəlir, məzmun performansı, rollar) ──
export async function checkIsSuperAdmin(): Promise<boolean> {
  try { const { data } = await createClient().rpc("is_super_admin"); return !!data; } catch { return false; }
}

// ── Təhlükəsizlik monitorinqi (bax migration 0038) ──
export interface AdminSecurityEvent {
  id: number; created_at: string; kind: string; user_id: string | null;
  email: string | null; ip: string | null; detail: Record<string, unknown> | null;
}
export async function adminSecurityEvents(limit = 100): Promise<AdminSecurityEvent[]> {
  try { const { data } = await createClient().rpc("admin_security_events", { p_limit: limit }); return (data as AdminSecurityEvent[]) ?? []; }
  catch { return []; }
}
export interface AdminFlaggedUser {
  user_id: string; email: string | null; name: string | null; cap_hits: number; last_hit: string;
}
export async function adminFlaggedUsers(): Promise<AdminFlaggedUser[]> {
  try { const { data } = await createClient().rpc("admin_flagged_users"); return (data as AdminFlaggedUser[]) ?? []; }
  catch { return []; }
}

export interface AdminAuditRow {
  id: number; admin_email: string | null; action: string;
  target_type: string | null; target_id: string | null; detail: string | null; created_at: string;
}
export async function adminAuditList(limit = 100): Promise<AdminAuditRow[]> {
  try { const { data } = await createClient().rpc("admin_audit_list", { p_limit: limit }); return (data as AdminAuditRow[]) ?? []; }
  catch { return []; }
}

export interface AdminRevenue { active_plus: number; expiring_30: number; expired: number; }
export async function adminRevenue(): Promise<AdminRevenue | null> {
  try { const { data } = await createClient().rpc("admin_revenue"); return (data as AdminRevenue) ?? null; }
  catch { return null; }
}
export interface AdminPlusRow { user_id: string; email: string; name: string; plus_until: string | null; }
export async function adminPlusList(limit = 200): Promise<AdminPlusRow[]> {
  try { const { data } = await createClient().rpc("admin_plus_list", { p_limit: limit }); return (data as AdminPlusRow[]) ?? []; }
  catch { return []; }
}

export interface AdminLessonStat {
  lesson_id: string; title: string; subject: string; grade: number; completions: number; learners: number;
}
export async function adminLessonStats(limit = 200): Promise<AdminLessonStat[]> {
  try { const { data } = await createClient().rpc("admin_lesson_stats", { p_limit: limit }); return (data as AdminLessonStat[]) ?? []; }
  catch { return []; }
}

export interface AdminRow { user_id: string; email: string; name: string; role: string; }
export async function adminListAdmins(): Promise<AdminRow[]> {
  try { const { data } = await createClient().rpc("admin_list_admins"); return (data as AdminRow[]) ?? []; }
  catch { return []; }
}

// ── Analitika (aralıq/retensiya/saatlıq) — migration 0032 ──
export interface DailyPoint { d: string; signups: number; active: number; completions: number; }
export async function adminDailySeries(days = 14): Promise<DailyPoint[]> {
  try { const { data } = await createClient().rpc("admin_daily_series", { p_days: days }); return (data as DailyPoint[]) ?? []; }
  catch { return []; }
}
export interface AdminRetention {
  d1_num: number; d1_den: number; d7_num: number; d7_den: number; d30_num: number; d30_den: number;
}
export async function adminRetention(): Promise<AdminRetention | null> {
  try { const { data } = await createClient().rpc("admin_retention"); return (data as AdminRetention) ?? null; }
  catch { return null; }
}
export interface HourlyPoint { hour: number; cnt: number; }
export async function adminHourlyActivity(): Promise<HourlyPoint[]> {
  try { const { data } = await createClient().rpc("admin_hourly_activity"); return (data as HourlyPoint[]) ?? []; }
  catch { return []; }
}

// ── Moderasiya: ban / bot / sərbəst müddətli Plus (migration 0043 + 0045) ──
// `banned_until = 'infinity'` → həmişəlik ban. Postgres bunu JSON-da "infinity"
// mətni kimi qaytarır — Date() onu parse edə bilmir, ona görə `isForever()` ilə
// yoxlanılır (bütün UI formatlaması bu köməkçidən keçir).
export function isForever(ts: string | null | undefined): boolean {
  return ts === "infinity" || ts === "Infinity";
}

export interface AdminModerationRow {
  user_id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  is_bot: boolean;
  banned_until: string | null;
  ban_reason: string | null;
  is_plus: boolean;
  plus_until: string | null;
  total_xp: number;
  created_at: string;
}

// Botlar + hazırda banlı olan hesablar (tək sorğu, `is_bot`/`banned_until` ilə süzülür).
export async function adminModerationList(): Promise<AdminModerationRow[]> {
  try {
    const { data } = await createClient().rpc("admin_moderation_list");
    return (data as AdminModerationRow[]) ?? [];
  } catch { return []; }
}

// days: null və ya <= 0 → həmişəlik ban.
export async function adminBanUser(uid: string, days: number | null, reason?: string): Promise<Res> {
  const { error } = await createClient().rpc("admin_ban_user", {
    p_uid: uid,
    p_days: days === null || days <= 0 ? null : Math.round(days),
    p_reason: reason?.trim() || null,
  });
  return { ok: !error, error: error?.message };
}
export async function adminUnbanUser(uid: string): Promise<Res> {
  const { error } = await createClient().rpc("admin_unban_user", { p_uid: uid });
  return { ok: !error, error: error?.message };
}

// Gün əsaslı Plus. days <= 0 → həmişəlik. extend = mövcud abunənin üstünə əlavə et.
export async function adminGrantPlusDays(
  uid: string, days: number, extend = false,
): Promise<Res & { until?: string }> {
  const { data, error } = await createClient().rpc("admin_grant_plus_days", {
    p_uid: uid, p_days: Math.round(days), p_extend: extend,
  });
  return { ok: !error, error: error?.message, until: (data as string) ?? undefined };
}

// İstifadəçi öz ban vəziyyətini oxuyur (app tərəfindəki "hesab bloklanıb" ekranı üçün).
export interface BanStatus { banned: boolean; until: string | null; reason: string | null }
export async function myBanStatus(): Promise<BanStatus> {
  try {
    const { data } = await createClient().rpc("my_ban_status");
    const row = (data as BanStatus[])?.[0];
    return row ?? { banned: false, until: null, reason: null };
  } catch { return { banned: false, until: null, reason: null }; }
}
