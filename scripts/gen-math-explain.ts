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
  // Hər iki vuruq çoxrəqəmlidir: kiçiyini mərtəbələrə ayırırıq (18 × 12 = 18×10 + 18×2)
  const ps = parts(small);
  if (ps.length >= 2) {
    const terms = ps.map((p) => `${big} × ${p} = ${big * p}`);
    return `${small} vuruğunu mərtəbələrə ayırırıq: ${ps.join(" + ")}. ${terms.join(", ")}. Cəmi: ${ps.map((p) => big * p).join(" + ")} = ${s}.`;
  }
  return `${a} × ${b} = ${s}.`;
}

function divSteps(a: number, b: number): string {
  const s = a / b;
  if (!Number.isInteger(s)) return "";
  // Qismət çoxrəqəmlidirsə, hissə-hissə bölmə daha aydındır: 945 : 35 → 35×20, 35×7
  const ps = parts(s);
  if (ps.length >= 2) {
    const terms = ps.map((p) => `${b} × ${p} = ${b * p}`);
    return `Hissə-hissə bölürük: ${terms.join(", ")}. Bu hissələrin cəmi ${ps.map((p) => b * p).join(" + ")} = ${a}, deməli qismət ${ps.join(" + ")} = ${s}-dir.`;
  }
  return `${acc(a)} ${b} bərabər hissəyə bölürük. Hər hissəyə ${s} düşür, çünki ${b} × ${s} = ${a}.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Riyazi ifadənin addım-addım hesablanması: "2 + 3 × 4" → "əvvəl 3 × 4 = 12,
// sonra 2 + 12 = 14". Əməllər sırasını (mötərizə → vurma/bölmə → toplama/çıxma)
// şagirdə göstərmək üçün — cavabı yox, YOLU izah edir.
// ─────────────────────────────────────────────────────────────────────────────

type Tok = number | string;

function tokenize(src: string): Tok[] | null {
  const out: Tok[] = [];
  const t = src.replace(/[×*]/g, "*").replace(/[÷:]/g, "/").replace(/[−–—]/g, "-").replace(/\s+/g, "");
  for (let i = 0; i < t.length; ) {
    const c = t[i];
    if (/\d/.test(c)) {
      let j = i;
      while (j < t.length && /\d/.test(t[j])) j++;
      out.push(Number(t.slice(i, j)));
      i = j;
    } else if ("+-*/()".includes(c)) {
      out.push(c);
      i++;
    } else return null;
  }
  return out;
}

const SIGN: Record<string, string> = { "+": "+", "-": "−", "*": "×", "/": ":" };


function apply(a: number, op: string, b: number): number | null {
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "*") return a * b;
  if (b === 0 || a % b !== 0) return null; // 4-cü sinif səviyyəsində qalıqsız bölmə gözlənilir
  return a / b;
}

/** Bir addım yerinə yetirir; sırası: mötərizə → vurma/bölmə → toplama/çıxma. */
function step(toks: Tok[]): { toks: Tok[]; text: string; label: string } | null {
  // ən daxili mötərizə
  let open = -1;
  for (let i = 0; i < toks.length; i++) {
    if (toks[i] === "(") open = i;
    else if (toks[i] === ")" && open >= 0) {
      const inner = toks.slice(open + 1, i);
      if (inner.length === 1 && typeof inner[0] === "number")
        return { toks: [...toks.slice(0, open), inner[0], ...toks.slice(i + 1)], text: "", label: "" };
      const st = step(inner);
      if (!st) return null;
      return { toks: [...toks.slice(0, open), "(", ...st.toks, ")", ...toks.slice(i + 1)], text: st.text, label: "mötərizə" };
    }
  }
  for (const ops of [["*", "/"], ["+", "-"]]) {
    for (let i = 1; i < toks.length - 1; i++) {
      const op = toks[i];
      if (typeof op !== "string" || !ops.includes(op)) continue;
      const a = toks[i - 1];
      const b = toks[i + 1];
      if (typeof a !== "number" || typeof b !== "number") continue;
      const r = apply(a, op, b);
      if (r === null) return null;
      return {
        toks: [...toks.slice(0, i - 1), r, ...toks.slice(i + 2)],
        text: `${a} ${SIGN[op]} ${b} = ${r}`,
        label: ops[0] === "*" ? (op === "*" ? "vurma" : "bölmə") : op === "+" ? "toplama" : "çıxma",
      };
    }
  }
  return null;
}

/** "2 + 3 × 4" kimi ifadəni addım-addım izah edir. Tanımasa boş qaytarır. */
function exprSteps(src: string): string {
  let toks = tokenize(src);
  if (!toks || toks.length < 3) return "";
  const parts: string[] = [];
  let guard = 0;
  while (toks.length > 1) {
    if (++guard > 40) return "";
    const st = step(toks);
    if (!st) return "";
    toks = st.toks;
    if (st.text) parts.push(st.label ? `${st.label}: ${st.text}` : st.text);
  }
  if (!parts.length || typeof toks[0] !== "number") return "";
  const head = src.includes("(") ? "Mötərizə birinci, sonra vurma/bölmə, ən sonda toplama/çıxma." : "Əvvəl vurma/bölmə, sonra toplama/çıxma.";
  return `${head} ${parts.map((p, i) => (i === 0 ? `Əvvəl ${p}` : `sonra ${p}`)).join(", ")}.`;
}

/** Onluğa/yüzlüyə/minliyə yuvarlaqlaşdırma. */
function roundSteps(n: number, unit: number, unitName: string): string {
  const rem = n % unit;
  const down = n - rem;
  const up = down + unit;
  const digit = Math.floor(rem / (unit / 10));
  const res = rem * 2 >= unit ? up : down;
  return `${unitName} yuvarlaqlaşdırarkən ondan sonrakı rəqəmə baxırıq: ${digit}. ${digit >= 5 ? `5-dən kiçik deyil, ona görə yuxarı qalxırıq` : `5-dən kiçikdir, ona görə aşağı qalırıq`}: ${n} → ${res}.`;
}

/** Eyni məxrəcli kəsrlərin toplanması/çıxılması. */
function fracSteps(a: number, b: number, op: string, c: number, d: number): string {
  if (b !== d) return "";
  const num = op === "+" ? a + c : a - c;
  return `Məxrəclər eynidir (${b}), ona görə yalnız sayları ${op === "+" ? "toplayırıq" : "çıxırıq"}: ${a} ${op === "+" ? "+" : "−"} ${c} = ${num}. Məxrəc dəyişmir: ${num}/${b}.`;
}

/** Onluq kəsrlərin toplanması/çıxılması — onda bir/yüzdə bir üzərindən. */
function decSteps(a: string, op: string, b: string): string {
  const dec = (x: string) => (x.split(/[.,]/)[1] ?? "").length;
  const k = Math.max(dec(a), dec(b));
  if (k === 0 || k > 2) return "";
  const m = 10 ** k;
  const ai = Math.round(Number(a.replace(",", ".")) * m);
  const bi = Math.round(Number(b.replace(",", ".")) * m);
  const r = op === "+" ? ai + bi : ai - bi;
  const unit = k === 1 ? "onda bir" : "yüzdə bir";
  const fmt = (v: number) => (v / m).toFixed(k).replace(".", ",");
  return `Hər ikisini ${unit} kimi sayırıq: ${a.replace(".", ",")} = ${ai} ${unit}, ${b.replace(".", ",")} = ${bi} ${unit}. ${ai} ${op === "+" ? "+" : "−"} ${bi} = ${r} ${unit}, yəni ${fmt(r)}.`;
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
  // Eyni məxrəcli kəsrlər: 2/5 + 1/5
  { re: /^(\d+)\/(\d+)\s*([+\-−])\s*(\d+)\/(\d+)\s*=/, fn: (m) => fracSteps(+m[1], +m[2], m[3] === "+" ? "+" : "-", +m[4], +m[5]) },
  // Onluq kəsrlər: 2,5 + 1,3
  { re: /^(\d+[.,]\d+)\s*([+\-−])\s*(\d+[.,]?\d*)\s*=/, fn: (m) => decSteps(m[1], m[2] === "+" ? "+" : "-", m[3]) },
  { re: /^(\d+)\s*([+\-−])\s*(\d+[.,]\d+)\s*=/, fn: (m) => decSteps(m[1], m[2] === "+" ? "+" : "-", m[3]) },
  // Yuvarlaqlaşdırma
  { re: /^([\d\s]+) ədədini onluğa yuvarlaqlaşdır/, fn: (m) => roundSteps(+m[1].replace(/\s/g, ""), 10, "Onluğa") },
  { re: /^([\d\s]+) ədədini yüzlüyə yuvarlaqlaşdır/, fn: (m) => roundSteps(+m[1].replace(/\s/g, ""), 100, "Yüzlüyə") },
  { re: /^([\d\s]+) ədədini minliyə yuvarlaqlaşdır/, fn: (m) => roundSteps(+m[1].replace(/\s/g, ""), 1000, "Minliyə") },
  // Mərtəbələr: "3456 ədədində neçə minlik var?"
  { re: /^(\d+) ədədində neçə (minlik|yüzlük) var\?/, fn: (m) => { const n = +m[1], u = m[2] === "minlik" ? 1000 : 100; const ps = parts(n); return `${n} = ${ps.join(" + ")}. ${m[2][0].toUpperCase() + m[2].slice(1)}lərin sayı ${Math.floor(n / u) % 10 === 0 && n < u ? 0 : Math.floor(n / u)}-dir.`; } },
  // Vahid çevirmələri
  { re: /^(\d+) m neçə sm-dir\?|^(\d+) metr neçə santimetrdir\?/, fn: (m) => { const n = +(m[1] ?? m[2]); return `1 m = 100 sm, deməli ${n} × 100 = ${n * 100} sm.`; } },
  { re: /^(\d+) km neçə metrdir\?/, fn: (m) => `1 km = 1000 m, deməli ${+m[1]} × 1000 = ${+m[1] * 1000} m.` },
  { re: /^(\d+) kq neçə qramdır\?|^(\d+) kiloqram neçə qramdır\?/, fn: (m) => { const n = +(m[1] ?? m[2]); return `1 kq = 1000 q, deməli ${n} × 1000 = ${n * 1000} q.`; } },
  { re: /^(\d+) saat neçə dəqiqədir\?/, fn: (m) => `1 saat = 60 dəqiqə, deməli ${+m[1]} × 60 = ${+m[1] * 60} dəqiqə.` },
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
  // Ümumi ifadə: "2 + 3 × 4 = ?", "(12 ÷ 4 + 2) × 3 = ?" — əməllər sırası ilə
  const expr = p.match(/^([\d\s+\-−×÷*:()]+?)\s*=\s*\?/);
  if (expr) {
    const out = exprSteps(expr[1]);
    if (out) return out;
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
