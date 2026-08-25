/**
 * Pilotun həftəlik monitorinqi — YALNIZ OXUMA.
 *
 *   npx tsx scripts/pilot-monitor.ts <pilot_id>
 *
 * Məqsəd: pilotun GEDİŞİNİ izləmək (kim düşür, kim baseline verməyib), ƏSAS
 * NƏTİCƏNİ yox. Əsas nəticəyə hər həftə baxıb sistemi tənzimləmək ölçməni məhv
 * edir: 2-ci həftədə mühərriki dəyişsək, 1-ci və 2-ci həftənin datası artıq eyni
 * müdaxiləni ölçmür. Ona görə bu skript qazanc/fərq HESABLAMIR.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const pilotId = process.argv[2];
if (!pilotId) throw new Error("istifadə: npx tsx scripts/pilot-monitor.ts <pilot_id>");

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const DAY = 86_400_000;

async function main() {
  const { data, error } = await sb
    .from("pilot_participants")
    .select("user_id,grade,enrolled_at,baseline_done_at,final_done_at,status")
    .eq("pilot_id", pilotId);
  if (error) throw error;
  const all = (data ?? []) as {
    user_id: string;
    grade: number;
    enrolled_at: string;
    baseline_done_at: string | null;
    final_done_at: string | null;
    status: string;
  }[];
  if (!all.length) throw new Error(`"${pilotId}" pilotunda iştirakçı yoxdur`);

  const ids = all.map((p) => p.user_id);
  const since = new Date(Date.now() - 7 * DAY).toISOString();
  const { data: att } = await sb
    .from("task_attempts")
    .select("user_id,created_at")
    .in("user_id", ids)
    .gte("created_at", since);
  const rows = (att ?? []) as { user_id: string; created_at: string }[];

  const active = new Set(rows.map((r) => r.user_id));
  const days = new Map<string, Set<string>>();
  for (const r of rows) {
    const d = days.get(r.user_id) ?? new Set<string>();
    d.add(r.created_at.slice(0, 10));
    days.set(r.user_id, d);
  }
  const dayCounts = [...days.values()].map((s) => s.size);
  const avgDays = dayCounts.length ? dayCounts.reduce((a, b) => a + b, 0) / dayCounts.length : 0;

  const pct = (n: number) => `${((100 * n) / all.length).toFixed(1)}%`;

  console.log(`\n═══ Pilot «${pilotId}» — ${new Date().toISOString().slice(0, 10)}\n`);
  console.log(`  qeydiyyat                 ${all.length}`);
  console.log(`  baseline tamamlayıb       ${all.filter((p) => p.baseline_done_at).length}  (${pct(all.filter((p) => p.baseline_done_at).length)})`);
  console.log(`  final tamamlayıb          ${all.filter((p) => p.final_done_at).length}  (${pct(all.filter((p) => p.final_done_at).length)})`);
  console.log(`  'dropped' işarələnib      ${all.filter((p) => p.status === "dropped").length}`);
  console.log(`\n  son 7 gündə aktiv         ${active.size}  (${pct(active.size)})`);
  console.log(`  aktivlərdə orta aktiv gün ${avgDays.toFixed(1)}`);
  console.log(`  son 7 gündə cəhd          ${rows.length}`);

  console.log(`\n  sinif üzrə:`);
  for (const g of [...new Set(all.map((p) => p.grade))].sort()) {
    const inG = all.filter((p) => p.grade === g);
    console.log(`    ${g}. sinif — ${inG.length} şagird · baseline ${inG.filter((p) => p.baseline_done_at).length} · aktiv ${inG.filter((p) => active.has(p.user_id)).length}`);
  }

  // Diqqət tələb edənlər: qeydiyyatdan 7+ gün keçib, baseline hələ yoxdur.
  const stale = all.filter(
    (p) => !p.baseline_done_at && Date.now() - new Date(p.enrolled_at).getTime() > 7 * DAY && p.status === "active",
  );
  if (stale.length) console.log(`\n  ⚠ baseline verməyib (7+ gün): ${stale.length} şagird`);

  const idle = all.filter((p) => p.baseline_done_at && !p.final_done_at && !active.has(p.user_id) && p.status === "active");
  if (idle.length) console.log(`  ⚠ son 7 gündə heç bir cəhd yoxdur: ${idle.length} şagird`);

  console.log(`\n  Qeyd: bu skript QAZANC hesablamır. Əsas nəticəyə pilot bitənə qədər baxılmır.\n`);
}

main();
