// İrəliləyiş — user_stats oxu, dərs tamamla (add_user_xp RPC), dərs vəziyyəti.
import { supabase } from "./supabase";

export interface Progress {
  totalXp: number;
  streakDays: number;
  gems: number;
  completedLessons: string[];
}

function bakuToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Baku" });
}
// Qırılmış seriyanı 0 göstər (server yalnız növbəti dərsdə yeniləyir).
function effectiveStreak(streak: number, last: string | null): number {
  if (!last) return 0;
  const today = bakuToday();
  const y = new Date(today + "T00:00:00Z");
  y.setUTCDate(y.getUTCDate() - 1);
  const yest = y.toISOString().slice(0, 10);
  return last === today || last === yest ? streak : 0;
}

export async function loadProgress(userId: string): Promise<Progress> {
  const [statsRes, progRes] = await Promise.all([
    supabase.from("user_stats").select("total_xp, streak_days, last_active_date, gems").eq("user_id", userId).maybeSingle(),
    supabase.from("user_progress").select("lesson_id").eq("user_id", userId),
  ]);
  const s = statsRes.data;
  return {
    totalXp: s?.total_xp ?? 0,
    streakDays: effectiveStreak(s?.streak_days ?? 0, s?.last_active_date ?? null),
    gems: s?.gems ?? 0,
    completedLessons: (progRes.data ?? []).map((r: { lesson_id: string }) => r.lesson_id),
  };
}

// Server HƏQİQİ tapşırıq sayından mükafatı özü hesablayır və idempotentdir (eyni dərs ikinci
// dəfə "bitirilsə" mükafat verilmir) — client heç bir məbləğ göndərmir. Bax migration 0037.
export async function completeLesson(
  lessonId: string,
  grantReward = true,
): Promise<{ xp: number; gems: number }> {
  const { data } = await supabase
    .rpc("complete_lesson", { p_lesson_id: lessonId, p_grant_reward: grantReward })
    .single();
  const row = data as { xp: number; gems: number } | null;
  return { xp: row?.xp ?? 0, gems: row?.gems ?? 0 };
}

// Dərsdən kənar XP (məs. quest mükafatı) — seriyaya toxunmur (web addXp ilə eyni).
export async function addXp(_userId: string, amount: number): Promise<void> {
  if (!amount) return;
  await supabase.rpc("add_user_xp", { p_amount: amount, p_touch_streak: false });
}

export type LessonUIState = "done" | "current" | "locked";
// Ciddi ardıcıl: ilk tamamlanmamış "cari", ondan əvvəlkilər "done", sonrakılar "locked".
export function lessonState(order: string[], id: string, completed: string[]): LessonUIState {
  const done = new Set(completed);
  const firstIncomplete = order.find((x) => !done.has(x));
  if (done.has(id)) return "done";
  if (id === firstIncomplete) return "current";
  return "locked";
}
