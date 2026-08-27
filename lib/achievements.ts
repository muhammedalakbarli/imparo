// Pilləli nişanlar (achievements) — user_stats-dən hesablanır (DB-siz).
// Hər nişanın bürünc/gümüş/qızıl astanası var; tier = keçilmiş astana sayı (0..3).

import type { ProgressState } from "./progress";
import { levelFromXp } from "./levels";

export type AchievementKind = "xp" | "streak" | "lessons" | "level";

export interface AchievementDef {
  id: string;
  kind: AchievementKind;
  titleKey: string;
  thresholds: [number, number, number]; // bürünc, gümüş, qızıl
}

export interface Achievement extends AchievementDef {
  value: number; // cari stat
  tier: number; // 0..3 (neçə astana keçilib)
  nextGoal: number | null; // növbəti astana (qızıl keçilibsə null)
  progress: number; // növbəti astanaya doğru 0..1
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "xp", kind: "xp", titleKey: "ach.xp", thresholds: [100, 500, 2000] },
  { id: "streak", kind: "streak", titleKey: "ach.streak", thresholds: [3, 7, 30] },
  { id: "lessons", kind: "lessons", titleKey: "ach.lessons", thresholds: [5, 25, 50] },
  { id: "level", kind: "level", titleKey: "ach.level", thresholds: [5, 10, 15] },
];

function statValue(kind: AchievementKind, state: ProgressState): number {
  switch (kind) {
    case "xp":
      return state.totalXp;
    case "streak":
      return state.streakDays;
    case "lessons":
      return state.completedLessons.length;
    case "level":
      return levelFromXp(state.totalXp).level;
  }
}

export function computeAchievements(state: ProgressState): Achievement[] {
  return ACHIEVEMENTS.map((def) => {
    const value = statValue(def.kind, state);
    const tier = def.thresholds.filter((t) => value >= t).length;
    const prevGoal = tier > 0 ? def.thresholds[tier - 1] : 0;
    const nextGoal = tier < 3 ? def.thresholds[tier] : null;
    const progress =
      nextGoal === null ? 1 : Math.min((value - prevGoal) / (nextGoal - prevGoal), 1);
    return { ...def, value, tier, nextGoal, progress };
  });
}
