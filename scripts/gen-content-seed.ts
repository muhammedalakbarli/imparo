/**
 * TS məzmununu statik JSON-a çevirir: public/content-seed.json
 *
 * NİYƏ: ContentProvider DB əlçatmaz olanda TS seed-ə fallback edir. Əvvəllər bu,
 * `await import("@/lib/content")` ilə edilirdi — Next həmin 25 fənn faylını HƏM
 * server chunk-ına, HƏM də ssr chunk-ına qoyurdu (2.1 MB × 2) və hər ikisi
 * Cloudflare Worker yükünə (3 MiB limit) sayılırdı. İndi fallback JSON-u ASSETS-dən
 * fetch edir: Worker bundle-ında məzmundan bir bayt da qalmır.
 *
 * `npm run build` bunu avtomatik çağırır (prebuild).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { subjects } from "@/lib/content";

// Fənn slug-larının kiçik siyahısı — /subjects/[slug] səhifəsinin
// generateStaticParams-ı üçün. Səhifə "@/lib/content"-i idxal edə BİLMƏZ (2.1 MB
// Worker yükünə düşər), ona görə lazım olan yeganə şey — slug-lar — ayrıca,
// bir neçə yüz baytlıq fayla yazılır. Build zamanı yaradıldığı üçün məzmunla
// heç vaxt fərqlənə bilməz.
const slugsOut = "lib/generated/subject-slugs.ts";
const out = "public/content-seed.json";
const json = JSON.stringify(subjects);
writeFileSync(out, json);

mkdirSync("lib/generated", { recursive: true });
writeFileSync(
  slugsOut,
  "// AVTOMATİK YARADILIR — scripts/gen-content-seed.ts. Əl ilə dəyişmə.\n" +
    `export const SUBJECT_SLUGS = ${JSON.stringify(subjects.map((s) => s.slug), null, 2)} as const;\n`,
);
const tasks = subjects.reduce(
  (n, s) => n + s.units.reduce((m, u) => m + u.lessons.reduce((k, l) => k + l.tasks.length + (l.bonusTasks?.length ?? 0), 0), 0),
  0,
);
console.log(`${out} yazıldı: ${subjects.length} fənn, ${tasks} tapşırıq, ${(json.length / 1048576).toFixed(2)} MB`);
console.log(`${slugsOut} yazıldı: ${subjects.length} slug`);
