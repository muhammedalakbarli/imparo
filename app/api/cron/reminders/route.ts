// GET /api/cron/reminders — GitHub Actions hər axşam çağırır (bax .github/workflows/cron-reminders.yml).
// Bu gün aktiv olmayan, streak-i olan istifadəçilərə "streak-in yanır" push göndərir.
// service_role ilə işləyir (RLS-i keçir). CRON_SECRET ilə qorunur.

import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bakı saat qurşağına görə bugünkü tarix "YYYY-MM-DD" (last_active_date ilə eyni format).
function bakuToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Baku" });
}

interface Sub {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}
interface Stat {
  user_id: string;
  streak_days: number;
  last_active_date: string | null;
}

export async function GET(req: Request) {
  // Bu 4 dəyər Cloudflare Worker SECRET-idir — `process.env`-dən OXUNMUR (bax
  // cloudflare-env.d.ts). NEXT_PUBLIC_* dəyərlər isə build-də inline olunur,
  // adi process.env ilə qalır.
  const { env } = await getCloudflareContext({ async: true });

  // Fail-CLOSED: CRON_SECRET mühitdə YOXDURSA da endpoint açıq qalmasın (əvvəlki
  // `secret && ...` fail-open idi — mühit dəyişəni səhvən silinsə/qurulmasa, qoruma
  // sükutla keçirdi).
  const secret = env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: secret ? 401 : 500 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = env.VAPID_PRIVATE_KEY;
  const vapidSubject = env.VAPID_SUBJECT || "mailto:info@imparo.app";
  if (!url || !serviceKey || !vapidPublic || !vapidPrivate) {
    return Response.json({ ok: false, error: "missing_env" }, { status: 500 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  // Bütün abunələr + onların statistikası.
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");
  if (!subs || subs.length === 0) {
    return Response.json({ ok: true, sent: 0, note: "no_subscriptions" });
  }

  const userIds = [...new Set((subs as Sub[]).map((s) => s.user_id))];
  const { data: stats } = await supabase
    .from("user_stats")
    .select("user_id, streak_days, last_active_date")
    .in("user_id", userIds);
  const statById = new Map<string, Stat>((stats as Stat[] | null)?.map((s) => [s.user_id, s]) ?? []);

  const today = bakuToday();
  let sent = 0;
  let removed = 0;
  let skipped = 0;

  for (const s of subs as Sub[]) {
    const st = statById.get(s.user_id);
    // Bu gün artıq aktivdirsə — xatırlatma lazım deyil.
    if (st && st.last_active_date === today) {
      skipped++;
      continue;
    }

    const streak = st?.streak_days ?? 0;
    const payload =
      streak > 0
        ? {
            title: "🔥 Streak-in təhlükədədir!",
            body: `${streak} günlük seriyanı itirmə — bu gün bir dərs et.`,
            url: "/dashboard",
            tag: "streak-reminder",
          }
        : {
            title: "Imparo səni gözləyir 📚",
            body: "Bugünkü dərsini et və XP qazan!",
            url: "/dashboard",
            tag: "daily-reminder",
          };

    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      sent++;
    } catch (err: unknown) {
      // Köhnəlmiş/ləğv olunmuş abunə (404/410) — cədvəldən sil.
      const code = (err as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        removed++;
      }
    }
  }

  return Response.json({ ok: true, sent, removed, skipped, total: subs.length });
}
