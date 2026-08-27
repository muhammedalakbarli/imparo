// Seriya qoruyucusu (streak freeze) — buraxılmış günü örtür. Server tərəfdə tavan 2 (RPC
// parametr qəbul ETMİR, təhlükəsizlik üçün — bax migration 0033).
import { supabase } from "./supabase";

export const MAX_FREEZES = 2;

export async function grantStreakFreeze(): Promise<number> {
  try {
    const { data } = await supabase.rpc("grant_streak_freeze");
    return typeof data === "number" ? data : 0;
  } catch { return 0; }
}
