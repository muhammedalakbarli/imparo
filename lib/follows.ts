// İzləmə (follow) — follow_user/unfollow_user RPC-ləri (bax 0010 migration).

import { createClient } from "./supabase/client";

export async function followUser(targetId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("follow_user", { p_target: targetId });
    return !error;
  } catch {
    return false;
  }
}

export async function unfollowUser(targetId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("unfollow_user", { p_target: targetId });
    return !error;
  } catch {
    return false;
  }
}
