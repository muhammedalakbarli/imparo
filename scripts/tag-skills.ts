/**
 * Riyaziyyat tapşırıqlarını bacarıqlarla (lib/skills.ts) etiketləyir.
 *
 * NİYƏ QAYDA ƏSASLI: 1120 tapşırığı əl ilə etiketləmək həm uzundur, həm də
 * ardıcıl olmur (eyni tip sual iki yerdə fərqli etiketlənir). Qaydalar sualın
 * ÖZ MƏTNİNDƏN çıxır, ona görə 5–8-ci siniflərdə də təkrar işlənir.
 *
 * Mətn məsələlərində əməl sualdan görünmür ("neçə qaldı?"). Onu tapşırığın
 * İZAHINDAN oxuyuruq — izahda hesablama həmişə açıq yazılıb ("47 + 38 = 85"),
 * çünki izahlar bu məqsədlə yazılıb. İzahdakı əməl sayı həm də bir/çoxaddımlı
 * məsələni ayırır.
 *
 * İşlətmək:  npx tsx scripts/tag-skills.ts <subject-slug> [--yaz]
 *   --yaz olmadan yalnız hesabat verir (quru işləmə).
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { subjects } from "@/lib/content";
import { getSkill } from "@/lib/skills";
import type { Task } from "@/lib/types";

const P = (t: Task) => t.prompt;
const has = (t: Task, re: RegExp) => re.test(t.prompt);

/** Sualdakı ilk "a <əməl> b" ifadəsi (varsa). */
function expr(p: string): { a: number; op: string; b: number } | null {
  const m = p.match(/^\s*(\d+)\s*([+\-−×÷:*])\s*(\d+)\s*=/);
  return m ? { a: +m[1], op: m[2], b: +m[3] } : null;
}

/** Toplamada mərtəbə keçidi varmı? */
function hasCarry(a: number, b: number): boolean {
  for (let x = a, y = b, carry = 0; x > 0 || y > 0; x = Math.floor(x / 10), y = Math.floor(y / 10)) {
    const s = (x % 10) + (y % 10) + carry;
    if (s >= 10) return true;
    carry = 0;
  }
  return false;
}

/** Çıxmada onluq sındırılırmı? */
function hasBorrow(a: number, b: number): boolean {
  for (let x = a, y = b; y > 0; x = Math.floor(x / 10), y = Math.floor(y / 10)) {
    if (x % 10 < y % 10) return true;
  }
  return false;
}

/** İzahdakı hesablama əməlləri — mətn məsələsinin əməlini tanımaq üçün. */
function opsInExplanation(e: string | undefined): string[] {
  if (!e) return [];
  const out: string[] = [];
  for (const m of e.matchAll(/\d+\s*([+\-−×÷:])\s*\d+\s*=/g)) out.push(m[1]);
  return out;
}

const OP_SKILL: Record<string, (a: number, b: number) => string> = {
  "+": (a, b) => (a < 10 && b < 10 ? "arith.add.basic" : hasCarry(a, b) ? "arith.add.carry" : "arith.add.no_carry"),
  "-": (a, b) => (a <= 20 && b < 10 ? "arith.sub.basic" : hasBorrow(a, b) ? "arith.sub.borrow" : "arith.sub.no_borrow"),
  "×": (a, b) => (a >= 10 && b >= 10 ? "arith.mul.multi_digit" : "arith.mul.tables"),
  ":": (a, b) => (a >= 100 && b >= 10 ? "arith.div.multi_digit" : "arith.div.tables"),
};
const NORM: Record<string, string> = { "−": "-", "*": "×", "÷": ":" };

/**
 * Mətn məsələsində əməli sualın öz sözlərindən tanıyır — izahda hesablama açıq
 * yazılmayanda ("3-dən 2 addım irəli") işə düşür.
 */
const ADD_WORDS = /də aldı|da aldı|əlavə|gəldi|açdı|gətir|əkil|cəmi|birlikdə|da gəldi|artdı|topladı|də açdı|oldu\?/i;
const SUB_WORDS = /uçdu|getdi|verdi|yedi|düşdü|qaldı|satıl|xərclə|sındı|götür|yığdıq|köçürül|soldu|partladı|çıxart|azaldı/i;

/**
 * Dərsin MÖVZUSU anlayışın özüdürsə, etiket qayda nəticəsindən ASILI OLMADAN
 * əlavə olunur. Səbəb: "12 : 3 = ?" ifadə qaydası ilə `div.tables` alır və
 * `div.concept` heç vaxt işə düşmür — nəticədə prereq zəncirinin kökü qrafda
 * ölü düyünə çevrilir (heç bir tapşırıq onu ölçmür).
 */
const LESSON_ALWAYS: Record<string, string> = {
  "ry2-bolme-l1": "arith.div.concept",
  "ry2-vurma-l1": "arith.mul.concept",
};

/**
 * Dərs səviyyəli ehtiyat: qaydalar heç nə tapmayanda tapşırıq heç olmasa dərsin
 * əsas bacarığını daşısın (etiketsiz tapşırıq mastery hesabından tamamilə düşür).
 */
const LESSON_DEFAULT: Record<string, string> = {
  "ry1-sayma-l1": "number.count", "ry1-sayma-l2": "number.compare", "ry1-eded10-mesq": "number.count",
  "ry1-toplama-l1": "arith.add.basic", "ry1-toplama-l2": "arith.add.basic",
  "ry1-cixma-l1": "arith.sub.basic", "ry1-cixma-l2": "arith.sub.basic", "ry1-hesab10-mesq": "arith.add.basic",
  "ry1-onluq-l1": "number.count", "ry1-yirmi-l1": "arith.add.basic", "ry1-yirmi-l2": "arith.sub.basic",
  "ry1-eded20-mesq": "number.count", "ry1-fiqur-l1": "geom.shapes", "ry1-fiqur-l2": "problem.one_step",
  "ry1-fiqur-mesq": "geom.shapes", "ry1-olcme-l1": "measure.compare", "ry1-olcme-l2": "measure.compare",
  "ry1-olcme-l3": "number.compare", "ry1-zaman-l1": "measure.time", "ry1-zaman-l2": "measure.time",
  "ry1-zaman-l3": "measure.money",
  "ry2-yuzluk-l1": "number.place_value", "ry2-yuzluk-l2": "number.compare", "ry2-yuzluk-l3": "number.count",
  "ry2-toplama-l1": "arith.add.no_carry", "ry2-toplama-l2": "arith.add.no_carry", "ry2-toplama-l3": "arith.add.carry",
  "ry2-cixma-l1": "arith.sub.no_borrow", "ry2-cixma-l2": "arith.sub.no_borrow", "ry2-cixma-l3": "arith.sub.borrow",
  "ry2-vurma-l1": "arith.mul.concept", "ry2-vurma-l2": "arith.mul.tables", "ry2-vurma-l3": "arith.mul.tables",
  "ry2-bolme-l1": "arith.div.concept", "ry2-bolme-l2": "arith.div.tables", "ry2-bolme-l3": "arith.div.tables",
  "ry2-olcme-l1": "measure.units", "ry2-olcme-l2": "problem.one_step", "ry2-olcme-l3": "measure.time",
  "ry2-olcme-l4": "measure.money",
  "ry3-min-l1": "number.place_value", "ry3-min-l2": "number.place_value",
  "ry3-toplama-l1": "arith.add.no_carry", "ry3-toplama-l2": "arith.add.carry",
  "ry3-vurma-l1": "arith.mul.tables", "ry3-vurma-l2": "arith.mul.tables",
  "ry3-bolme-l1": "arith.div.tables", "ry3-bolme-l2": "arith.div.remainder",
  "ry3-kesr-l1": "fraction.concept", "ry3-kesr-l2": "fraction.compare",
  "ry3-hendese-l1": "geom.perimeter", "ry3-hendese-l2": "problem.one_step", "ry3-hendese-l3": "geom.area",
  "ry4-boyuk-l1": "number.place_value", "ry4-boyuk-l2": "number.rounding",
  "ry4-vurma-l1": "arith.mul.tables", "ry4-vurma-l2": "arith.mul.multi_digit",
  "ry4-bolme-l1": "arith.div.tables", "ry4-bolme-l2": "arith.div.multi_digit",
  "ry4-kesr-l1": "fraction.concept", "ry4-kesr-l2": "fraction.add_sub_same",
  "ry4-onluq-l1": "decimal.concept", "ry4-onluq-l2": "decimal.add_sub",
  "ry4-sahe-l1": "geom.area", "ry4-sahe-l2": "problem.one_step", "ry4-sahe-l3": "arith.order_of_ops",
};

function skillsFor(t: Task, lessonId: string): string[] {
  const p = P(t);
  const s = new Set<string>();

  // ── Mövzu açar sözləri (ən spesifikdən ümumiyə) ──────────────────────────
  if (has(t, /yuvarlaqlaşdır/i)) s.add("number.rounding");
  if (has(t, /neçə (onluq|yüzlük|minlik|təklik)|onluq \+|minlik \+|rəqəmlə necə yazılır|mərtəbə/i)) s.add("number.place_value");
  if (has(t, /neçə böləni|bölünür/i)) s.add("number.divisors");

  if (has(t, /kəsr|\d\/\d/)) {
    if (has(t, /sadələşdir/i)) s.add("fraction.simplify");
    else if (has(t, /bərabərdir|hansı kəsrə/i)) s.add("fraction.equivalent");
    else if (has(t, /\d\/\d\s*[+\-−]/)) s.add("fraction.add_sub_same");
    else if (has(t, /böyüyü|kiçikdir|böyükdür|müqayisə/i)) s.add("fraction.compare");
    else if (has(t, /-[iıuü]\s|yarısı|üçdə biri|dörddə biri/i)) s.add("fraction.of_quantity");
    else s.add("fraction.concept");
  }
  if (has(t, /\d[.,]\d/)) {
    if (has(t, /[×:÷]/)) s.add("decimal.mul_div");
    else if (has(t, /[+\-−]/)) s.add("decimal.add_sub");
    else if (has(t, /böyüyü|müqayisə|işarə/i)) s.add("decimal.compare");
    else s.add("decimal.concept");
  }

  if (has(t, /perimetr/i)) s.add("geom.perimeter");
  if (has(t, /sahə/i)) s.add("geom.area");
  if (has(t, /həcm|kub|paralelepiped/i)) s.add("geom.volume");
  if (has(t, /kvadrat|üçbucaq|düzbucaqlı|dairə|fiqur|tərəf|künc/i)) s.add("geom.shapes");

  if (has(t, /saat|dəqiqə|həftə|sutka|fəsil|ay var|gün var|əqrəb|zaman/i)) s.add("measure.time");
  if (has(t, /manat|qəpik|pul/i)) s.add("measure.money");
  if (has(t, /neçə santimetr|neçə metr|neçə qram|sm-dir|metrdir|qramdır|kq neçə|km neçə|kiloqram neçə/i)) s.add("measure.convert");
  if (has(t, /uzun|qısa|ağır|yüngül|hündür|alçaq|geniş|tərəzi|xətkeş/i)) s.add("measure.compare");
  if (has(t, /ölçülür|ölçü vahidi|litr/i)) s.add("measure.units");

  if (has(t, /qalıq/i) && has(t, /[÷:]|bölmə/i)) s.add("arith.div.remainder");
  if (has(t, /mötərizə|əməl birinci|əməllər sırası/i)) s.add("arith.order_of_ops");
  // Qarışıq prioritet (× və ya : ilə birlikdə + və ya −) yaxud mötərizə — YALNIZ onda
  // əməllər sırası yoxlanılır. "1 + 1 + 1" bu deyil: orada sıra əhəmiyyətsizdir.
  // Mötərizə YALNIZ içində əməl varsa qruplaşdırmadır. "(kq ilə)" vahid qeydidir.
  if (/\([^)]*[+\-−×÷:][^)]*\)/.test(p) && /=\s*\?/.test(p)) s.add("arith.order_of_ops");
  if (/[×÷:]/.test(p) && /[+\-−]/.test(p) && /=\s*\?/.test(p)) s.add("arith.order_of_ops");
  if (has(t, /\?\s*[+\-−×:]|[+\-−×:]\s*\?|naməlum|yoxlamaq olar|yoxlayırıq/i)) s.add("arith.inverse");

  if (has(t, /növbəti ədəd/i)) s.add("number.sequence");
  if (has(t, /sonra hansı ədəd|əvvəl (gələn|hansı)|qonşusu|neçə hərf|sayarkən/i)) s.add("number.count");
  if (has(t, /böyüyü|kiçiyi|hansı (ədəd |daha )?(böyük|kiçik)|hansı işarə|müqayisədə|ən böyüyü|ən kiçiyi/i) && !has(t, /kəsr|\d\/\d|\d[.,]\d/))
    s.add("number.compare");

  // ── Xalis ifadə: "34 + 25 = ?" ───────────────────────────────────────────
  const e = expr(p);
  if (e) {
    const op = NORM[e.op] ?? e.op;
    const f = OP_SKILL[op];
    if (f) s.add(f(e.a, e.b));
  } else if (/=\s*\?/.test(p) && ![...s].some((x) => /^(number\.place_value|fraction\.|decimal\.|measure\.|geom\.)/.test(x))) {
    // Mövzu etiketi varsa bura düşmür: "1/5 + 2/5" kəsr bacarığıdır, sadə toplama yox;
    // "2 minlik + 3 yüzlük" isə mərtəbə sualıdır.
    // Çoxhədli eyni əməl ("1 + 1 + 1 = ?") — zəncir boyu keçid olub-olmadığına bax.
    const nums = [...p.matchAll(/\d+/g)].map((m) => +m[0]);
    const ops = [...p.matchAll(/[+\-−×÷:]/g)].map((m) => NORM[m[0]] ?? m[0]);
    const uniq = new Set(ops);
    if (nums.length >= 2 && uniq.size === 1 && (uniq.has("+") || uniq.has("-"))) {
      const op = [...uniq][0];
      let acc = nums[0];
      let sk = OP_SKILL[op](nums[0], nums[1]);
      for (let i = 1; i < nums.length; i++) {
        const cur = OP_SKILL[op](acc, nums[i]);
        if (cur.endsWith("carry") || cur.endsWith("borrow")) sk = cur;
        acc = op === "+" ? acc + nums[i] : acc - nums[i];
      }
      s.add(sk);
    } else if (!nums.length && ops.length) {
      // Emoji hesabı: "🍎🍎 + 🍎 = ?" — ədəd yoxdur, əməl var.
      if (uniq.has("+")) s.add("arith.add.basic");
      if (uniq.has("-")) s.add("arith.sub.basic");
    }
  }

  // ── Mətn məsələsi: əməli izahdan oxu ─────────────────────────────────────
  // Mətn məsələsi: ən azı 4 həqiqi söz olmalıdır və ifadə şəklində OLMAMALIDIR.
  // "2 + 3 × 4 = ?" yeddi tokendir, amma məsələ deyil — orada oxuyub-anlama yoxdur.
  // Mötərizədəki ipucu ("(5×3)", "(200÷8)") müəllif qeydidir — məsələnin datası deyil.
  const bare = p.replace(/\([^)]*\)/g, " ");
  const words = (bare.match(/[a-zçəğıöşü]{3,}/gi) ?? []).length;
  const numCount = (bare.match(/\d+/g) ?? []).length;
  // Həqiqi mətn məsələsi: ən azı 6 söz və 2 ədəd. Bu hədd "9999-dan sonra hansı ədəd
  // gəlir?" (1 ədəd) və "Kvadratın tərəfi 4-dür. Sahəsi?" (düstur sualı) kimiləri kənarda saxlayır.
  const wordy =
    !expr(p) && !/=\s*\?/.test(p) && words >= 6 && numCount >= 2 && /\?/.test(p) &&
    !/hansı(dır)?\?|nə (deməkdir|adlanır)/i.test(p);
  if (wordy) {
    const ops = opsInExplanation(t.explanation);
    if (!ops.length) {
      // İzahda hesablama açıq yazılmayıb — əməli sualın sözlərindən tanı.
      s.add("problem.one_step");
      // Əməli sözdən tap, ALT-bacarığı isə sualdakı ədədlərin böyüklüyündən —
      // "1500 − 650" ilə "8 − 3" eyni bacarıq deyil.
      const ns = [...p.matchAll(/\d+/g)].map((m) => +m[0]).sort((x, y) => y - x);
      const op = ADD_WORDS.test(p) ? "+" : SUB_WORDS.test(p) ? "-" : null;
      if (op && ns.length >= 2) s.add(OP_SKILL[op](ns[0], ns[1]));
      else if (op) s.add(op === "+" ? "arith.add.basic" : "arith.sub.basic");
    }
    if (ops.length) {
      // Çoxaddımlılığı SUALDAN tanıyırıq, izahdan yox: izah bəzən BİR əməli
      // hissələrə bölür ("18 × 20, sonra 18 × 4") — bu, iki addım deyil.
      // Həqiqi çoxaddımlı məsələdə ya "sonra" var, ya da üç və daha çox ədəd.
      // Üç və daha çox ədəd = iki mərhələ. ("sonra" sözü etibarsızdır: azərbaycanca
      // həm də ardıcıllıq bildirir — "9999-dan sonra".)
      s.add(numCount >= 3 ? "problem.multi_step" : "problem.one_step");
      // Mövzu bacarığı (ölçmə/həndəsə/kəsr/onluq) varsa, yoxlanan bacarıq ODUR —
      // hesablama yalnız vasitədir. "2 manat neçə qəpikdir?" vurma dərsi deyil.
      // Yalnız vahid çevirmələri, həndəsə düsturları və kəsr/onluq mövzuları bloklanır:
      // orada hesablama vasitədir. Pul və zaman məsələləri isə ƏSLİNDƏ hesab məsələsidir —
      // "1 manat verdin, neçə qəpik qalıq?" çıxma bacarığını yoxlayır.
      const topical = [...s].some((x) => /^(measure\.convert|geom|fraction|decimal)\./.test(x));
      const m = topical ? null : t.explanation!.match(/(\d+)\s*([+\-−×÷:])\s*(\d+)\s*=/);
      if (m) {
        const op = NORM[m[2]] ?? m[2];
        const f = OP_SKILL[op];
        if (f) s.add(f(+m[1], +m[3]));
      }
    }
  }

  const always = LESSON_ALWAYS[lessonId];
  if (always) s.add(always);
  if (!s.size) {
    const d = LESSON_DEFAULT[lessonId];
    if (d) s.add(d);
  }
  return [...s].filter((id) => {
    if (getSkill(id)) return true;
    throw new Error(`qrafda olmayan bacarıq: ${id}`);
  });
}

// ── İşə salma ───────────────────────────────────────────────────────────────
const slug = process.argv[2];
const write = process.argv.includes("--yaz");
const subj = subjects.find((x) => x.slug === slug);
if (!subj) throw new Error(`fənn tapılmadı: ${slug}`);

const map: Record<string, string[]> = {};
const untagged: string[] = [];
let total = 0;
for (const u of subj.units)
  for (const l of u.lessons) {
    if (l.kind === "test") continue;
    for (const t of [...l.tasks, ...(l.bonusTasks ?? [])]) {
      total++;
      const sk = skillsFor(t, l.id);
      if (sk.length) map[t.id] = sk;
      else untagged.push(`${t.id} | ${t.prompt}`);
    }
  }

const only = process.argv.includes("--bacariq") ? process.argv[process.argv.indexOf("--bacariq") + 1] : null;
if (only) {
  const rows = Object.entries(map).filter(([, sk]) => sk.includes(only));
  console.log(`${slug} — "${only}" etiketli ${rows.length} tapşırıq:`);
  const byId = new Map<string, Task>();
  for (const u of subj.units) for (const l of u.lessons) for (const t of [...l.tasks, ...(l.bonusTasks ?? [])]) byId.set(t.id, t);
  for (const [id] of rows) console.log(`  ${id} | ${byId.get(id)?.prompt}`);
  process.exit(0);
}
console.log(`${slug}: ${Object.keys(map).length}/${total} etiketləndi, ${untagged.length} etiketsiz`);
const freq = new Map<string, number>();
for (const sk of Object.values(map)) for (const id of sk) freq.set(id, (freq.get(id) ?? 0) + 1);
console.log("\nbacarıq üzrə tapşırıq sayı:");
for (const [id, n] of [...freq].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${id}  — ${getSkill(id)!.title}`);
if (untagged.length) console.log("\nETİKETSİZ:\n" + untagged.join("\n"));

if (!write) {
  console.log("\n(quru işləmə — yazmaq üçün --yaz əlavə et)");
  process.exit(0);
}

const dir = "lib/content";
const files = readdirSync(dir).filter((f) => f.endsWith(".ts"));
let added = 0;
for (const [id, sk] of Object.entries(map)) {
  for (const f of files) {
    const path = join(dir, f);
    const src = readFileSync(path, "utf8");
    if (!src.includes(`id: "${id}"`)) continue;
    const lines = src.split("\n");
    let hit = false;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].includes(`id: "${id}"`) || lines[i].includes("skills:")) continue;
      const k = lines[i].lastIndexOf(" }");
      if (k < 0) continue;
      lines[i] = `${lines[i].slice(0, k)}, skills: ${JSON.stringify(sk)}${lines[i].slice(k)}`;
      hit = true;
      added++;
      break;
    }
    if (hit) writeFileSync(path, lines.join("\n"));
    break;
  }
}
console.log(`\nyazıldı: ${added}`);
