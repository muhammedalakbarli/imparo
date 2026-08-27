// Zümrüd (gems) — dərsə görə mükafat. Web ilə eyni RPC (add_gems).
import { supabase } from "./supabase";

export const GEMS_PER_LESSON = 5;

export async function addGems(amount: number): Promise<void> {
  try {
    await supabase.rpc("add_gems", { p_amount: amount });
  } catch {
    /* sükutla keç */
  }
}

export const SHOP_PRICES = { refillHearts: 50, streakFreeze: 100 };

// Cari balans (xərcləmədən oxu — spend_gems(0)).
export async function loadGems(): Promise<number> {
  try {
    const { data } = await supabase.rpc("spend_gems", { p_amount: 0 });
    return typeof data === "number" ? data : 0;
  } catch { return 0; }
}

// Zümrüd xərclə → qalan balans (kifayət deyilsə mənfi).
export async function spendGems(amount: number): Promise<number> {
  try {
    const { data } = await supabase.rpc("spend_gems", { p_amount: amount });
    return typeof data === "number" ? data : -1;
  } catch { return -1; }
}
