// İzah əhatəsini göstərir (test dərsləri kopyadır — sayılmır).
import { subjects } from "@/lib/content";
let done = 0, todo = 0;
const rows: {slug:string;done:number;total:number}[] = [];
for (const s of subjects) {
  let d = 0, t = 0;
  for (const u of s.units) for (const l of u.lessons) {
    if (l.kind === "test") continue;
    for (const x of [...l.tasks, ...(l.bonusTasks ?? [])]) { t++; if (x.explanation) d++; }
  }
  rows.push({ slug: s.slug, done: d, total: t }); done += d; todo += t;
}
rows.sort((a,b)=>b.done/Math.max(b.total,1)-a.done/Math.max(a.total,1));
for (const r of rows) if (r.done) console.log(`  ${r.slug.padEnd(28)} ${r.done}/${r.total}`);
console.log(`\nÜMUMİ: ${done}/${todo}  (${((done/todo)*100).toFixed(1)}%)`);
