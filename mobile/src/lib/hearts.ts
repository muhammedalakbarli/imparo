// Canlar (hearts) — server RPC ilə (zaman əsaslı bərpa serverdə). Web ilə eyni backend.
import { supabase } from "./supabase";

export const MAX_HEARTS = 5;

export async function loadHearts(): Promise<number> {
  try {
    const { data } = await supabase.rpc("get_hearts");
    return typeof data === "number" ? data : MAX_HEARTS;
  } catch {
    return MAX_HEARTS;
  }
}

export async function loseHeart(): Promise<number> {
  try {
    const { data } = await supabase.rpc("lose_heart");
    return typeof data === "number" ? data : MAX_HEARTS;
  } catch {
    return MAX_HEARTS;
  }
}

export async function refillHearts(): Promise<number> {
  try {
    const { data } = await supabase.rpc("refill_hearts_full");
    return typeof data === "number" ? data : MAX_HEARTS;
  } catch { return MAX_HEARTS; }
}
