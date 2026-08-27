// GET /api/leaderboard?limit=50 — ümumi liqa (ad + XP), ümumi XP üzrə sıralı.
// Public: get_leaderboard security definer yalnız ad + xp qaytarır (PII açılmır).

import { createClient } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/http";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(raw, 100) : 50;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_leaderboard", { p_limit: limit });
  if (error) return fail(error.message, 400);

  const entries = (data ?? []).map(
    (r: { name: string; xp: number }, i: number) => ({
      rank: i + 1,
      name: r.name,
      xp: r.xp,
    }),
  );
  return ok({ entries });
}
