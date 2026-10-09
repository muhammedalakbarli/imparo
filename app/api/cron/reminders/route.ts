// GET /api/cron/reminders — GitHub Actions hər gün çağırır (bax .github/workflows/cron-reminders.yml).
// Bu gün aktiv olmayan, streak-i olan istifadəçilərə "streak-in yanır" push göndərir.
// service_role ilə işləyir (RLS-i keçir). CRON_SECRET ilə qorunur.
//
// ⚠️ GÖNDƏRMƏ `fetch` İLƏDİR, `webpush.sendNotification` İLƏ YOX.
// `sendNotification` daxildə Node-un `https.request`-ini çağırır, Cloudflare Worker-də
// isə o yoxdur ("[unenv] https.request is not implemented yet!"). Xəta catch-də
// udulurdu və cavab `{"sent":0,"total":1}` olurdu — yəni push bildirişləri
// Cloudflare-ə köçəndən bəri HEÇ VAXT çatmırdı, amma cron hər gün "success" görünürdü.
// `generateRequestDetails` isə yalnız şifrələmə + VAPID imzası edir (Worker-də işləyir,
// payload Node-da deşifrə edilərək yoxlanılıb) — sorğunu özümüz göndəririk.

import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pulsuz planda bir Worker çağırışı ən çox 50 xarici sorğu edə bilər. 2 Supabase
// sorğusu + push-lar + köhnəlmiş abunələrin silinməsi bu həddə sığmalıdır.
// Qalanlar üçün cavabda `next` qaytarılır, workflow onu `?offset=` ilə yenidən çağırır.
const BATCH = 40;

// Gecə uşağa bildiriş göndərilmir. GitHub Actions cron-u saatlarla gecikə bilir
// (ölçüldü: 3–7 saat) — əvvəl bildiriş Bakı vaxtı ilə 01:47-də də gedirdi.
const QUIET_FROM_HOUR = 22; // 22:00-dan
const QUIET_TO_HOUR = 8; // 08:00-a qədər

// Bakı saat qurşağına görə bugünkü tarix "YYYY-MM-DD" (last_active_date ilə eyni format).
function bakuToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Baku" });
}

function bakuHour(): number {
  return Number(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Baku", hour: "numeric", hour12: false }),
  ) % 24;
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

  const params = new URL(req.url).searchParams;
  const hour = bakuHour();
  if ((hour >= QUIET_FROM_HOUR || hour < QUIET_TO_HOUR) && params.get("force") !== "1") {
    return Response.json({ ok: true, sent: 0, next: null, note: `quiet_hours (Bakı ${hour}:00)` });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = env.VAPID_PRIVATE_KEY;
  const vapidSubject = env.VAPID_SUBJECT || "mailto:info@imparo.app";
  if (!url || !serviceKey || !vapidPublic || !vapidPrivate) {
    return Response.json({ ok: false, error: "missing_env" }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const offset = Math.max(0, Number(params.get("offset")) || 0);
  // Sabit sıra: partiyalar arasında eyni abunə iki dəfə düşməsin.
  const { data: subs, count } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth", { count: "exact" })
    .order("endpoint")
    .range(offset, offset + BATCH - 1);
  if (!subs || subs.length === 0) {
    return Response.json({ ok: true, sent: 0, next: null, note: "no_subscriptions" });
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
  let failed = 0;
  const errors: string[] = [];

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
      const d = webpush.generateRequestDetails(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        {
          vapidDetails: { subject: vapidSubject, publicKey: vapidPublic, privateKey: vapidPrivate },
          TTL: 12 * 60 * 60, // cihaz offline-dırsa 12 saat ərzində çatdırılsın
        },
      );
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(d.headers)) headers[k] = String(v);
      const res = await fetch(d.endpoint, {
        method: d.method,
        headers,
        body: d.body as unknown as BodyInit,
      });

      if (res.ok) {
        sent++;
      } else if (res.status === 404 || res.status === 410) {
        // Köhnəlmiş/ləğv olunmuş abunə — cədvəldən sil.
        await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        removed++;
      } else {
        failed++;
        if (errors.length < 5) {
          errors.push(`${res.status}: ${(await res.text().catch(() => "")).slice(0, 120)}`);
        }
      }
    } catch (err) {
      // Əvvəl bu budaq səssiz idi və bütün uğursuzluqları gizlədirdi — indi sayılır.
      failed++;
      if (errors.length < 5) errors.push(String(err).slice(0, 160));
    }
  }

  const nextOffset = offset + subs.length;
  const next = count != null && nextOffset < count ? nextOffset : null;
  return Response.json({
    ok: true,
    sent,
    removed,
    skipped,
    failed,
    errors,
    total: count ?? subs.length,
    next,
  });
}
