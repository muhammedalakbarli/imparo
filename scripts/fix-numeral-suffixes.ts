// lib/content/*.ts faylarındakı bütün sətir literallarında "rəqəm-şəkilçi" ahəngini düzəldir
// ("6-dən" → "6-dan", "3-dir" → "3-dür", "1-ni" → "1-i"). Qayda: lib/azNumeralSuffix.ts.
//
// Yalnız cüt dırnaqlı sətirlərin İÇİNƏ toxunur; id-lər ("ry2-a") qorunur — qaydanın
// regex-i hərfdən sonra gələn rəqəmi tutmur. Dəyişiklikdən sonra bazanı yeniləmək üçün:
//   npx tsx scripts/fix-numeral-suffixes.ts && npx tsx supabase/seed.ts
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fixNumeralSuffixes } from "../lib/azNumeralSuffix";

const dir = path.join(process.cwd(), "lib/content");
let files = 0;
let changed = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith(".ts"))) {
  const p = path.join(dir, f);
  const src = readFileSync(p, "utf8");
  let n = 0;
  const out = src.replace(/"((?:[^"\\\n]|\\.)*)"/g, (whole, inner: string) => {
    const fixed = fixNumeralSuffixes(inner);
    if (fixed === inner) return whole;
    n++;
    return `"${fixed}"`;
  });
  if (n > 0) {
    writeFileSync(p, out);
    files++;
    changed += n;
    console.log(`${f}: ${n} sətir`);
  }
}
console.log(`cəmi: ${changed} sətir, ${files} fayl`);
