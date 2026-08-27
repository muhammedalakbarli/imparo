// Dostlar — friendships cədvəli + RPC-lər (bax 0007 migration).

import { createClient } from "./supabase/client";
import type { AvatarConfig } from "@/components/Avatar";

export interface FriendRow {
  friendId: string;
  name: string;
  username: string | null;
  avatar: AvatarConfig | null;
  totalXp: number;
  streakDays: number;
  friendStreak: number;
}

export async function addFriend(
  friendId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("add_friend", { p_friend: friendId });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

export async function getFriends(): Promise<FriendRow[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_friends");
    return (
      (data ?? []) as {
        friend_id: string;
        name: string;
        username: string | null;
        avatar: AvatarConfig | null;
        total_xp: number;
        streak_days: number;
        friend_streak: number;
      }[]
    ).map((r) => ({
      friendId: r.friend_id,
      name: r.name,
      username: r.username,
      avatar: r.avatar,
      totalXp: r.total_xp,
      streakDays: r.streak_days,
      friendStreak: r.friend_streak,
    }));
  } catch {
    return [];
  }
}

// Dərs bitəndən sonra: bu gün ikisi də aktivdirsə friend streak-ları yenilə.
export async function touchFriendStreaks(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.rpc("touch_friend_streaks");
  } catch {
    // sükutla ötür
  }
}

export async function removeFriend(friendId: string): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.rpc("remove_friend", { p_friend: friendId });
  } catch {
    // sükutla ötür
  }
}
