// Zümrüd (gems) — oyun daxili valyuta. Dərs tamamlananda qazanılır.
// RPC yoxdursa/xəta olsa 0 qaytarır (graceful).

import { createClient } from "./supabase/client";

// Zümrüd əlavə et; yeni cəmi qaytarır.
export async function addGems(amount: number): Promise<number> {
  if (!amount) return 0;
  try {
    const { data } = await createClient().rpc("add_gems", { p_amount: amount });
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}

// Zümrüd xərclə. Kifayətdirsə yeni balansı, çatmırsa -1 qaytarır.
export async function spendGems(amount: number): Promise<number> {
  try {
    const { data } = await createClient().rpc("spend_gems", { p_amount: amount });
    return typeof data === "number" ? data : -1;
  } catch {
    return -1;
  }
}

// Cari zümrüd balansı (xərcləmədən oxu — spend_gems(0)).
export async function loadGems(): Promise<number> {
  return spendGems(0).then((n) => (n < 0 ? 0 : n));
}

// Hər dərsə görə qazanılan zümrüd.
export const GEMS_PER_LESSON = 5;

// Mağaza qiymətləri (zümrüd).
export const SHOP_PRICES = { refillHearts: 50, streakFreeze: 100 };
