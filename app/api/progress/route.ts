// GET  /api/progress — cari istifadəçinin XP/streak + tamamlanmış dərsləri.
// POST /api/progress — dərs tamamla: { lessonId } → complete_lesson RPC (mükafatı server hesablayır).
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
}

// Dərsi tamamla. Mükafatı server özü hesablayır (`complete_lesson` RPC, 0037/0058):
// XP həqiqi tapşırıq sayından gəlir, eyni dərs ikinci dəfə mükafat vermir.
//
// Əvvəl bu marşrut `user_progress`-ə birbaşa upsert edib client-in göndərdiyi `xp`-ni
// `add_user_xp`-ə ötürürdü. 0037-dən bəri `user_progress`-ə birbaşa yazı bağlıdır
// (REVOKE) — yəni marşrut HƏR çağırışda 400 qaytarırdı. Gövdədəki `xp` artıq
// nəzərə alınmır (geri uyğunluq üçün qəbul olunur, amma istifadə edilmir).
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("Autentifikasiya tələb olunur", 401);

  const body = await readJson<Body>(req);
  if (!body?.lessonId) return fail("lessonId tələb olunur");

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("complete_lesson", { p_lesson_id: body.lessonId, p_grant_reward: true })
    .single();
  if (error) return fail(error.message, 400);

  const row = data as { xp: number; gems: number; already_completed: boolean } | null;
  const { data: stats } = await supabase
    .from("user_stats")
    .select("total_xp, streak_days")
    .eq("user_id", user.id)
    .maybeSingle();

  return ok({
    lessonId: body.lessonId,
    earnedXp: row?.xp ?? 0,
    earnedGems: row?.gems ?? 0,
    alreadyCompleted: row?.already_completed ?? false,
    totalXp: stats?.total_xp ?? null,
    streakDays: stats?.streak_days ?? null,
  });
}
