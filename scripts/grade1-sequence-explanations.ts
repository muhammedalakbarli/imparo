// 1-ci sinif riyaziyyatında "N-dan sonra / əvvəl hansı ədəd gəlir?" suallarının izahını
// "+1 / −1" əvəzinə sıra ilə saymağa çevirir (5 → 6 → 7). Uşaq bu suallarla
// qarşılaşanda hələ "+" və "=" işarələrini keçməyib.
// İşlətmək: npx tsx scripts/grade1-sequence-explanations.ts && npx tsx supabase/seed.ts
import { readFileSync, writeFileSync } from "node:fs";
import { subjects } from "../lib/content";
import { sequenceExplanation } from "../lib/azNumeralSuffix";

const AFTER = /^(\d+)-(?:dan|dən) sonra hansı ədəd gəlir\?$/;
const BEFORE = /^(\d+)-(?:dan|dən) əvvəl (?:gələn ədəd hansıdır|hansı ədəd gəlir)\?$/;
const file = "lib/content/math1.ts";
const src = readFileSync(file, "utf8");
const s = subjects.find((x) => x.slug === "riyaziyyat-1")!;
let n = 0;
const lines = src.split("\n");
for (const u of s.units)
  for (const l of u.lessons) {
    // Bölmə sonu testlərinin sualları mənbədə yoxdur — dərslərdən avtomatik yığılır
    // (lib/content/unitTest.ts), ona görə dərsdəki düzəliş onlara özü keçir.
    if (l.kind === "test") continue;
    for (const t of [...l.tasks, ...(l.bonusTasks ?? [])]) {
      const a = t.prompt.match(AFTER);
      const b = t.prompt.match(BEFORE);
      if (!a && !b || !t.explanation) continue;
      const next = a ? sequenceExplanation("after", +a[1]) : sequenceExplanation("before", +b![1]);
      if (next === t.explanation) continue;
      const i = lines.findIndex((ln) => ln.includes(`id: "${t.id}"`));
      const oldLit = JSON.stringify(t.explanation);
      if (i < 0 || !lines[i].includes(oldLit)) throw new Error(`tapılmadı: ${t.id}`);
      lines[i] = lines[i].replace(oldLit, JSON.stringify(next));
      n++;
    }
  }
writeFileSync(file, lines.join("\n"));
console.log(`izah yeniləndi: ${n}`);
