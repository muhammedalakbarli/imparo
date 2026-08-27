// Həftəlik liqa (leaderboard) — Supabase `leaderboard` cədvəli (bax 0003 migration).
// XP atomik RPC ilə artırılır (race yox); oxuma bütün istifadəçilərin cari həftə sətrini gətirir.

import { createClient } from "./supabase/client";
import { botIdentity, weekKey } from "./bots";

// ISO həftə açarı — saf modulda (bots.ts) saxlanılır; geriyə uyğunluq üçün re-export.
export { weekKey };

// Liqa həftəsinin bitmə anı = növbəti bazar ertəsi 00:00 Asia/Baku (server rollover
// da bu anda işə düşür: pg_cron bazar 20:05 UTC = B.E. 00:05 Baku; maybe_league_rollover
// Asia/Baku ISO həftəsi ilə). İstifadəçinin cihaz saat qurşağından asılı olmadan düzgün
// hesablamaq üçün Baku divar-saatı ilə hesablayıb real ana çeviririk.
export function weekEndsAt(now: Date = new Date()): Date {
  // now → Baku divar-saatı (yerli tz-də təfsir olunan Date)
  const bakuWall = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Baku" }));
  const offset = now.getTime() - bakuWall.getTime(); // yerli − Baku fərqi (ms)
  const day = bakuWall.getDay(); // 0=bazar … 1=B.E. … 6=şənbə
  const addDays = 8 - (day === 0 ? 7 : day); // növbəti B.E.-yə qədər gün (1..7)
  const target = new Date(bakuWall);
  target.setDate(bakuWall.getDate() + addDays);
  target.setHours(0, 0, 0, 0);
  return new Date(target.getTime() + offset); // Baku divar-saatını real ana çevir
}

export interface LeaderRow {
  userId: string;
  name: string;
  xp: number;
}

export interface CohortRow {
  userId: string;
  name: string;
  username: string | null;
  avatar: import("@/components/Avatar").AvatarConfig | null;
  weeklyXp: number;
  tier: number;
  isMe: boolean;
  isBot: boolean;
}

// ── Liqa botları ─────────────────────────────────────────────────
// Real istifadəçilər az olduğu üçün hər kohort həftə+pillə üzrə deterministik
// botlarla 15-ə tamamlanır (rəqabət hissi → oynamağa təşviq). Botlar DB-də deyil,
// oxuma zamanı `botIdentity` (lib/bots.ts) ilə yaradılır; username + avatar daşıyır ki,
// real istifadəçidən seçilməsin və klik edildikdə profilləri (findBot) açılsın.
function makeBots(count: number, tier: number, week: string): CohortRow[] {
  if (count <= 0) return [];
  const bots: CohortRow[] = [];
  for (let i = 0; i < count; i++) {
    const b = botIdentity(tier, i, week);
    bots.push({
      userId: b.userId,
      name: b.name,
      username: b.username,
      avatar: b.avatar,
      weeklyXp: b.weeklyXp,
      tier: b.tier,
      isMe: false,
      isBot: true,
    });
  }
  return bots;
}

// Liqa pilləsi (0..4) → i18n açarı.
export const TIER_KEYS = [
  "league.tier.bronze",
  "league.tier.silver",
  "league.tier.gold",
  "league.tier.platinum",
  "league.tier.diamond",
];
export const MAX_TIER = 4;
export const PROMOTE = 5; // top 5 yüksəlir
export const DEMOTE = 5; // alt 5 düşür (kohort böyük olanda)

// Cari həftə üçün istifadəçinin XP-sini artır (liqa kohortu üçün).
export async function addWeeklyXp(amount: number): Promise<void> {
  if (amount <= 0) return;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const name = (user.user_metadata?.name as string | undefined)?.trim() || "İstifadəçi";
    await supabase.rpc("add_weekly_xp", {
      p_name: name,
      p_amount: Math.round(amount),
      p_week: weekKey(),
    });
  } catch {
    // sükutla ötür
  }
}

// Həftə dəyişibsə liqa rollover-unu işə sal (idempotent — server həftədə bir dəfə edir).
// Liqa səhifəsi yüklənəndə çağırılır; pg_cron olmadan tier-lərin irəliləməsini təmin edir.
export async function maybeLeagueRollover(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.rpc("maybe_league_rollover");
  } catch {
    // sükutla ötür — kritik deyil
  }
}

// Öz liqa pilləm (0-4). Sətir yoxdursa 0 (Bürünc).
export async function loadMyLeagueTier(): Promise<number> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;
    const { data } = await supabase
      .from("league")
      .select("tier")
      .eq("user_id", user.id)
      .maybeSingle();
    return data?.tier ?? 0;
  } catch {
    return 0;
  }
}

// Çağıranın liqa kohortu (eyni pillə, həftəlik XP üzrə). Real istifadəçilər +
// botlarla həmişə `size` (15) nəfərə tamamlanır; XP üzrə azalan sıralama.
export async function loadCohort(size = 15): Promise<CohortRow[]> {
  try {
    const supabase = createClient();
    const week = weekKey();
    const [res, tier] = await Promise.all([
      supabase.rpc("get_cohort", { p_week: week, p_size: size }),
      loadMyLeagueTier(),
    ]);
    const real: CohortRow[] = (
      (res.data ?? []) as {
        user_id: string;
        name: string;
        username: string | null;
        avatar: import("@/components/Avatar").AvatarConfig | null;
        weekly_xp: number;
        tier: number;
        is_me: boolean;
      }[]
    ).map((r) => ({
      userId: r.user_id,
      name: r.name,
      username: r.username,
      avatar: r.avatar,
      weeklyXp: r.weekly_xp,
      tier: r.tier,
      isMe: r.is_me,
      isBot: false,
    }));
    const bots = makeBots(size - real.length, tier, week);
    return [...real, ...bots].sort((a, b) => b.weeklyXp - a.weeklyXp);
  } catch {
    return [];
  }
}

// Cari həftə üçün istifadəçinin XP-sini artır (dərs/quest mükafatı verildikdə).
export async function addLeaderboardXp(amount: number): Promise<void> {
  if (amount <= 0) return;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const name = (user.user_metadata?.name as string | undefined)?.trim() || "İstifadəçi";
    await supabase.rpc("add_leaderboard_xp", {
      p_week: weekKey(),
      p_name: name,
      p_amount: Math.round(amount),
    });
  } catch {
    // sükutla ötür — liqa kritik deyil
  }
}

// Ümumi sıralama — platformadakı bütün real istifadəçilər (ümumi XP üzrə).
// get_leaderboard funksiyası profiles + user_stats-dan təhlükəsiz oxuyur (bax 0004 migration).
export async function loadLeaderboard(limit = 50): Promise<LeaderRow[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_leaderboard", { p_limit: limit });
    return (data ?? []).map((r: { user_id: string; name: string; xp: number }) => ({
      userId: r.user_id,
      name: r.name,
      xp: r.xp,
    }));
  } catch {
    return [];
  }
}
