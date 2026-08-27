// Liqa — həftəlik kohort (eyni pillə). Real istifadəçilər (get_cohort RPC) + deterministik
// botlarla 15 nəfərə tamamlanır (web ilə eyni alqoritm → botlar real istifadəçidən seçilmir).
import { supabase } from "./supabase";

export const MAX_TIER = 4;
export const TIER_NAMES = ["Bürünc", "Gümüş", "Qızıl", "Platin", "Almaz"];
export const TIER_COLORS = ["#CD7F32", "#9CA3AF", "#F5B60A", "#38BDF8", "#22D3EE"];

export interface CohortRow {
  userId: string;
  name: string;
  weeklyXp: number;
  tier: number;
  isMe: boolean;
  isBot: boolean;
  color: string;
  initial: string;
}

// ISO həftə açarı "YYYY-Www".
export function weekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Deterministik hash (FNV-1a) → 0..1.
function seedHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

const BOT_NAMES = [
  "Aygün", "Tural", "Nigar", "Elvin", "Leyla", "Rəşad", "Günel", "Kamran",
  "Aysel", "Orxan", "Səbinə", "Murad", "Zəhra", "Elnur", "Nərmin", "Ceyhun",
  "Aytac", "Ramil", "Fidan", "Vüsal", "Xəyalə", "Ayxan", "Sevinc", "Ruslan",
  "Gülnar", "Emin", "Türkan", "Nihad",
];
const TIER_XP: [number, number][] = [[20, 250], [60, 400], [120, 550], [200, 700], [300, 900]];
const AV_COLORS = ["#F47B3A", "#E9A23B", "#2FB170", "#38BDF8", "#A78BFA", "#FF6B5E", "#F5B60A"];

function clampTier(t: number) { return Math.max(0, Math.min(MAX_TIER, Math.floor(t))); }

function makeBots(count: number, tier: number, week: string): CohortRow[] {
  const t = clampTier(tier);
  const nameOff = Math.floor(seedHash(`${week}:${t}:names`) * BOT_NAMES.length);
  const out: CohortRow[] = [];
  for (let i = 0; i < Math.max(0, count); i++) {
    const key = `${week}:${t}:${i}`;
    const name = BOT_NAMES[(nameOff + i) % BOT_NAMES.length];
    const [lo, hi] = TIER_XP[t];
    out.push({
      userId: `bot-${t}-${i}`,
      name,
      weeklyXp: Math.round(lo + seedHash(key) * (hi - lo)),
      tier: t,
      isMe: false,
      isBot: true,
      color: AV_COLORS[Math.floor(seedHash(`${key}:c`) * AV_COLORS.length)],
      initial: name.charAt(0),
    });
  }
  return out;
}

export async function loadMyLeagueTier(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const { data } = await supabase.from("league").select("tier").eq("user_id", user.id).maybeSingle();
    return data?.tier ?? 0;
  } catch { return 0; }
}

export async function loadCohort(size = 15): Promise<CohortRow[]> {
  try {
    const week = weekKey();
    const [res, tier] = await Promise.all([
      supabase.rpc("get_cohort", { p_week: week, p_size: size }),
      loadMyLeagueTier(),
    ]);
    const real: CohortRow[] = ((res.data ?? []) as any[]).map((r) => ({
      userId: r.user_id,
      name: r.name || "İstifadəçi",
      weeklyXp: r.weekly_xp ?? 0,
      tier: r.tier ?? tier,
      isMe: !!r.is_me,
      isBot: false,
      color: AV_COLORS[Math.floor(seedHash(String(r.user_id)) * AV_COLORS.length)],
      initial: (r.name || "İ").charAt(0),
    }));
    const bots = makeBots(size - real.length, tier, week);
    return [...real, ...bots].sort((a, b) => b.weeklyXp - a.weeklyXp);
  } catch { return []; }
}

// Həftəlik XP artır (dərs mükafatı verildikdə).
export async function addLeaderboardXp(amount: number): Promise<void> {
  if (amount <= 0) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const name = (user.user_metadata?.name as string | undefined)?.trim() || "İstifadəçi";
    await supabase.rpc("add_leaderboard_xp", { p_week: weekKey(), p_name: name, p_amount: Math.round(amount) });
  } catch { /* liqa kritik deyil */ }
}

export async function maybeLeagueRollover(): Promise<void> {
  try { await supabase.rpc("maybe_league_rollover"); } catch {}
}
