/**
 * Riyaziyyat tapşırıqları üçün izah generatoru.
 *
 * YALNIZ mexaniki hesabı izah edir: "34 + 25 = ?" kimi sualda cavabın
 * ADDIM-ADDIM necə alındığını yazır. Tanımadığı sualı toxunmadan buraxır —
 * onları əl ilə yazmaq lazımdır (mətn məsələləri, anlayış sualları).
 *
 * İstifadə:  npx tsx scripts/gen-math-explain.ts <subject-slug> [unit-id]
 * Nəticə stdout-a JSON kimi yazılır (add-explanations.ts formatında).
 */
import { subjects } from "@/lib/content";
import type { Task } from "@/lib/types";

const N = "(-?\\d+)";
const num = (s: string) => Number(s);

/**
 * Ədədin təsirlik hal şəkilçisi ahəngə görə dəyişir: 10-u, 18-i, 20-ni, 9-u.
 * Şəkilçi ədədin OXUNUŞUNDAKI son sözün saitindən asılıdır.
 */
const ACC_UNIT: Record<number, string> = { 1: "i", 2: "ni", 3: "ü", 4: "ü", 5: "i", 6: "nı", 7: "ni", 8: "i", 9: "u" };
const ACC_TEN: Record<number, string> = { 10: "u", 20: "ni", 30: "u", 40: "ı", 50: "ni", 60: "ı", 70: "i", 80: "i", 90: "ı" };
function acc(n: number): string {
  const a = Math.abs(n);
  let suf: string;
  if (a === 0) suf = "ı";
  else if (a % 10 !== 0) suf = ACC_UNIT[a % 10];
  else if (a % 100 !== 0) suf = ACC_TEN[a % 100];
  else if (a % 1000 !== 0) suf = "ü"; // ...yüz
  else if (a % 1000000 !== 0) suf = "i"; // ...min
  else suf = "u"; // ...milyon
  return `${n}-${suf}`;
}

/** Ədədi mərtəbələrə ayırır: 275 → [200, 70, 5]. */
function parts(n: number): number[] {
  const out: number[] = [];
  let unit = 1;
  for (let x = n; x > 0; x = Math.floor(x / 10), unit *= 10) {
    const d = x % 10;
    if (d) out.unshift(d * unit);
  }
  return out;
}

/** a + b üçün izah: kiçik ədədlərdə onluq/təklik, böyüklərdə mərtəbə üzrə addımlar. */
function addSteps(a: number, b: number): string {
  const s = a + b;
  if (a >= 100 || b >= 100) {
    const ps = parts(b);
    if (ps.length < 2) return `${a} + ${b} = ${s}.`;
    let cur = a;
    const steps = ps.map((p) => `${cur} + ${p} = ${(cur += p)}`);
    return `${b} ədədini mərtəbələrə ayırırıq: ${ps.join(" + ")}. Ardıcıl toplayırıq: ${steps.join(", ")}.`;
  }
  if (a < 10 && b < 10) {
    if (s <= 10) return `${a}-ə ${b} əlavə edirik: ${a} + ${b} = ${s}.`;
    const need = 10 - a;
    return `Əvvəl 10-u tamamlayırıq: ${a} + ${need} = 10. ${b}-dən qalan ${b - need} isə üstünə gəlir: 10 + ${b - need} = ${s}.`;
  }
  const [at, au] = [Math.floor(a / 10) * 10, a % 10];
  const [bt, bu] = [Math.floor(b / 10) * 10, b % 10];
  if (au === 0 && bu === 0) return `Onluqları toplayırıq: ${at / 10} onluq + ${bt / 10} onluq = ${s / 10} onluq, yəni ${s}.`;
  const u = au + bu;
  if (u < 10) return `Onluqlar: ${at} + ${bt} = ${at + bt}. Təkliklər: ${au} + ${bu} = ${u}. Nəticə: ${at + bt} + ${u} = ${s}.`;
  return `Təkliklər: ${au} + ${bu} = ${u} — bu, 1 onluq və ${u - 10} təklik deməkdir. Onluqlar: ${at} + ${bt} = ${at + bt}, üstünə keçən onluqla ${at + bt + 10}. Nəticə: ${at + bt + 10} + ${u - 10} = ${s}.`;
}

/** a − b üçün izah. */
function subSteps(a: number, b: number): string {
  const s = a - b;
  if (a >= 100 || b >= 100) {
    const ps = parts(b);
    if (ps.length < 2) return `${a} − ${b} = ${s}.`;
    let cur = a;
    const steps = ps.map((p) => `${cur} − ${p} = ${(cur -= p)}`);
    return `${b} ədədini mərtəbələrə ayırırıq: ${ps.join(" + ")}. Ardıcıl çıxırıq: ${steps.join(", ")}.`;
  }
  if (a <= 20 && b < 10) return `${a}-dən ${b} çıxırıq: ${a} − ${b} = ${s}.`;
  const [at, au] = [Math.floor(a / 10) * 10, a % 10];
  const [bt, bu] = [Math.floor(b / 10) * 10, b % 10];
  if (au === 0 && bu === 0) return `Onluqları çıxırıq: ${at / 10} onluq − ${bt / 10} onluq = ${s / 10} onluq, yəni ${s}.`;
  if (au >= bu) return `Onluqlar: ${at} − ${bt} = ${at - bt}. Təkliklər: ${au} − ${bu} = ${au - bu}. Nəticə: ${at - bt} + ${au - bu} = ${s}.`;
  return `Təkliklər çatmır (${au} < ${bu}), ona görə bir onluğu açırıq: ${10 + au} − ${bu} = ${10 + au - bu}. Onluqlar: ${at - 10} − ${bt} = ${at - 10 - bt}. Nəticə: ${at - 10 - bt} + ${10 + au - bu} = ${s}.`;
}

function mulSteps(a: number, b: number): string {
  const s = a * b;
  const [big, small] = a >= b ? [a, b] : [b, a];
  // Çoxrəqəmli vuruq varsa, onu mərtəbələrə ayırırıq: 24 × 3 = 20×3 + 4×3
  if (big >= 10 && small < 10) {
    const ps = parts(big);
    if (ps.length >= 2) {
      const terms = ps.map((p) => `${p} × ${small} = ${p * small}`);
      return `${big} ədədini mərtəbələrə ayırırıq: ${ps.join(" + ")}. Hər hissəni vururuq: ${terms.join(", ")}. Cəmi: ${ps.map((p) => p * small).join(" + ")} = ${s}.`;
    }
  }
  // Kiçik vuruq 5-ə qədərdirsə, təkrar toplama ilə göstərmək aydındır
  if (small <= 5) return `${a} × ${b} — ${acc(big)} ${small} dəfə toplamaq deməkdir: ${Array(small).fill(big).join(" + ")} = ${s}.`;
  // Hər ikisi 6–9 arasındadırsa, 5-ə ayırırıq: 9 × 8 = 9×5 + 9×3
  if (big < 10) return `${a} × ${b} = ${big} × 5 + ${big} × ${small - 5} = ${big * 5} + ${big * (small - 5)} = ${s}.`;
  return `${a} × ${b} = ${s}.`;
}

function divSteps(a: number, b: number): string {
  const s = a / b;
  if (!Number.isInteger(s)) return "";
  return `${acc(a)} ${b} bərabər hissəyə bölürük. Hər hissəyə ${s} düşür, çünki ${b} × ${s} = ${a}.`;
}

type Rule = { re: RegExp; fn: (m: RegExpMatchArray, t: Task) => string };

const rules: Rule[] = [
  { re: new RegExp(`^${N}\\s*[+]\\s*${N}\\s*=\\s*\\?`), fn: (m) => addSteps(num(m[1]), num(m[2])) },
  { re: new RegExp(`^${N}\\s*[-−]\\s*${N}\\s*=\\s*\\?`), fn: (m) => subSteps(num(m[1]), num(m[2])) },
  { re: new RegExp(`^${N}\\s*[×x*·]\\s*${N}\\s*=\\s*\\?`), fn: (m) => mulSteps(num(m[1]), num(m[2])) },
  { re: new RegExp(`^${N}\\s*[:÷]\\s*${N}\\s*=\\s*\\?`), fn: (m) => divSteps(num(m[1]), num(m[2])) },
  {
    re: new RegExp(`^${N}\\s*\\+\\s*${N}\\s*\\+\\s*${N}\\s*=\\s*\\?`),
    fn: (m) => {
      const [a, b, c] = [num(m[1]), num(m[2]), num(m[3])];
      return `Soldan sağa toplayırıq: əvvəl ${a} + ${b} = ${a + b}, sonra ${a + b} + ${c} = ${a + b + c}.`;
    },
  },
  { re: new RegExp(`^${N} ədədində neçə onluq var\\?`), fn: (m) => { const n = num(m[1]); return `${n} = ${Math.floor(n / 10)} onluq + ${n % 10} təklik. Deməli onluqların sayı ${Math.floor(n / 10)}-dir.`; } },
  { re: new RegExp(`^${N} ədədində neçə təklik var\\?`), fn: (m) => { const n = num(m[1]); return `${n} = ${Math.floor(n / 10)} onluq + ${n % 10} təklik. Deməli təkliklərin sayı ${n % 10}-dir.`; } },
  { re: new RegExp(`^${N} onluq \\+ ${N} təklik`), fn: (m) => { const [t, u] = [num(m[1]), num(m[2])]; return `${t} onluq ${t * 10} deməkdir. Üstünə ${u} təklik gəlir: ${t * 10} + ${u} = ${t * 10 + u}.`; } },
  { re: new RegExp(`^${N} onluq\\s*=\\s*\\?`), fn: (m) => { const t = num(m[1]); return `1 onluq 10-dur, ona görə ${t} onluq = ${t} × 10 = ${t * 10}.`; } },
  { re: new RegExp(`^${N}-[dD](an|ən) sonra hansı ədəd`), fn: (m) => { const n = num(m[1]); return `«Sonra gələn» 1 çox deməkdir: ${n} + 1 = ${n + 1}.`; } },
  { re: new RegExp(`^${N}-[dD](an|ən) əvvəl`), fn: (m) => { const n = num(m[1]); return `«Əvvəl gələn» 1 az deməkdir: ${n} − 1 = ${n - 1}.`; } },
  { re: new RegExp(`^${N}-[iıuü]n sağ qonşusu`), fn: (m) => { const n = num(m[1]); return `Sağ qonşu ədəddən 1 böyükdür: ${n} + 1 = ${n + 1}.`; } },
  { re: new RegExp(`^${N}-[iıuü]n sol qonşusu`), fn: (m) => { const n = num(m[1]); return `Sol qonşu ədəddən 1 kiçikdir: ${n} − 1 = ${n - 1}.`; } },
  {
    re: new RegExp(`^${N},\\s*${N},\\s*${N}(,\\s*${N})?\\s*,?\\s*\\.\\.\\.`),
    fn: (m) => {
      const xs = [m[1], m[2], m[3], m[5]].filter(Boolean).map(num);
      const d = xs[1] - xs[0];
      if (xs.some((v, i) => i > 0 && v - xs[i - 1] !== d)) return "";
      const last = xs[xs.length - 1];
      return d > 0
        ? `Sıra hər dəfə ${d} artır: ${xs.join(", ")}. Deməli növbəti ədəd ${last} + ${d} = ${last + d}.`
        : `Sıra hər dəfə ${-d} azalır: ${xs.join(", ")}. Deməli növbəti ədəd ${last} − ${-d} = ${last + d}.`;
    },
  },
  {
    re: new RegExp(`^Hansı daha (böyük|kiçik)dür: ${N} yoxsa ${N}\\?`),
    fn: (m) => {
      const [a, b] = [num(m[2]), num(m[3])];
      const [hi, lo] = a > b ? [a, b] : [b, a];
      return m[1] === "böyük"
        ? `Əvvəl onluqlara baxırıq: ${Math.floor(hi / 10)} onluq ${Math.floor(lo / 10)} onluqdan çoxdur. Deməli ${hi} > ${lo}.`
        : `Əvvəl onluqlara baxırıq: ${Math.floor(lo / 10)} onluq ${Math.floor(hi / 10)} onluqdan azdır. Deməli ${lo} < ${hi}.`;
    },
  },
  {
    re: new RegExp(`^${N} və ${N} ədədlərindən (böyüyü|kiçiyi)`),
    fn: (m) => {
      const [a, b] = [num(m[1]), num(m[2])];
      const [hi, lo] = a > b ? [a, b] : [b, a];
      return m[3] === "böyüyü"
        ? `Onluqlara baxırıq: ${Math.floor(hi / 10)} onluq ${Math.floor(lo / 10)} onluqdan çoxdur, deməli ${hi} böyükdür.`
        : `Onluqlara baxırıq: ${Math.floor(lo / 10)} onluq ${Math.floor(hi / 10)} onluqdan azdır, deməli ${lo} kiçikdir.`;
    },
  },
];

function explain(t: Task): string {
  const p = t.prompt.trim();
  for (const r of rules) {
    const m = p.match(r.re);
    if (m) {
      const out = r.fn(m, t);
      if (out) return out;
    }
  }
  return "";
}

const slug = process.argv[2];
const unitFilter = process.argv[3];
const s = subjects.find((x) => x.slug === slug);
if (!s) throw new Error(`fənn tapılmadı: ${slug}`);

const out: Record<string, string> = {};
const missed: string[] = [];
for (const u of s.units) {
  if (unitFilter && u.id !== unitFilter) continue;
  for (const l of u.lessons) {
    if (l.kind === "test") continue;
    for (const t of [...l.tasks, ...(l.bonusTasks ?? [])]) {
      if (t.explanation) continue;
      const e = explain(t);
      if (e) out[t.id] = e;
      else {
        const a =
          "options" in t && Array.isArray(t.options) && typeof t.correctIndex === "number"
            ? t.options[t.correctIndex]
            : "answers" in t && Array.isArray(t.answers)
              ? t.answers.join(" / ")
              : "?";
        missed.push(`${t.id} | ${t.prompt} | → ${a}`);
      }
    }
  }
}
console.error(`tapıldı: ${Object.keys(out).length}, əl ilə lazım: ${missed.length}`);
console.error(missed.join("\n"));
console.log(JSON.stringify(out, null, 1));
