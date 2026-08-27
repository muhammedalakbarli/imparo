// İstifadəçi irəliləyişi — Supabase verilənlər bazasında saxlanılır.
// XP və streak → user_stats; tamamlanmış dərslər → user_progress.
// Bütün yazılar autentifikasiya olunmuş client ilə gedir (RLS: yalnız öz sətirləri).

import { createClient } from "./supabase/client";

export interface ProgressState {
  totalXp: number;
  streakDays: number;
  lastActiveDate: string | null; // "YYYY-MM-DD"
  streakFreezes: number; // seriya qoruyucuları (buraxılmış günü örtür)
  gems: number; // zümrüd (oyun valyutası)
  completedLessons: string[]; // tamamlanmış dərs id-ləri
}

const emptyState: ProgressState = {
  totalXp: 0,
  streakDays: 0,
  lastActiveDate: null,
  streakFreezes: 0,
  gems: 0,
  completedLessons: [],
};

// Bugünün tarixi (Asia/Baku) — "YYYY-MM-DD". Serverdəki streak məntiqi ilə eyni zona.
function bakuToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Baku" });
}

// Saxlanmış streak yalnız aktivlik olanda serverdə yenilənir. Oxuyanda isə real
// vəziyyəti göstərmək lazımdır: son aktivlik bugün və ya dünəndirsə seriya durur,
// daha köhnədirsə seriya qırılıb (0). Belə: bir neçə gün girməyəndə "1 gün" qalmaz.
export function effectiveStreak(
  streakDays: number,
  lastActiveDate: string | null,
  streakFreezes = 0,
): number {
  if (!lastActiveDate) return 0;
  const today = bakuToday();
  const dayBefore = (iso: string, n: number): string => {
    const d = new Date(iso + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const yesterday = dayBefore(today, 1);
  if (lastActiveDate === today || lastActiveDate === yesterday) return streakDays;
  // 1 gün buraxılıb, amma freeze var → seriya hələ də sağdır (növbəti aktivlikdə freeze
  // serverdə işlədiləcək). Beləcə istifadəçi bir gün buraxsa da 0-a düşdüyünü görmür.
  for (let skip = 1; skip <= streakFreezes + 1; skip++) {
    if (lastActiveDate === dayBefore(today, skip + 1)) return streakDays;
  }
  return 0;
}

// Profil sətrini yaradır (user_progress/user_stats ona FK ilə bağlıdır).
// İlk girişdə çağırılır; varsa toxunmur.
export async function ensureProfile(userId: string, name: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("profiles")
    .upsert({ id: userId, name: name || "İstifadəçi" }, { onConflict: "id", ignoreDuplicates: true });
}

// İstifadəçinin irəliləyişini DB-dən oxuyur.
export async function loadProgress(userId: string): Promise<ProgressState> {
  const supabase = createClient();
  const [statsRes, progRes] = await Promise.all([
    supabase
      .from("user_stats")
      .select("total_xp, streak_days, last_active_date, streak_freezes, gems")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("user_progress").select("lesson_id").eq("user_id", userId),
  ]);

  const stats = statsRes.data;
  const rows = progRes.data ?? [];
  const lastActiveDate = stats?.last_active_date ?? null;
  const streakFreezes = stats?.streak_freezes ?? 0;
  return {
    totalXp: stats?.total_xp ?? 0,
    // Qırılmış seriyanı oxuyanda 0 göstər (server yalnız növbəti dərsdə yeniləyir).
    streakDays: effectiveStreak(stats?.streak_days ?? 0, lastActiveDate, streakFreezes),
    lastActiveDate,
    streakFreezes,
    gems: stats?.gems ?? 0,
    completedLessons: rows.map((r: { lesson_id: string }) => r.lesson_id),
  };
}

// Aktiv günlər — istifadəçinin dərs tamamladığı tarixlər (Asia/Baku, "YYYY-MM-DD").
// Streak təqvimini (Duolingo üslubu) doldurmaq üçün. completed_at hər dərsin ilk
// tamamlanma vaxtıdır; son aktivlik günü ayrıca əlavə olunur.
export async function loadActiveDays(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_progress")
    .select("completed_at")
    .eq("user_id", userId);
  const days = new Set<string>();
  for (const r of (data ?? []) as { completed_at: string }[]) {
    days.add(new Date(r.completed_at).toLocaleDateString("en-CA", { timeZone: "Asia/Baku" }));
  }
  return [...days];
}

// Dərs tamamlananda: server HƏQİQİ tapşırıq sayından mükafatı özü hesablayır və idempotentdir
// (eyni dərs ikinci dəfə "bitirilsə" mükafat verilmir) — client heç bir məbləğ göndərmir.
// Bax migration 0037 (complete_lesson RPC). grantReward=false — yalnız onboarding diaqnostikası
// üçün (bildiyi dərsi XP-siz "bilinən" kimi işarələmək).
export async function completeLesson(
  lessonId: string,
  grantReward = true,
): Promise<{ xp: number; gems: number }> {
  const supabase = createClient();
  const { data } = await supabase
    .rpc("complete_lesson", { p_lesson_id: lessonId, p_grant_reward: grantReward })
    .single();
  const row = data as { xp: number; gems: number } | null;
  return { xp: row?.xp ?? 0, gems: row?.gems ?? 0 };
}

// Statistikaya əlavə XP yaz (məs. gündəlik quest mükafatı) — streak-ə toxunmadan.
// userId artıq lazım deyil (RPC auth.uid() işlədir), imza uyğunluq üçün saxlanılır.
export async function addXp(_userId: string, amount: number): Promise<void> {
  if (!amount) return;
  const supabase = createClient();
  await supabase.rpc("add_user_xp", { p_amount: amount, p_touch_streak: false });
}

// Seriya qoruyucu (freeze) qazan — server tərəfdə tavan 2 (RPC parametr qəbul ETMİR, təhlükəsizlik
// üçün — bax migration 0033). Gündəlik sandıq açılanda çağırılır. Yeni freeze sayını qaytarır.
export async function grantStreakFreeze(): Promise<number> {
  try {
    const supabase = createClient();
    const { data } = await supabase.rpc("grant_streak_freeze");
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}

// Dərs kiliddədirmi? Fəndəki əvvəlki dərs tamamlanmayıbsa kiliddədir (ilk dərs həmişə açıqdır).
export type LessonUIState = "done" | "current" | "locked";

// Dərsin path-dakı vəziyyəti — CİDDİ ARDICIL model.
// `order` — fəndəki dərs id-lərinin sırası (yuxarıdan aşağıya).
// Qayda: ilk tamamlanmamış dərs "cari"dir; ondan ƏVVƏLKİLƏR "done";
// ondan SONRAKILAR — əvvəllər tamamlanmış olsa belə — "locked".
// Beləcə məzmun yenidən sıralanıb/əlavə olunsa da tullanmaq mümkün olmur.
export function lessonState(
  order: string[],
  lessonId: string,
  completed: string[],
): LessonUIState {
  const idx = order.indexOf(lessonId);
  if (idx < 0) return "locked";
  const frontier = order.findIndex((id) => !completed.includes(id));
  if (frontier === -1) return "done"; // bütün dərslər tamam
  if (idx < frontier) return "done";
  if (idx === frontier) return "current";
  return "locked";
}

export { emptyState };
