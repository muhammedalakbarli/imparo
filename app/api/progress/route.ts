// GET  /api/progress — cari istifadəçinin XP/streak + tamamlanmış dərsləri.
// POST /api/progress — dərs tamamla: { lessonId, xp } → user_progress + add_user_xp RPC.
// Hər ikisi auth tələb edir (session cookie). RLS yalnız öz sətirlərini icazə verir.

import { createClient } from "@/lib/supabase/server";
import { ok, fail, readJson, currentUser } from "@/lib/api/http";

export async function GET() {
  const user = await currentUser();
  if (!user) return fail("Autentifikasiya tələb olunur", 401);

  const supabase = await createClient();
  const [statsRes, progRes] = await Promise.all([
    supabase
      .from("user_stats")
      .select("total_xp, streak_days, last_active_date")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("user_progress").select("lesson_id").eq("user_id", user.id),
  ]);

  const stats = statsRes.data;
  const rows = progRes.data ?? [];
  return ok({
    totalXp: stats?.total_xp ?? 0,
    streakDays: stats?.streak_days ?? 0,
    lastActiveDate: stats?.last_active_date ?? null,
    completedLessons: rows.map((r: { lesson_id: string }) => r.lesson_id),
  });
}

interface Body {
  lessonId?: string;
  xp?: number;
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Autentifikasiya tələb olunur", 401);

  const body = await readJson<Body>(req);
  if (!body?.lessonId) return fail("lessonId tələb olunur");
  const xp = typeof body.xp === "number" && body.xp >= 0 ? body.xp : 0;

  const supabase = await createClient();
  const { error: progErr } = await supabase
    .from("user_progress")
    .upsert(
      { user_id: user.id, lesson_id: body.lessonId, score: xp },
      { onConflict: "user_id,lesson_id" },
    );
  if (progErr) return fail(progErr.message, 400);

  const { data, error } = await supabase.rpc("add_user_xp", {
    p_amount: xp,
    p_touch_streak: true,
  });
  if (error) return fail(error.message, 400);

  const row = Array.isArray(data) ? data[0] : data;
  return ok({
    lessonId: body.lessonId,
    earnedXp: xp,
    totalXp: row?.total_xp ?? null,
    streakDays: row?.streak_days ?? null,
  });
}
