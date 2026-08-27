// Profil kimliyi — profiles cədvəli (name, username, avatar) + public profil RPC.

import { createClient } from "./supabase/client";
import { getLang, type Lang } from "./i18n";
import { findBot } from "./bots";
import type { AvatarConfig } from "@/components/Avatar";

export interface ProfileRow {
  id: string;
  name: string;
  username: string | null;
  avatar: AvatarConfig | null;
  createdAt: string | null;
}

export function validUsername(u: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(u);
}

const MONTHS: Record<Lang, string[]> = {
  az: [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
    "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  ru: [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
  ],
};

// Üzvlük tarixi — "İyul 2026" (interfeys dilinə görə ay adı).
export function memberDate(iso: string | null, lang: Lang = getLang()): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;
}

export async function loadProfileRow(): Promise<ProfileRow | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("id, name, username, avatar, created_at")
      .eq("id", user.id)
      .maybeSingle();
    const meta = (user.user_metadata?.name as string | undefined)?.trim();
    return {
      id: user.id,
      name: data?.name ?? meta ?? "İstifadəçi",
      username: data?.username ?? null,
      avatar: (data?.avatar as AvatarConfig | null) ?? null,
      createdAt: data?.created_at ?? null,
    };
  } catch {
    return null;
  }
}

// Ad/username/avatar yenilə (mövcud sətirlə birləşdirib upsert; metadata.name sinxron).
export async function updateProfile(p: {
  name?: string;
  username?: string;
  avatar?: AvatarConfig;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "auth" };
    const cur = await loadProfileRow();
    const merged = {
      id: user.id,
      name: (p.name ?? cur?.name ?? "İstifadəçi").trim(),
      username: (p.username ?? cur?.username) || null,
      avatar: p.avatar ?? cur?.avatar ?? null,
    };
    const { error } = await supabase.from("profiles").upsert(merged, { onConflict: "id" });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "username_taken" };
      return { ok: false, error: error.message };
    }
    if (p.name !== undefined) {
      await supabase.auth.updateUser({ data: { name: merged.name } });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

export interface PublicProfile {
  id: string;
  name: string;
  username: string | null;
  avatar: AvatarConfig | null;
  createdAt: string | null;
  totalXp: number;
  streakDays: number;
  tier: number;
  followers: number;
  following: number;
  amFollowing: boolean;
  isBot?: boolean;
}

// Bot kimliyini ictimai profil formasına çevir (DB yox — deterministik).
function botToProfile(key: string): PublicProfile | null {
  const b = findBot(key);
  if (!b) return null;
  return {
    id: b.userId,
    name: b.name,
    username: b.username,
    avatar: b.avatar,
    createdAt: b.createdAt,
    totalXp: b.totalXp,
    streakDays: b.streakDays,
    tier: b.tier,
    followers: b.followers,
    following: b.following,
    amFollowing: false,
    isBot: true,
  };
}

// key = username və ya user_id (uuid) — hər ikisi ilə açılır. Real istifadəçi tapılmasa
// bot kimliyi yoxlanılır (liqa botları DB-də deyil).
export async function getPublicProfile(key: string): Promise<PublicProfile | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_public_profile", { p_key: key });
    const row = (Array.isArray(data) ? data[0] : data) as
      | {
          id: string;
          name: string;
          username: string | null;
          avatar: AvatarConfig | null;
          created_at: string | null;
          total_xp: number;
          streak_days: number;
          tier: number;
          followers: number;
          following: number;
          am_following: boolean;
        }
      | undefined;
    if (!row) return botToProfile(key); // real yoxdursa — bot ola bilər
    return {
      id: row.id,
      name: row.name,
      username: row.username,
      avatar: row.avatar,
      createdAt: row.created_at,
      totalXp: row.total_xp,
      streakDays: row.streak_days,
      tier: row.tier,
      followers: row.followers ?? 0,
      following: row.following ?? 0,
      amFollowing: row.am_following ?? false,
    };
  } catch {
    return botToProfile(key); // xəta olsa da bot profili işləsin
  }
}
