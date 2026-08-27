// Gündəlik challenge — bu gün tamamlanıb-tamamlanmadığını user_metadata-da izləyir.

import { createClient } from "./supabase/client";

// Yerli tarix "YYYY-MM-DD" (istifadəçinin saat qurşağına görə).
export function todayKey(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function isDailyDone(meta: { dailyDoneDate?: string } | undefined | null): boolean {
  return !!meta && meta.dailyDoneDate === todayKey();
}

export async function markDailyDone(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { dailyDoneDate: todayKey() } });
  } catch {
    // sükutla ötür
  }
}
