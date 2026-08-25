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
import { writeFileSync } from "node:fs";
import { subjects } from "@/lib/content";

const out = "public/content-seed.json";
const json = JSON.stringify(subjects);
writeFileSync(out, json);
const tasks = subjects.reduce(
  (n, s) => n + s.units.reduce((m, u) => m + u.lessons.reduce((k, l) => k + l.tasks.length + (l.bonusTasks?.length ?? 0), 0), 0),
  0,
);
console.log(`${out} yazıldı: ${subjects.length} fənn, ${tasks} tapşırıq, ${(json.length / 1048576).toFixed(2)} MB`);
