// Canlar (hearts) — Duolingo-üslubu. Maksimum 5; dərsdə səhv cavab 1 can aparır;
// zamanla bərpa (server RPC-də, bax 0020 migration). RPC yoxdursa/xəta olsa 5 qaytarır
// (graceful — can sistemi öyrənməni bloklamamalıdır).

import { createClient } from "./supabase/client";

export const MAX_HEARTS = 5;

export async function loadHearts(): Promise<number> {
  try {
    const { data } = await createClient().rpc("get_hearts");
    return typeof data === "number" ? data : MAX_HEARTS;
  } catch {
    return MAX_HEARTS;
  }
}

export async function loseHeart(): Promise<number> {
  try {
    const { data } = await createClient().rpc("lose_heart");
    return typeof data === "number" ? data : MAX_HEARTS;
  } catch {
    return MAX_HEARTS;
  }
}

export async function refillHearts(): Promise<number> {
  try {
    const { data } = await createClient().rpc("refill_hearts_full");
    return typeof data === "number" ? data : MAX_HEARTS;
  } catch {
    return MAX_HEARTS;
  }
}
