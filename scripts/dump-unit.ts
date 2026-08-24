// Bir bölmənin tapşırıqlarını izah yazmaq üçün oxunaqlı şəkildə çıxarır.
// İşlətmək: npx tsx scripts/dump-unit.ts <subject-slug> [unit-id]
import { subjects } from "@/lib/content";

const [slug, unitId] = process.argv.slice(2);
const s = subjects.find((x) => x.slug === slug);
if (!s) { console.error("fənn tapılmadı:", slug); process.exit(1); }

for (const u of s.units) {
  if (unitId && u.id !== unitId) continue;
  console.log(`\n═══ ${u.id} — ${u.title}`);
  for (const l of u.lessons) {
    if (!l.tasks.length) continue;
    console.log(`  ── ${l.id} (${l.kind ?? "lesson"})`);
    // Test dərsləri lesson tapşırıqlarının KOPYASIDIR ({...t} ilə yaradılır,
    // bax lib/content/unitTest.ts) — izah özü miras qalır, ayrıca yazmaq lazım deyil.
    if (l.kind === "test") { console.log("     (test — kopyadır, izah miras qalır)"); continue; }
    for (const t of [...l.tasks, ...(l.bonusTasks ?? [])]) {
      let ans = "";
      if (t.type === "multiple_choice" || t.type === "listening") ans = t.options[t.correctIndex];
      else if (t.type === "numeric") ans = String(t.answer);
      else if (t.type === "fill_blank") ans = t.accepted.join(" / ");
      else if (t.type === "word_order") ans = t.answer;
      const has = t.explanation ? "✓" : " ";
      const opts =
        t.type === "multiple_choice" || t.type === "listening"
          ? `   [${t.options.join(" | ")}]`
          : "";
      console.log(`  ${has} ${t.id} | ${t.prompt} | → ${ans}${opts}`);
    }
  }
}
