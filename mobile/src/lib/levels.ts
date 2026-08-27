// Səviyyə — ümumi XP-dən (webdən port; titul birbaşa AZ mətn).
export interface LevelInfo {
  level: number;
  xpInLevel: number;
  xpForNext: number;
  progress: number;
  title: string;
}
const cumulative = (level: number) => 50 * level * (level - 1);
function titleForLevel(level: number): string {
  if (level >= 15) return "Əfsanə";
  if (level >= 10) return "Usta";
  if (level >= 6) return "Bilici";
  if (level >= 3) return "Kəşfiyyatçı";
  return "Başlanğıc";
}
export function levelFromXp(xp: number): LevelInfo {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  let level = Math.floor((1 + Math.sqrt(1 + safeXp / 12.5)) / 2);
  if (level < 1) level = 1;
  while (cumulative(level + 1) <= safeXp) level += 1;
  while (cumulative(level) > safeXp && level > 1) level -= 1;
  const xpInLevel = safeXp - cumulative(level);
  const xpForNext = cumulative(level + 1) - cumulative(level);
  return {
    level,
    xpInLevel,
    xpForNext,
    progress: xpForNext ? Math.min(xpInLevel / xpForNext, 1) : 0,
    title: titleForLevel(level),
  };
}
