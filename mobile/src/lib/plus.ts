// Imparo Plus statusu — limitsiz can + 2× zümrüd. Web ilə eyni RPC (get_plus).
import { supabase } from "./supabase";

export async function loadPlus(): Promise<boolean> {
  try {
    const { data } = await supabase.rpc("get_plus");
    return !!data;
  } catch {
    return false;
  }
}
