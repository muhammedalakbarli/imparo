"use client";

// Admin · Analitika — platforma statistikası: məzmun, istifadəçilər, liqa, rəylər.
// Yalnız is_admin() girə bilir. Yeni DB tələb etmir: mövcud mənbələrdən oxuyur
// (content tree, get_leaderboard RPC, league + task_feedback cədvəlləri).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  checkIsAdmin, adminGrowth, adminSubjectStats,
  adminDailySeries, adminRetention, adminHourlyActivity,
  type AdminGrowth, type AdminSubjectStat,
  type DailyPoint, type AdminRetention, type HourlyPoint,
} from "@/lib/adminApi";
import { createClient } from "@/lib/supabase/client";
import { loadLeaderboard, type LeaderRow } from "@/lib/leaderboard";
import { useContent } from "@/components/ContentProvider";
import { FEEDBACK_LABELS, type FeedbackCategory } from "@/lib/feedback";
import type { Subject, Task, TaskType } from "@/lib/types";
import { PageSkeleton } from "@/components/Skeleton";

const TIER_NAMES = ["Bürünc", "Gümüş", "Qızıl", "Platin", "Almaz"];
const TYPE_NAMES: Record<TaskType, string> = {
  multiple_choice: "Çoxseçimli",
  fill_blank: "Boşluq doldur",
  numeric: "Rəqəm",
  word_order: "Söz sırası",
  listening: "Dinləmə",
};

interface FbRow { task_id: string; category: string; resolved: boolean }

function allTasks(subjects: Subject[]): Task[] {
  return subjects.flatMap((s) =>
    s.units.flatMap((u) => u.lessons.flatMap((l) => [...l.tasks, ...(l.bonusTasks ?? [])])),
  );
}
function promptFor(subjects: Subject[], taskId: string): string | null {
  for (const s of subjects)
    for (const u of s.units)
      for (const l of u.lessons) {
        const t = [...l.tasks, ...(l.bonusTasks ?? [])].find((x) => x.id === taskId);
        if (t) return t.prompt;
      }
  return null;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const { subjects } = useContent();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [leaders, setLeaders] = useState<LeaderRow[] | null>(null);
  const [tiers, setTiers] = useState<number[] | null>(null); // hər sətir bir istifadəçinin tier-i
  const [feedback, setFeedback] = useState<FbRow[] | null>(null);
  const [growth, setGrowth] = useState<AdminGrowth | null>(null);
  const [subjectStats, setSubjectStats] = useState<AdminSubjectStat[]>([]);
  const [range, setRange] = useState(14);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [retention, setRetention] = useState<AdminRetention | null>(null);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);

  useEffect(() => {
    if (user) checkIsAdmin().then(setIsAdmin);
  }, [user]);
  useEffect(() => {
    if (isAdmin === false) router.replace("/dashboard");
  }, [isAdmin, router]);
  useEffect(() => {
    if (isAdmin !== true) return;
    loadLeaderboard(1000).then(setLeaders);
    const sb = createClient();
    sb.from("league").select("tier").then(({ data }) => setTiers((data ?? []).map((r) => r.tier as number)));
    sb.from("task_feedback").select("task_id,category,resolved").then(({ data }) => setFeedback((data as FbRow[]) ?? []));
    adminGrowth().then(setGrowth);
    adminSubjectStats().then(setSubjectStats);
    adminRetention().then(setRetention);
    adminHourlyActivity().then(setHourly);
  }, [isAdmin]);
  useEffect(() => {
    if (isAdmin === true) adminDailySeries(range).then(setDaily);
  }, [isAdmin, range]);

  // ── Məzmun statistikası (DB yox — content tree-dən) ──
  const content = useMemo(() => {
    const tasks = allTasks(subjects);
    const byGrade = new Map<number, { subjects: number; lessons: number; tasks: number }>();
    const bySubject = new Map<string, number>(); // ad → tapşırıq sayı
    const byType = new Map<TaskType, number>();
    let units = 0;
    let lessons = 0;
    for (const s of subjects) {
      const g = byGrade.get(s.grade) ?? { subjects: 0, lessons: 0, tasks: 0 };
      g.subjects += 1;
      units += s.units.length;
      for (const u of s.units) {
        g.lessons += u.lessons.length;
        lessons += u.lessons.length;
        for (const l of u.lessons) {
          const n = l.tasks.length + (l.bonusTasks?.length ?? 0);
          g.tasks += n;
          bySubject.set(s.name, (bySubject.get(s.name) ?? 0) + n);
        }
      }
      byGrade.set(s.grade, g);
    }
    for (const t of tasks) byType.set(t.type, (byType.get(t.type) ?? 0) + 1);
    return {
      subjects: subjects.length,
      units,
      lessons,
      tasks: tasks.length,
      byGrade: [...byGrade.entries()].sort((a, b) => a[0] - b[0]),
      bySubject: [...bySubject.entries()].sort((a, b) => b[1] - a[1]),
      byType: [...byType.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [subjects]);

  if (!ready || !user || isAdmin !== true || !leaders || !tiers || !feedback) return <PageSkeleton />;

  const totalXp = leaders.reduce((n, l) => n + l.xp, 0);
  const avgXp = leaders.length ? Math.round(totalXp / leaders.length) : 0;
  const tierCounts = TIER_NAMES.map((_, i) => tiers.filter((t) => t === i).length);
  const openFb = feedback.filter((f) => !f.resolved).length;
  const fbByCat = (Object.keys(FEEDBACK_LABELS) as FeedbackCategory[]).map((c) => ({
    c,
    n: feedback.filter((f) => f.category === c).length,
  }));
  const topReported = [...feedback.reduce((m, f) => m.set(f.task_id, (m.get(f.task_id) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-fg">Admin · Analitika</h1>
          <div className="flex gap-3 text-sm text-muted">
            <Link href="/admin" className="hover:text-fg">Məzmun</Link>
            <Link href="/admin/feedback" className="hover:text-fg">Rəylər</Link>
          </div>
        </div>
        {/* Kiçik nümunə xəbərdarlığı — panel yalan danışmasın. Bax MIN_N. */}
        <p className="mt-2 text-xs text-muted">
          Etibarlı faiz üçün ən azı 10 uğur, 10 uğursuzluq və 30 müşahidə lazımdır. Bu şərt pozulanda
          göstərici <span className="font-bold text-amber-500">az data</span> kimi işarələnir və boz
          verilir: məsələn «8.6% · 3/35»-də bir istifadəçinin qayıtması rəqəmi 11.4% edir. Kiçik bazada
          faiz dəyişməsi əvəzinə mütləq fərq göstərilir.
        </p>

        {/* Əsas göstəricilər */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="İstifadəçi (XP-li)" value={leaders.length} />
          <Stat label="Ümumi XP" value={totalXp} />
          <Stat label="Orta XP" value={avgXp} />
          <Stat label="Açıq rəy" value={openFb} />
        </div>

        {/* Böyümə & Retensiya */}
        {growth && (
          <Section title="Böyümə & Retensiya">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="DAU (bu gün aktiv)" value={growth.dau} small />
              <Stat label="WAU (7 gün)" value={growth.wau} small />
              <Stat label="MAU (30 gün)" value={growth.mau} small />
              <Stat label="Plus abunə" value={growth.funnel.plus} small />
            </div>

            {/* Nisbətlər — faktiki rəqəmlərlə */}
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Ratio label="Aktivləşmə" num={growth.funnel.activated} den={growth.funnel.signed_up} hint="ilk dərsi edən / qeydiyyat" />
              <Ratio label="7-gün qayıdış" num={growth.funnel.retained7} den={growth.funnel.signed_up} hint="son 7 gün aktiv / qeydiyyat" />
              <Ratio label="Plus konversiya" num={growth.funnel.plus} den={growth.funnel.signed_up} hint="Plus / qeydiyyat" />
              <Ratio label="Stickiness (DAU/MAU)" num={growth.dau} den={growth.mau} hint="gündəlik/aylıq aktiv" />
            </div>

            {/* Funnel */}
            <div className="mt-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Qıf (funnel)</div>
              <FunnelBar label="Qeydiyyat" value={growth.funnel.signed_up} max={growth.funnel.signed_up} tone="bg-brand" />
              <FunnelBar label="İlk dərsi etdi" value={growth.funnel.activated} max={growth.funnel.signed_up} tone="bg-emerald-500" />
              <FunnelBar label="7 gündə qayıtdı" value={growth.funnel.retained7} max={growth.funnel.signed_up} tone="bg-amber-500" />
              <FunnelBar label="Plus aldı" value={growth.funnel.plus} max={growth.funnel.signed_up} tone="bg-yellow-400" />
            </div>

            {/* Gündəlik qrafiklər */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <MiniBars title="Qeydiyyat (son 14 gün)" data={growth.signups_daily} tone="bg-brand" />
              <MiniBars title="Aktiv istifadəçi (son 14 gün)" data={growth.active_daily} tone="bg-emerald-500" />
            </div>
          </Section>
        )}

        {/* Zaman aralığı — müqayisə + gün-gün + retensiya + saatlıq */}
        <Section title="Zaman aralığı analizi">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">Aralıq:</span>
            {[7, 14, 30, 90].map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-sm font-bold ${range === r ? "bg-brand text-white" : "border border-line bg-panel text-fg hover:border-brand"}`}>
                {r} gün
              </button>
            ))}
          </div>

          {/* Cari dövr vs əvvəlki dövr */}
          {daily.length >= 2 * range && (() => {
            const cur = daily.slice(-range), prev = daily.slice(0, range);
            const sum = (arr: DailyPoint[], k: keyof DailyPoint) => arr.reduce((s, x) => s + Number(x[k]), 0);
            return (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Compare label={`Qeydiyyat (${range}g)`} cur={sum(cur, "signups")} prev={sum(prev, "signups")} />
                <Compare label={`Aktiv gün-cəmi (${range}g)`} cur={sum(cur, "active")} prev={sum(prev, "active")} />
                <Compare label={`Tamamlanan dərs (${range}g)`} cur={sum(cur, "completions")} prev={sum(prev, "completions")} />
              </div>
            );
          })()}

          {/* Gün-gün cədvəl */}
          <div className="mt-3">
            <Table
              title={`Gün-gün (son ${range} gün)`}
              head={["Tarix", "Qeydiyyat", "Aktiv", "Tamamlanan"]}
              rows={[...daily.slice(-range)].reverse().map((x) => [x.d, Number(x.signups), Number(x.active), Number(x.completions)])}
            />
          </div>

          {/* Retensiya proksisi */}
          {retention && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                Retensiya (proksi — qeydiyyatdan N gün sonra ən azı 1 dəfə qayıdan)
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Ratio label="D1 (1 gün sonra)" num={retention.d1_num} den={retention.d1_den} />
                <Ratio label="D7 (7 gün sonra)" num={retention.d7_num} den={retention.d7_den} />
                <Ratio label="D30 (30 gün sonra)" num={retention.d30_num} den={retention.d30_den} />
              </div>
            </div>
          )}

          {/* Saatlıq aktivlik */}
          {hourly.length > 0 && (
            <div className="mt-4">
              <HourBars data={hourly} />
            </div>
          )}
        </Section>

        {/* Fənn üzrə istifadə (real DB) */}
        {subjectStats.length > 0 && (
          <Section title="Fənn üzrə istifadə (tamamlanan dərslər)">
            <Table
              head={["Fənn", "Tamamlanan", "Öyrənən"]}
              rows={subjectStats.map((s) => [s.subject, Number(s.completions), Number(s.learners)])}
            />
          </Section>
        )}

        {/* Məzmun */}
        <Section title="Məzmun">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Fənn" value={content.subjects} small />
            <Stat label="Bölmə" value={content.units} small />
            <Stat label="Dərs" value={content.lessons} small />
            <Stat label="Tapşırıq" value={content.tasks} small />
          </div>
          <Table
            head={["Sinif", "Fənn", "Dərs", "Tapşırıq"]}
            rows={content.byGrade.map(([g, v]) => [`${g}-ci sinif`, v.subjects, v.lessons, v.tasks])}
          />
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Table title="Fənn üzrə tapşırıq" head={["Fənn", "Say"]} rows={content.bySubject.map(([n, c]) => [n, c])} />
            <Table
              title="Tapşırıq növü"
              head={["Növ", "Say"]}
              rows={content.byType.map(([t, c]) => [TYPE_NAMES[t] ?? t, c])}
            />
          </div>
        </Section>

        {/* İstifadəçilər + liqa */}
        <Section title="İstifadəçilər və liqa">
          <Table
            title="Liqa pillə bölgüsü"
            head={["Pillə", "İstifadəçi"]}
            rows={TIER_NAMES.map((n, i) => [n, tierCounts[i]])}
          />
          <Table
            title="Top 10 istifadəçi (ümumi XP)"
            head={["#", "Ad", "XP"]}
            rows={leaders.slice(0, 10).map((l, i) => [i + 1, l.name, l.xp])}
          />
        </Section>

        {/* Rəylər */}
        <Section title="Rəylər">
          <div className="grid gap-4 sm:grid-cols-2">
            <Table
              title="Kateqoriya üzrə"
              head={["Kateqoriya", "Say"]}
              rows={fbByCat.map(({ c, n }) => [FEEDBACK_LABELS[c], n])}
            />
            <Table
              title="Ən çox şikayət olunan suallar"
              head={["Sual", "Say"]}
              rows={topReported.map(([id, n]) => [promptFor(subjects, id) ?? id, n])}
            />
          </div>
        </Section>
      </main>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: number; small?: boolean }) {
  return (
    <div className="rounded-[10px] border border-line bg-panel p-4">
      <div className={`font-semibold text-fg ${small ? "text-xl" : "text-2xl"}`}>
        {value.toLocaleString("az-AZ")}
      </div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

// Faizin ETİBARLI sayılması üçün şərtlər.
//
// Yalnız məxrəcə baxmaq AZDIR: "8.6% · 3/35"-də məxrəc 35-dir, amma uğur cəmi
// 3 nəfərdir və bir istifadəçi rəqəmi 11.4%-ə qaldırır. Ona görə normal
// yaxınlaşmanın standart şərti işlədilir: ən azı 10 uğur VƏ 10 uğursuzluq
// (əlavə olaraq məxrəc ən azı 30). Bu şərtlər pozulanda faiz boz göstərilir və
// "az data" kimi işarələnir — belə rəqəmə əsasən qərar vermək olmaz.
const MIN_N = 30;
const MIN_SUCCESSES = 10;

function isWeakSample(num: number, den: number): boolean {
  return den < MIN_N || num < MIN_SUCCESSES || den - num < MIN_SUCCESSES;
}

// Nisbət kartı — faiz + xam rəqəmlər (məs. "45% · 12/27"), incə bar ilə.
function Ratio({ label, num, den, hint }: { label: string; num: number; den: number; hint?: string }) {
  const pct = den > 0 ? Math.round((num / den) * 1000) / 10 : 0;
  const weak = isWeakSample(num, den);
  return (
    <div
      className="rounded-[10px] border border-line bg-panel p-4"
      title={weak ? `${hint ? hint + " · " : ""}Az data: ${num}/${den}. Etibarlı faiz üçün ən azı ${MIN_SUCCESSES} uğur, ${MIN_SUCCESSES} uğursuzluq və ${MIN_N} müşahidə lazımdır.` : hint}
    >
      <div className="flex items-baseline gap-1.5">
        <span className={`text-xl font-semibold ${weak ? "text-muted" : "text-brand"}`}>{pct}%</span>
        <span className="text-xs font-semibold text-muted">{num}/{den}</span>
        {weak && <span className="text-[10px] font-bold text-amber-500" title="nümunə kiçikdir">az data</span>}
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className={`h-full rounded-full ${weak ? "bg-line" : "bg-brand"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}

// Cari vs əvvəlki dövr müqayisəsi.
function Compare({ label, cur, prev }: { label: string; cur: number; prev: number }) {
  const up = cur >= prev;
  // Kiçik bazada FAİZ göstərilmir: 6 → 16 "↑166.7%" olur, halbuki bu, cəmi 10
  // nəfərdir və bir məktəb qrupu ola bilər. Belə halda mütləq fərq verilir və
  // rəng neytral qalır — yaşıl ox olmayan uğuru varmış kimi göstərir.
  const weak = prev < MIN_N || cur < MIN_N;
  const delta = prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : cur > 0 ? 100 : 0;
  const diff = cur - prev;
  return (
    <div className="rounded-[10px] border border-line bg-panel p-4">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-fg">{cur.toLocaleString("az-AZ")}</span>
        {weak ? (
          <span className="text-xs font-bold text-muted" title={`Nümunə kiçikdir (< ${MIN_N}) — faiz dəyişməsi etibarsızdır.`}>
            {diff >= 0 ? "+" : "−"}
            {Math.abs(diff)}
          </span>
        ) : (
          <span className={`text-xs font-bold ${up ? "text-emerald-600" : "text-red-500"}`}>
            {up ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
      <div className="text-[11px] text-muted">əvvəlki dövr: {prev.toLocaleString("az-AZ")}</div>
    </div>
  );
}

// Saatlıq aktivlik — 24 saat, rəqəmli.
function HourBars({ data }: { data: { hour: number; cnt: number }[] }) {
  const map = new Map(data.map((h) => [h.hour, Number(h.cnt)]));
  const hours = Array.from({ length: 24 }, (_, h) => ({ h, n: map.get(h) ?? 0 }));
  const max = Math.max(1, ...hours.map((x) => x.n));
  const peak = hours.reduce((p, x) => (x.n > p.n ? x : p), hours[0]);
  return (
    <div className="rounded-[10px] border border-line bg-panel p-3">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-sm font-bold text-fg">Saatlıq aktivlik (son giriş üzrə, Bakı vaxtı)</span>
        <span className="text-xs text-muted">ən aktiv saat <b className="text-fg">{String(peak.h).padStart(2, "0")}:00</b> ({peak.n})</span>
      </div>
      <div className="flex h-24 items-end gap-[2px]">
        {hours.map((x) => (
          <div key={x.h} className="flex flex-1 flex-col items-center justify-end" title={`${x.h}:00 — ${x.n}`}>
            <span className={`text-[8px] font-bold leading-none ${x.n > 0 ? "text-fg" : "text-transparent"}`}>{x.n}</span>
            <div className={`mt-0.5 w-full rounded-sm bg-sky-500 ${x.n === 0 ? "opacity-30" : ""}`}
              style={{ height: `${Math.max((x.n / max) * 100, x.n > 0 ? 6 : 3)}%` }} />
            <span className="mt-1 text-[8px] leading-none text-muted">{x.h % 3 === 0 ? x.h : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Qıf sətri — dəyər + faiz + bar.
function FunnelBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="mb-0.5 flex justify-between text-sm">
        <span className="font-semibold text-fg">{label}</span>
        <span className="text-muted">{value} ({pct}%)</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-panel-2">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  );
}

// Rəqəmli sütun qrafiki (HTML) — hər sütunun üstündə dəyər, altında gün; başlıqda cəmi/orta/ən çox.
function MiniBars({ title, data, tone }: { title: string; data: { d: string; n: number }[]; tone: string }) {
  const max = Math.max(1, ...data.map((x) => x.n));
  const total = data.reduce((s, x) => s + x.n, 0);
  const avg = data.length ? Math.round((total / data.length) * 10) / 10 : 0;
  const peak = data.reduce((p, x) => (x.n > p.n ? x : p), data[0] ?? { d: "", n: 0 });
  return (
    <div className="rounded-[10px] border border-line bg-panel p-3">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-sm font-bold text-fg">{title}</span>
        <span className="text-xs text-muted">
          cəmi <b className="text-fg">{total}</b> · orta/gün <b className="text-fg">{avg}</b> · ən çox <b className="text-fg">{peak.n}</b>
        </span>
      </div>
      <div className="flex h-28 items-end gap-[3px]">
        {data.map((x, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end" title={`${x.d}: ${x.n}`}>
            <span className={`text-[9px] font-bold leading-none ${x.n > 0 ? "text-fg" : "text-transparent"}`}>{x.n}</span>
            <div className={`mt-0.5 w-full rounded-sm ${tone} ${x.n === 0 ? "opacity-30" : ""}`}
              style={{ height: `${Math.max((x.n / max) * 100, x.n > 0 ? 6 : 3)}%` }} />
            <span className="mt-1 text-[9px] leading-none text-muted">{x.d.slice(8)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-lg font-bold text-fg">{title}</h2>
      {children}
    </div>
  );
}

function Table({
  title,
  head,
  rows,
}: {
  title?: string;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-[10px] border border-line bg-panel">
      {title && <div className="border-b border-line px-4 py-2 text-sm font-bold text-fg">{title}</div>}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            {head.map((h, i) => (
              <th key={i} className={`px-4 py-2 font-semibold ${i > 0 ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="px-4 py-3 text-center text-xs text-muted">Məlumat yoxdur</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t border-line">
                {r.map((c, j) => (
                  <td
                    key={j}
                    className={`px-4 py-2 ${j > 0 ? "text-right font-semibold text-fg" : "text-muted"} ${j === 0 ? "max-w-[240px] truncate" : ""}`}
                  >
                    {typeof c === "number" ? c.toLocaleString("az-AZ") : c}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
