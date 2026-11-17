// Aylıq XP — user_metadata-da (ay dəyişəndə sıfırlanır). Aylıq nişan üçün.

import { createClient } from "./supabase/client";

export function monthKey(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA").slice(0, 7); // "YYYY-MM"
}

export interface MonthlyState {
  month: string;
  xp: number;
}

function normalize(raw: unknown): MonthlyState {
  const m = monthKey();
  const s = (raw ?? {}) as Partial<MonthlyState>;
  if (s.month !== m) return { month: m, xp: 0 };
  return { month: m, xp: s.xp ?? 0 };
}

export function loadMonthly(meta: unknown): MonthlyState {
  return normalize((meta as { monthlyState?: unknown } | null)?.monthlyState);
}

export async function addMonthlyXp(amount: number): Promise<void> {
  if (amount <= 0) return;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const cur = normalize(user.user_metadata?.monthlyState);
    await supabase.auth.updateUser({
      data: { monthlyState: { month: cur.month, xp: cur.xp + amount } },
    });
  } catch {
    // sükutla ötür
  }
}

/** Aylıq nişan hədləri: bürünc · gümüş · qızıl (XP). */
export const MONTHLY_TIERS = [50, 200, 500] as const;

// Aylıq nişan pilləsi (0-3) aylıq XP-dən.
export function monthlyBadgeTier(xp: number): number {
  return xp >= MONTHLY_TIERS[2] ? 3 : xp >= MONTHLY_TIERS[1] ? 2 : xp >= MONTHLY_TIERS[0] ? 1 : 0;
}
