/**
 * Pilot hesabatını datadan doldurur.
 *
 *   npx tsx scripts/pilot-report.ts <pilot_id> [--baseline-days 7] [--final-days 7]
 *
 * Sənədlər: docs/pilot/analysis-plan.md · docs/pilot/report-template.md
 *
 * VACİB: hədəf/müqayisə bölgüsü runtime ilə EYNİ funksiyadan (`assignPilotSkills`)
 * çıxarılır. Ayrı məntiq yazsaq, analiz şagirdin real gördüyündən fərqli bölgü
 * hesablayardı və nəticə mənasız olardı.
 *
 * Bütün rəqəmlər xam `task_attempts` jurnalından yenidən hesablana bilir.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { subjects } from "@/lib/content";
import { getSkill } from "@/lib/skills";
import { assignPilotSkills, skillPools, PILOT_SKILLS, primarySkills, LIMITED_ITEM_SKILLS, differenceInGains } from "@/lib/pilot";
import type { MasteryMap } from "@/lib/mastery";

config({ path: ".env.local" });

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const pilotId = process.argv[2];
if (!pilotId) throw new Error("istifadə: npx tsx scripts/pilot-report.ts <pilot_id>");
const BASELINE_DAYS = arg("baseline-days", 7);
const FINAL_DAYS = arg("final-days", 7);
const DAY = 86_400_000;

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const math = subjects.filter((s) => s.slug.startsWith("riyaziyyat"));

/** tapşırıq → bacarıqlar. Exposure sayarkən hər cəhdin hansı bacarığa aid
 *  olduğunu bilmək üçün; DB-yə əlavə join etmirik. */
const TASK_SKILLS = new Map<string, string[]>();
for (const s of math)
  for (const u of s.units)
    for (const l of u.lessons)
      for (const t of [...l.tasks, ...(l.bonusTasks ?? [])])
        if (t.skills?.length) TASK_SKILLS.set(t.id, t.skills);

interface Participant {
  user_id: string;
  grade: number;
  enrolled_at: string;
  baseline_done_at: string | null;
  final_done_at: string | null;
  status: string;
}

async function mastery(userId: string, from: Date, to: Date): Promise<MasteryMap> {
  const { data, error } = await sb.rpc("pilot_skill_mastery", {
    p_user_id: userId,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  const m: MasteryMap = new Map();
  if (error || !Array.isArray(data)) return m;
  for (const r of data as { skill_id: string; mastery: number; attempts: number; last_seen: string }[])
    m.set(r.skill_id, { mastery: r.mastery, attempts: r.attempts, lastSeen: r.last_seen });
  return m;
}

/** F hovuzundakı (şagirdin əvvəl görmədiyi) tapşırıqlarda dəqiqlik. */
async function novelAccuracy(userId: string, grade: number, skills: string[], from: Date, to: Date) {
  const ids = skills.flatMap((id) => skillPools(math, id, grade).F.map((t) => t.id));
  if (!ids.length) return { correct: 0, total: 0, leaked: 0 };
  const { data } = await sb
    .from("task_attempts")
    .select("task_id,correct,created_at")
    .eq("user_id", userId)
    .in("task_id", ids);
  const rows = (data ?? []) as { task_id: string; correct: boolean; created_at: string }[];
  // Pozuntu: F elementi final pəncərəsindən ƏVVƏL görünübsə, o bacarıq transfer
  // analizindən çıxır (bax analysis-plan.md §5).
  const leaked = new Set(rows.filter((r) => new Date(r.created_at) < from).map((r) => r.task_id));
  const inWindow = rows.filter(
    (r) => !leaked.has(r.task_id) && new Date(r.created_at) >= from && new Date(r.created_at) < to,
  );
  return {
    correct: inWindow.filter((r) => r.correct).length,
    total: inWindow.length,
    leaked: leaked.size,
  };
}

/**
 * Müdaxilə pəncərəsində bacarıq üzrə MƏŞQ sayı.
 *
 * Niyə vacib: hədəf seçilmiş, amma cəmi 2 tapşırıq həll edilmiş bacarığın
 * "qazancını" 30 tapşırıq həll edilmiş bacarıqla eyni oxumaq olmaz. Exposure
 * olmadan nəticənin arxasında real müdaxilə olub-olmadığı bilinmir.
 *
 * B və F hovuzları sayılmır — onlar ölçmədir, məşq deyil.
 */
async function exposure(userId: string, grade: number, skills: string[], from: Date, to: Date) {
  const practiceIds = new Set<string>();
  for (const id of skills) for (const t of skillPools(math, id, grade).P) practiceIds.add(t.id);
  const { data } = await sb
    .from("task_attempts")
    .select("task_id")
    .eq("user_id", userId)
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString());
  const counts = new Map<string, number>();
  for (const r of (data ?? []) as { task_id: string }[]) {
    if (!practiceIds.has(r.task_id)) continue;
    for (const sk of TASK_SKILLS.get(r.task_id) ?? []) {
      if (skills.includes(sk)) counts.set(sk, (counts.get(sk) ?? 0) + 1);
    }
  }
  return counts;
}

const median = (a: number[]) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const i = Math.floor(s.length / 2);
  return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2;
};
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

/** Persentil bootstrap — nümunə kiçik və paylanma naməlum olduğu üçün. */
function bootstrapCI(a: number[], iters = 5000): [number, number] | null {
  if (a.length < 3) return null;
  const means: number[] = [];
  for (let i = 0; i < iters; i++) {
    let s = 0;
    for (let j = 0; j < a.length; j++) s += a[Math.floor(Math.random() * a.length)];
    means.push(s / a.length);
  }
  means.sort((x, y) => x - y);
  return [means[Math.floor(iters * 0.025)], means[Math.floor(iters * 0.975)]];
}

const f = (v: number | null, d = 1) => (v === null ? "—" : v.toFixed(d));

async function main() {
  const { data, error } = await sb
    .from("pilot_participants")
    .select("user_id,grade,enrolled_at,baseline_done_at,final_done_at,status")
    .eq("pilot_id", pilotId);
  if (error) throw error;
  const all = (data ?? []) as Participant[];
  if (!all.length) throw new Error(`"${pilotId}" pilotunda iştirakçı yoxdur`);

  const withBaseline = all.filter((p) => p.baseline_done_at);
  const completers = all.filter((p) => p.baseline_done_at && p.final_done_at);

  const diffs: number[] = [];
  const byGrade = new Map<number, number[]>();
  const perSkill = new Map<string, { n: number; base: number; fin: number; exp: number }>();
  let novelT = { c: 0, t: 0 }, novelC = { c: 0, t: 0 }, leaked = 0, excluded = 0;

  for (const p of completers) {
    const bTo = new Date(p.baseline_done_at!);
    const bFrom = new Date(bTo.getTime() - BASELINE_DAYS * DAY);
    const fTo = new Date(new Date(p.final_done_at!).getTime() + DAY);
    const fFrom = new Date(new Date(p.final_done_at!).getTime() - FINAL_DAYS * DAY);

    const base = await mastery(p.user_id, bFrom, bTo);
    const fin = await mastery(p.user_id, fFrom, fTo);

    // Bölgü runtime ilə eyni funksiyadan, eyni toxumla.
    const a = assignPilotSkills(math, base, PILOT_SKILLS[p.grade] ?? [], p.grade, p.user_id);
    // Əsas analiz sərhəd-materiallı bacarıqları kənarda saxlayır.
    const prim = new Set(primarySkills(p.grade));
    const target = a.target.filter((s) => prim.has(s));
    const comparison = a.comparison.filter((s) => prim.has(s));

    const input = {
      baseline: new Map([...base].map(([k, v]) => [k, v.mastery])),
      final: new Map([...fin].map(([k, v]) => [k, v.mastery])),
    };
    const d = differenceInGains(input, { target, comparison });
    if (d === null) {
      excluded++;
    } else {
      diffs.push(d);
      byGrade.set(p.grade, [...(byGrade.get(p.grade) ?? []), d]);
    }

    // Müdaxilə pəncərəsi: baseline bitəndən final başlayana qədər.
    const expo = await exposure(p.user_id, p.grade, [...target, ...comparison], bTo, fFrom);
    for (const id of [...target, ...comparison]) {
      const b = input.baseline.get(id);
      const fv = input.final.get(id);
      if (b === undefined || fv === undefined) continue;
      const r = perSkill.get(id) ?? { n: 0, base: 0, fin: 0, exp: 0 };
      perSkill.set(id, { n: r.n + 1, base: r.base + b, fin: r.fin + fv, exp: r.exp + (expo.get(id) ?? 0) });
    }

    const nt = await novelAccuracy(p.user_id, p.grade, target, fFrom, fTo);
    const nc = await novelAccuracy(p.user_id, p.grade, comparison, fFrom, fTo);
    novelT = { c: novelT.c + nt.correct, t: novelT.t + nt.total };
    novelC = { c: novelC.c + nc.correct, t: novelC.t + nc.total };
    leaked += nt.leaked + nc.leaked;
  }

  const ci = bootstrapCI(diffs);
  const pct = (x: { c: number; t: number }) => (x.t ? (100 * x.c) / x.t : null);

  const out: string[] = [];
  out.push(`# İmparo — Öyrənmə Təsiri Hesabatı · ${pilotId}`, "");
  out.push(`Hesablandı: ${new Date().toISOString().slice(0, 10)} · analiz planı: docs/pilot/analysis-plan.md`, "");
  out.push("## Xülasə", "", "| | |", "|---|---|");
  out.push(`| Qeydiyyat | ${all.length} |`);
  out.push(`| Baseline tamamlayan | ${withBaseline.length} |`);
  out.push(`| **Final tamamlayan** | **${completers.length}** |`);
  out.push(`| **Tamamlama faizi** | **${f((100 * completers.length) / all.length)}%** |`);
  out.push(`| Əsas analizə daxil | ${diffs.length} (${excluded} şagird bir dəstdə ölçülə bilən bacarığı olmadığı üçün çıxıb) |`, "");
  out.push("> Nəticələr yalnız final testi tamamlayanlara aiddir və bütün kohorta şamil edilmir.", "");

  out.push("## Əsas nəticə — qazanclar fərqi", "", "| | dəyər |", "|---|---|");
  out.push(`| Median | ${f(median(diffs))} faiz bəndi |`);
  out.push(`| Orta | ${f(mean(diffs))} faiz bəndi |`);
  out.push(`| 95% EA (bootstrap) | ${ci ? `${f(ci[0])} … ${f(ci[1])}` : "— (n < 3)"} |`, "");

  out.push("## Yeni tapşırıqda transfer (F hovuzu)", "", "| dəst | dəqiqlik | cavab |", "|---|---|---|");
  out.push(`| Hədəf bacarıqlar | ${f(pct(novelT))}% | ${novelT.t} |`);
  out.push(`| Müqayisə bacarıqları | ${f(pct(novelC))}% | ${novelC.t} |`);
  out.push(`| Pozuntuya görə çıxarılan element | ${leaked} | |`, "");

  out.push("## Bacarıq üzrə", "", "| bacarıq | şagird | baseline | məşq | final | fərq |", "|---|---|---|---|---|---|");
  for (const [id, r] of [...perSkill].sort((a, b) => b[1].n - a[1].n)) {
    const b = r.base / r.n, fv = r.fin / r.n;
    const mark = LIMITED_ITEM_SKILLS.has(id) ? " ⚠️" : "";
    // Məşq sütunu şagird başına ortalamadır — nəticənin arxasında real müdaxilə
    // olub-olmadığını göstərir.
    out.push(`| ${getSkill(id)?.title ?? id}${mark} | ${r.n} | ${f(b, 0)}% | ${f(r.exp / r.n, 1)} | ${f(fv, 0)}% | ${f(fv - b)} |`);
  }
  out.push("", "«məşq» = müdaxilə dövründə şagird başına orta tapşırıq sayı (B və F hovuzları sayılmır).", "⚠️ = məşq materialı sərhəddədir, əsas analizə daxil deyil.", "");

  out.push("## Sinif üzrə", "", "| sinif | n | fərq (median) |", "|---|---|---|");
  for (const g of [...byGrade.keys()].sort()) out.push(`| ${g} | ${byGrade.get(g)!.length} | ${f(median(byGrade.get(g)!))} |`);
  out.push("");

  out.push("## Məhdudiyyətlər", "");
  out.push("- nəzarət qrupu yoxdur; müqayisə şagirdin öz daxilindədir;");
  out.push("- iştirakçılar təsadüfi seçilməyib (məktəb/mərkəz vasitəsilə gəliblər);");
  out.push("- tamamlayanlar daha fəal şagirdlərdir (seçim təsiri);");
  out.push(`- nümunə həcmi ${diffs.length};`);
  out.push("- üç bacarıqda məşq materialı sərhəddədir (⚠️ ilə işarələnib);");
  out.push("- ölçmə yalnız riyaziyyata aiddir, digər fənlərə şamil edilmir.");

  console.log(out.join("\n"));
}

main();
