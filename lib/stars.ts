// Dərs ulduzları (1–3) — path xəritəsindəki kartlar üçün (migration 0062).
//
// Ulduz "tamamladı" faktından deyil, həmin dərsdəki DƏQİQLİKDƏN hesablanır
// (≥90% → 3, ≥70% → 2, qalan → 1). Beləcə ulduz real göstəricidir və şagirdi
// dərsi təkrarlayıb yaxşılaşdırmağa təşviq edir.

import { createClient } from "./supabase/client";

export interface LessonStar { lesson_id: string; stars: number; accuracy: number }

/** Dərs id → ulduz sayı. Xəta halında boş xəritə (path onsuz da işləyir). */
export async function loadLessonStars(): Promise<Map<string, number>> {
  try {
    const { data, error } = await createClient().rpc("my_lesson_stars");
    if (error || !Array.isArray(data)) return new Map();
    return new Map((data as LessonStar[]).map((r) => [r.lesson_id, r.stars]));
  } catch {
    return new Map();
  }
}
