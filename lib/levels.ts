// İstifadəçi səviyyəsi — ümumi XP-dən hesablanır (DB-siz, xam XP user_stats-dadır).
// Səviyyəyə çatmaq üçün kumulyativ XP: cumulative(L) = 50·L·(L-1).
//   L1=0, L2=100, L3=300, L4=600, L5=1000, L6=1500 ... (növbəti səviyyə = 100·L XP).

export interface LevelInfo {
  level: number;
  xpInLevel: number; // cari səviyyədə toplanan XP
  xpForNext: number; // bu səviyyədən növbətiyə lazım olan XP
  progress: number; // 0..1
  titleKey: string; // i18n açarı (məs. "level.explorer")
}

const cumulative = (level: number) => 50 * level * (level - 1);

// Səviyyə → titul açarı (i18n-də tərcümə olunur).
function titleKeyForLevel(level: number): string {
  if (level >= 15) return "level.legend";
  if (level >= 10) return "level.master";
  if (level >= 6) return "level.knower";
  if (level >= 3) return "level.explorer";
  return "level.beginner";
}

export function levelFromXp(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.min(Math.floor(xp || 0), 1_000_000_000));
  // cumulative(L) <= xp şərtini ödəyən ən böyük L.
  let level = Math.floor((1 + Math.sqrt(1 + safeXp / 12.5)) / 2);
  if (level < 1) level = 1;
  while (cumulative(level + 1) <= safeXp) level += 1;
  while (cumulative(level) > safeXp && level > 1) level -= 1;

  const xpInLevel = safeXp - cumulative(level);
  const xpForNext = cumulative(level + 1) - cumulative(level); // = 100·level
  return {
    level,
    xpInLevel,
    xpForNext,
    progress: xpForNext ? Math.min(xpInLevel / xpForNext, 1) : 0,
    titleKey: titleKeyForLevel(level),
  };
}
