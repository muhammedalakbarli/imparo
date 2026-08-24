// İzahları məzmun fayllarına əlavə edir.
// İşlətmək: npx tsx scripts/add-explanations.ts <json-fayl>
// JSON formatı: { "task-id": "izah", ... }
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const map: Record<string, string> = JSON.parse(readFileSync(process.argv[2], "utf8"));
const dir = "lib/content";
const files = readdirSync(dir).filter((f) => f.endsWith(".ts"));

let added = 0;
const missing: string[] = [];

for (const [id, ex] of Object.entries(map)) {
  let done = false;
  for (const f of files) {
    const path = join(dir, f);
    const src = readFileSync(path, "utf8");
    if (!src.includes(`id: "${id}"`)) continue;
    // Həmin tapşırıq obyektində `xp: N` -dən sonra explanation əlavə et.
    const re = new RegExp(`(\\{ id: "${id}",[^\\n]*?)(, xp: \\d+)( \\})`);
    const out = src.replace(re, (_m, a, b) => `${a}${b}, explanation: ${JSON.stringify(ex)} }`);
    if (out !== src) {
      writeFileSync(path, out);
      added++;
      done = true;
      break;
    }
  }
  if (!done) missing.push(id);
}

console.log(`əlavə olundu: ${added}/${Object.keys(map).length}`);
if (missing.length) console.log("TAPILMADI:", missing.join(", "));
