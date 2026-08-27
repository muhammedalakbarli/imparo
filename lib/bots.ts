// Liqa botları — DB-siz, saf deterministik kimliklər. Real istifadəçilər az olduğu üçün hər
// kohort həftə+pillə üzrə botlarla 15-ə tamamlanır. Eyni `week:tier:index` toxumu həm liqa
// siyahısını, həm klik edilən profili qurur → botlar real istifadəçidən seçilmir və uyğun görünür.

import { defaultAvatar, type AvatarConfig } from "@/components/Avatar";

export const MAX_TIER = 4;

// ISO həftə açarı "YYYY-Www" (leaderboard buradan re-export edir).
export function weekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // bazar=7
  date.setUTCDate(date.getUTCDate() + 4 - day); // cari həftənin cümə axşamı
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Deterministik hash (FNV-1a) → 0..1.
export function seedHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

const BOT_NAMES = [
  "Aygün", "Tural", "Nigar", "Elvin", "Leyla", "Rəşad", "Günel", "Kamran",
  "Aysel", "Orxan", "Səbinə", "Murad", "Zəhra", "Elnur", "Nərmin", "Ceyhun",
  "Aytac", "Ramil", "Fidan", "Vüsal", "Xəyalə", "Ayxan", "Sevinc", "Ruslan",
  "Gülnar", "Emin", "Türkan", "Nihad",
];

// Pillə üzrə həftəlik XP aralığı (aşağı→yuxarı liqa daha güclüdür).
const TIER_XP: [number, number][] = [
  [20, 250], [60, 400], [120, 550], [200, 700], [300, 900],
];

// AZ hərflərini latına çevir — təbii username handle üçün.
const TRANSLIT: Record<string, string> = {
  ə: "e", Ə: "e", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c",
  ş: "s", Ş: "s", ğ: "g", Ğ: "g", ı: "i", İ: "i",
};
function translit(s: string): string {
  return s
    .split("")
    .map((c) => TRANSLIT[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export interface BotIdentity {
  userId: string;
  name: string;
  username: string;
  avatar: AvatarConfig;
  tier: number;
  weeklyXp: number;
  totalXp: number;
  streakDays: number;
  followers: number;
  following: number;
  createdAt: string;
}

function clampTier(t: number): number {
  return Math.max(0, Math.min(MAX_TIER, Math.floor(t)));
}

// Bir botun (pillə, index, həftə) üzrə tam deterministik kimliyi.
export function botIdentity(tier: number, index: number, week: string): BotIdentity {
  const t = clampTier(tier);
  const i = Math.max(0, Math.floor(index));
  const key = `${week}:${t}:${i}`;
  const nameOff = Math.floor(seedHash(`${week}:${t}:names`) * BOT_NAMES.length);
  const name = BOT_NAMES[(nameOff + i) % BOT_NAMES.length];
  const [lo, hi] = TIER_XP[t];
  const weeklyXp = Math.round(lo + seedHash(key) * (hi - lo));
  const handleNum = 10 + Math.floor(seedHash(`${key}:h`) * 89); // 10..98 → unikal-təbii
  const username = `${translit(name)}_${handleNum}`;
  const avatar = defaultAvatar(`${name}-${t}-${i}`);
  const totalXp = weeklyXp * (4 + Math.floor(seedHash(`${key}:tot`) * 20)); // həftəlikdən böyük
  const streakDays = Math.floor(seedHash(`${key}:str`) * 60);
  const followers = Math.floor(seedHash(`${key}:fol`) * 40);
  const following = Math.floor(seedHash(`${key}:fng`) * 30);
  const daysAgo = 30 + Math.floor(seedHash(`${key}:age`) * 300);
  const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    userId: `bot-${t}-${i}`,
    name,
    username,
    avatar,
    tier: t,
    weeklyXp,
    totalXp,
    streakDays,
    followers,
    following,
    createdAt,
  };
}

const BOT_ID_RE = /^bot-(\d+)-(\d+)$/;
export function isBotUserId(key: string): boolean {
  return BOT_ID_RE.test(key);
}

// Cari həftə üçün bütün mümkün botların (5 pillə × 15) handle→kimlik registri.
// Index-dən asılı olmayan superset — istifadəçi hansı botu görürsə görsün, tapılır.
function botRegistry(week: string): Map<string, BotIdentity> {
  const map = new Map<string, BotIdentity>();
  for (let t = 0; t <= MAX_TIER; t++) {
    for (let i = 0; i < 15; i++) {
      const b = botIdentity(t, i, week);
      map.set(b.username, b);
    }
  }
  return map;
}

// Handle və ya bot-id ilə bot kimliyini tap (yoxdursa null).
export function findBot(key: string, week: string = weekKey()): BotIdentity | null {
  const m = BOT_ID_RE.exec(key);
  if (m) return botIdentity(parseInt(m[1], 10), parseInt(m[2], 10), week);
  return botRegistry(week).get(key) ?? null;
}
