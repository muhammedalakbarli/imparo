// GET /api/cron/parent-report — həftəlik valideyn hesabatı.
// GitHub Actions hər bazar günü çağırır (bax .github/workflows/cron-parent-report.yml).
// service_role ilə işləyir (RLS-i keçir), CRON_SECRET ilə qorunur.
//
// Yalnız TƏSDİQLƏNMİŞ ünvanlara göndərilir. Fəaliyyəti olmayan uşaq üçün də
// göndərilir (qısa "bu həftə məşq etmədi" variantı) — çünki valideynin gözündə
// hesabatın dəyəri məhz müntəzəmliyindədir; yalnız yaxşı həftələrdə gələn hesabat
// reklamdır, hesabat deyil.

import { createClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendEmail } from "@/lib/email";
import { renderReportEmail, reportLinks, type ReportData } from "@/lib/parentReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bakı vaxtı ilə bu gün 00:00 (UTC+4 → UTC-də bir gün əvvəl 20:00).
function bakuMidnightUtc(daysAgo = 0): Date {
  const nowBaku = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Baku" }));
  nowBaku.setHours(0, 0, 0, 0);
  nowBaku.setDate(nowBaku.getDate() - daysAgo);
  // Bakı UTC+4 — həmin yerli yarıgecə UTC-də 4 saat əvvəldir.
  return new Date(nowBaku.getTime() - 4 * 60 * 60 * 1000);
}

interface Row {
  user_id: string;
  email: string;
  view_token: string;
  unsub_token: string;
}

// Cloudflare Worker-də bir sorğu daxilində məhdud sayda XARİCİ sorğu (subrequest)
// icazəlidir — pulsuz planda 50. Hər abunəçi 2–3 sorğu yeyir (RPC + Resend +
// last_sent_at yazısı), yəni bir çağırışda təxminən 12 nəfər emal oluna bilər.
// Qalanlar üçün workflow endpoint-i `remaining` sıfır olana qədər təkrar çağırır.
const BATCH = 12;

// Təkrar çağırışda eyni adama ikinci məktub getməsin: son 3 gündə göndərilibsə
// keçilir. Həftəlik cron üçün 3 gün təhlükəsiz aralıqdır.
const RESEND_AFTER_DAYS = 3;

export async function GET(req: Request) {
  const { env } = await getCloudflareContext({ async: true });

  // Fail-CLOSED: CRON_SECRET yoxdursa endpoint açıq qalmasın (reminders ilə eyni).
  const secret = env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: secret ? 401 : 500 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return Response.json({ ok: false, error: "missing_env" }, { status: 500 });
  if (!env.RESEND_API_KEY) {
    return Response.json({ ok: false, error: "missing_resend_key" }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  const cutoff = new Date(Date.now() - RESEND_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Növbəti partiya + hələ göndərilməmişlərin ümumi sayı (bir sorğuda: count).
  const { data: rows, error, count } = await supabase
    .from("parent_reports")
    .select("user_id, email, view_token, unsub_token", { count: "exact" })
    .not("verified_at", "is", null)
    .or(`last_sent_at.is.null,last_sent_at.lt.${cutoff}`)
    // Ən çoxdan göndərilməyən birinci: partiyalar arasında növbə ədalətli qalır.
    .order("last_sent_at", { ascending: true, nullsFirst: true })
    .limit(BATCH);

  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  if (!rows || rows.length === 0) {
    return Response.json({ ok: true, sent: 0, remaining: 0, note: "nothing_due" });
  }

  const to = bakuMidnightUtc(0); // bu gün 00:00 (daxil deyil)
  const from = bakuMidnightUtc(7); // 7 gün əvvəl 00:00

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows as Row[]) {
    const { data, error: rpcError } = await supabase.rpc("parent_report_data", {
      p_user_id: row.user_id,
      p_from: from.toISOString(),
      p_to: to.toISOString(),
    });
    if (rpcError || !data) {
      failed++;
      if (errors.length < 5) errors.push(`data:${rpcError?.message ?? "empty"}`);
      continue;
    }

    const links = reportLinks(row.view_token, row.unsub_token);
    const mail = renderReportEmail(data as ReportData, links);
    const res = await sendEmail({
      to: row.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      unsubscribeUrl: links.unsubUrl,
    });

    if (res.ok) {
      sent++;
      await supabase
        .from("parent_reports")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("user_id", row.user_id);
    } else {
      failed++;
      if (errors.length < 5) errors.push(res.error);
    }
  }

  // `count` filtrdən keçən ÜMUMİ saydır (limit ondan əvvəl tətbiq olunmur),
  // ona görə qalıq = ümumi − bu partiyada göndərilən.
  const remaining = Math.max(0, (count ?? rows.length) - sent);
  return Response.json({ ok: true, sent, failed, remaining, batch: rows.length, errors });
}
