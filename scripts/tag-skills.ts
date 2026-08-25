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

/**
 * BÖLMƏ səviyyəli ehtiyat — 5–8-ci siniflər üçün əsas mexanizm.
 * O siniflərdə bölmələr mövzu baxımından təmizdir ("Kvadrat tənliklər",
 * "Pifaqor teoremi"), ona görə dərs-dərs sadalamaq əvəzinə bölmə kifayətdir.
 * Qaydalar yenə üstündür: bölmə daxilindəki incə fərqləri onlar tutur.
 */
const UNIT_DEFAULT: Record<string, string> = {
  // 5-ci sinif
  "ry-natural": "number.place_value", "ry-fractions": "fraction.concept",
  "ry-decimals": "decimal.concept", "ry-percent": "percent.concept",
  "ry-geometry": "geom.shapes", "ry-data": "data.read",
  "ry-divis": "number.divisors", "ry-coxluq": "sets.basic",
  // 6-cı sinif
  "ry6-bolunme": "number.divisors", "ry6-kesrler": "fraction.mul_div",
  "ry6-onluq": "decimal.mul_div", "ry6-nisbet": "ratio.concept",
  "ry6-faiz": "percent.concept", "ry6-tam": "integer.ops",
  "ry6-rasional": "rational.concept", "ry6-hendese": "geom.angles",
  // 7-ci sinif
  "ry7-rasional": "rational.concept", "ry7-cebri": "algebra.expression",
  "ry7-tenlik": "equation.linear", "ry7-coxhedli": "poly.concept",
  "ry7-duztur": "poly.formulas", "ry7-quvvet": "power.rules",
  "ry7-funksiya": "function.concept", "ry7-hendese": "geom.angles",
  // 8-ci sinif
  "ry8-kok": "root.square", "ry8-kesr": "algebra.fraction",
  "ry8-quvvet": "power.integer", "ry8-kvadrat": "equation.quadratic",
  "ry8-berabersizlik": "inequality.linear", "ry8-funksiya": "function.quadratic",
  "ry8-dordbucaq": "geom.quadrilateral", "ry8-pifaqor": "geom.pythagoras",
};

/**
 * 5–8-ci sinif mövzuları. Bunlar ELEMENTAR qaydalardan ƏVVƏL hesablanır və
 * uyğun elementar etiketi bağlayır: "(2x+4)/(x+2)" cəbri kəsrdir, adi kəsr yox;
 * "x² = 25" kvadrat tənlikdir, sadəcə qüvvət deyil.
 */
function advancedSkills(p: string): Set<string> {
  const a = new Set<string>();
  const has = (re: RegExp) => re.test(p);

  // Ədədlər
  if (has(/ƏBOB|ƏKOB/i)) a.add("number.gcd_lcm");
  if (has(/sadə ədəd|mürəkkəb ədəd/i)) a.add("number.primes");
  if (has(/bölünürmü|bölünürsə|böləni|rəqəmləri cəmi|cütdür|təkdir|bölünmə əlaməti/i)) a.add("number.divisors");
  if (has(/çoxluğ|çoxluq|[∩∪]/i)) a.add("sets.basic");
  if (has(/irrasional|həqiqi ədəd/i)) a.add("number.real");
  if (has(/rasional ədəd/i)) a.add("rational.concept");
  if (has(/mənfi|modul|əks ədəd|müsbət|\|−|\(−/i)) {
    // İki operand arasında əməl varsa — hesablama; yoxsa anlayış sualıdır
    // ("Hansı ədəd mənfidir?"). Anlayış prereq-dir: onu ölçən tapşırıq olmasa,
    // "geriyə addım" ora çata bilmir.
    a.add(/[−\-+×÷:·]\s*\(?\s*−?\d/.test(p) && /\d/.test(p) ? "integer.ops" : "integer.concept");
  }

  // Faiz və nisbət
  if (has(/%|faiz/i)) {
    if (has(/Ədəd neçədir|bütöv/i)) a.add("percent.find_whole");
    else if (has(/-[iıuü]n? \d+%|%-i neçə|endirim|artım/i)) a.add("percent.of");
    else a.add("percent.concept");
  }
  if (has(/tənasüb|\d\s*:\s*\w+\s*=\s*\d|miqyas/i)) a.add("ratio.proportion");
  else if (has(/nisbət/i)) a.add("ratio.concept");

  // Kəsrlər (davamı)
  if (has(/qarışıq ədəd|\d+\s+\d+\/\d+/)) a.add("fraction.mixed");
  if (has(/\d\/\d\s*[·×*:÷]/)) a.add("fraction.mul_div");
  // Fərqli məxrəcli toplama/çıxma ayrıca bacarıqdır: ortaq məxrəc tapmaq lazımdır.
  const fr = p.match(/(\d+)\/(\d+)\s*[+\-−]\s*(\d+)\/(\d+)/);
  if (fr) a.add(fr[2] === fr[4] ? "fraction.add_sub_same" : "fraction.add_sub_diff");
  if (has(/ortaq məxrəc/i)) a.add("fraction.add_sub_diff");

  // Cəbr
  if (has(/cəbri kəsr|\([^)]*[a-z][^)]*\)\s*\/\s*\(|[a-z]\/\d+\s*[+\-−:]/i)) a.add("algebra.fraction");
  if (has(/bərabərsizli|[<>]\s*\d|≥|≤/)) a.add("inequality.linear");
  if (has(/kvadrat tənlik|x²\s*[+\-−].*=\s*0|x²\s*=|diskriminant/i)) a.add("equation.quadratic");
  else if (has(/tənli|kökü nədir|kökü\?|x\s*=\s*\?/i)) a.add("equation.linear");
  if (has(/\(a \+ b\)²|\(a − b\)²|müxtəsər|düsturla|\([^)]+\)²/i)) a.add("poly.formulas");
  if (has(/çoxhədli|tək həd|əmsal|\)\s*\(/i)) a.add("poly.multiply");
  if (has(/ifadəsinin qiyməti|olduqda/i)) a.add("algebra.expression");
  if (has(/bənzər həd|mötərizə(ni)? aç|\d[a-z] [+\-−] \d[a-z]/i)) a.add("algebra.simplify");

  // Qüvvət və kök
  if (has(/√|kvadrat kök/)) a.add("root.square");
  // DİQQƏT: bare "üst" işlətmirik — "üstündə" sözünün içinə düşür.
  // Qüvvət etiketi yalnız sual tənlik/funksiya mövzusu DEYİLSƏ qoyulur: "x² = 25"
  // kvadrat tənlikdir, "y = x²" funksiyadır — hər ikisində x² sadəcə vasitədir.
  const powerContext = !a.has("equation.quadratic") && !a.has("function.quadratic") && !a.has("poly.formulas");
  if (has(/standart şəkil|·\s*10[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/)) a.add("power.standard");
  else if (has(/[⁻]\d|⁻[¹²³]|mənfi üstlü|\w[⁰]/)) a.add("power.integer");
  else if (powerContext && has(/[²³⁴⁵⁶⁷⁸⁹]|qüvvət|üstlü|dərəcəyə yüksəl/i)) {
    // Sadə hesablama ("2³ = ?") natural üstlü qüvvətdir; xassələr ("x³ · x²",
    // "(x³)³", "x¹⁰ : x¹⁰") ayrıca bacarıqdır və onun üstünə qurulur.
    const plainPower = /^\s*\(?\s*−?\d+\s*\)?[²³⁴⁵⁶⁷⁸⁹]\s*=/.test(p);
    a.add(plainPower ? "power.natural" : "power.rules");
  }

  // Funksiya və koordinat
  if (has(/y\s*=\s*[−-]?\s*x²/)) a.add("function.quadratic");
  else if (has(/y\s*=\s*[−-]?\s*\d*\s*\/\s*x|tərs mütənasib/i)) a.add("function.inverse_prop");
  else if (has(/funksiya|y\s*=\s*/i)) a.add("function.concept");
  if (has(/rüb|koordinat|\bO[xy]\b|\(\s*[−-]?\d+\s*;\s*[−-]?\d+\s*\)|absis|ordinat/)) a.add("coord.plane");

  // Həndəsə (davamı)
  if (has(/pifaqor|katet|hipotenuz/i)) a.add("geom.pythagoras");
  if (has(/paraleloqram|trapesiya|romb|dördbucaq/i)) a.add("geom.quadrilateral");
  if (has(/çevrə|radius|diametr|dairənin uzunluğu/i)) a.add("geom.circle");
  if (has(/qonşu bucaq|qarşılıqlı bucaq|paralel xət|uyğun bucaq/i)) a.add("geom.angle_pairs");
  else if (has(/üçbucaq/i)) a.add(has(/düzbucaqlı üçbucaq|iti bucaq|xassə|tənyanlı|bərabərtərəfli/i) ? "geom.triangle_props" : "geom.triangle");
  // "düzbucaqlı" sözü "bucaq" saxlayır, amma sual düzbucaqlının perimetri/sahəsi
  // ola bilər — bucaq mövzusu deyil.
  else if (!has(/düzbucaqlı/i) && has(/bucaq|dərəcə|°/i)) a.add("geom.angles");

  // Məlumat və ehtimal
  if (has(/ehtimal|zər|hadisə|sikkə/i)) a.add("prob.basic");
  if (has(/orta qiymət|ortalama/i)) a.add("data.average");
  if (has(/diaqram|cədvəl|sütun|qrafik/i)) a.add("data.read");

  return a;
}

// ══════════════════════════════════════════════════════════════════════════════
// DİL FƏNLƏRİ
// Riyaziyyat qaydaları burada İŞLƏMƏMƏLİDİR: "tərəf" həm həndəsədə, həm
// qrammatikada ("qarşı tərəflər" / "müraciət tərəfi") var; "neçə hərf var?"
// sayma bacarığı deyil. Ona görə etiketləmə FƏNN AİLƏSİNƏ görə ayrılır.
// ══════════════════════════════════════════════════════════════════════════════

type Family = "math" | "az" | "en" | "other";

function familyOf(slug: string): Family {
  if (slug.startsWith("riyaziyyat")) return "math";
  if (slug.startsWith("azerbaycan-dili")) return "az";
  if (slug.startsWith("ingilis-dili")) return "en";
  return "other";
}

const UNIT_DEFAULT_LANG: Record<string, string> = {
  // Azərbaycan dili
  "az1-sesler": "az.phon.letters", "az1-sozler": "az.phon.syllable",
  "az1-oxunitq": "az.text.etiquette", "az1-yazi": "az.orth.capital", "az1-nagil": "az.text.genre",
  "az2-elifba": "az.phon.alphabet", "az2-sait": "az.phon.vowels", "az2-isim": "az.pos.noun",
  "az2-sifet": "az.pos.adjective", "az2-feil": "az.pos.verb", "az2-mena": "az.lex.meaning",
  "az3-fonetika": "az.phon.vowels", "az3-qurulus": "az.morph.root", "az3-isim": "az.pos.noun",
  "az3-sifetsay": "az.pos.adjective", "az3-feil": "az.pos.verb_tense", "az3-cumle": "az.syn.sentence_type",
  "az4-isim": "az.pos.noun_case", "az4-evezlik": "az.pos.pronoun", "az4-zerf": "az.pos.adverb",
  "az4-uzvler": "az.syn.main_parts", "az4-soz": "az.morph.derivation", "az4-metn": "az.text.structure",
  "az-grammar": "az.phon.harmony", "az-parts-of-speech": "az.pos.noun",
  "az-writing": "az.orth.spelling", "az-speech": "az.text.etiquette",
  "az6-fonetika": "az.phon.vowels", "az6-leksika": "az.lex.meaning", "az6-terkib": "az.morph.derivation",
  "az6-nitq1": "az.pos.noun", "az6-nitq2": "az.pos.verb", "az6-orfoqrafiya": "az.orth.spelling",
  "az7-feil": "az.pos.verb_tense", "az7-nov": "az.pos.verb_voice", "az7-tesrif": "az.pos.verb_nonfinite",
  "az7-zerf": "az.pos.adverb", "az7-komekci": "az.pos.auxiliary", "az7-modal": "az.pos.modal",
  "az8-birlesme": "az.syn.phrase", "az8-bas": "az.syn.main_parts", "az8-ikinci": "az.syn.secondary_parts",
  "az8-nov": "az.syn.sentence_type", "az8-sade": "az.syn.simple", "az8-hemcins": "az.syn.homogeneous",
  // İngilis dili
  "en1-hello": "en.vocab.basic", "en1-numcolor": "en.vocab.basic", "en1-animals": "en.vocab.basic",
  "en1-famschool": "en.vocab.basic", "en1-body": "en.vocab.basic", "en1-food": "en.vocab.basic",
  "en2-numbers": "en.vocab.topic", "en2-days": "en.vocab.topic", "en2-food": "en.vocab.topic",
  "en2-things": "en.gram.demonstrative", "en2-actions": "en.vocab.topic", "en2-body": "en.vocab.topic",
  "en3-present": "en.gram.present_simple", "en3-havegot": "en.gram.have", "en3-can": "en.gram.can",
  "en3-prep": "en.gram.prepositions", "en3-routine": "en.vocab.topic", "en3-jobs": "en.vocab.topic",
  "en4-continuous": "en.gram.present_cont", "en4-was": "en.gram.past_simple", "en4-past": "en.gram.past_simple",
  "en4-there": "en.gram.there_is", "en4-comp": "en.gram.comparison", "en4-questions": "en.gram.questions",
  "en-u1": "en.gram.present_simple", "en-u2": "en.gram.present_cont", "en-u3": "en.gram.past_simple",
  "en-u4": "en.gram.questions", "en-u5": "en.vocab.topic", "en-u6": "en.gram.there_is",
  "en-u7": "en.gram.comparison", "en-u8": "en.gram.can", "en-nouns": "en.gram.plural", "en-vocab": "en.vocab.topic",
  "en6-pp": "en.gram.present_perfect", "en6-future": "en.gram.future", "en6-quant": "en.gram.quantifiers",
  "en6-adv": "en.gram.adverbs", "en6-comp": "en.gram.comparison", "en6-theme": "en.vocab.topic",
  "en7-past": "en.gram.past_cont", "en7-pastperf": "en.gram.past_perfect", "en7-passive": "en.gram.passive",
  "en7-cond": "en.gram.cond_first", "en7-modal": "en.gram.modals", "en7-reported": "en.gram.reported",
  "en8-ppc": "en.gram.present_perfect_cont", "en8-cond2": "en.gram.cond_second",
  "en8-relative": "en.gram.relative", "en8-usedto": "en.gram.used_to", "en8-reported": "en.gram.reported",
  "en8-theme": "en.vocab.topic",
};

/** Azərbaycan dili — mətn qaydaları (bölmə daxilindəki incə fərqlər üçün). */
function azSkills(t: Task): Set<string> {
  const p = t.prompt;
  const a = new Set<string>();
  const has = (re: RegExp) => re.test(p);

  if (has(/sait/i)) a.add("az.phon.vowels");
  if (has(/samit/i)) a.add("az.phon.consonants");
  if (has(/heca/i)) a.add("az.phon.syllable");
  if (has(/ahəng|qalın.*incə|incə.*qalın/i)) a.add("az.phon.harmony");
  if (has(/vurğu/i)) a.add("az.phon.stress");
  if (has(/əlifba/i)) a.add("az.phon.alphabet");
  if (has(/hərf|səs/i) && !a.size) a.add("az.phon.letters");

  if (has(/sinonim|yaxın mənalı/i)) a.add("az.lex.synonym");
  if (has(/antonim|əksi|əks mənalı/i)) a.add("az.lex.antonym");
  if (has(/omonim|çoxmənalı/i)) a.add("az.lex.homonym");
  if (has(/alınma söz|köhnəlmiş|arxaizm|neologizm/i)) a.add("az.lex.origin");

  if (has(/kök|şəkilçi/i)) a.add("az.morph.root");
  if (has(/düzəltmə|söz yarad/i)) a.add("az.morph.derivation");
  if (has(/mürəkkəb söz/i)) a.add("az.morph.compound");

  if (has(/ismin hal|adlıq|yiyəlik|yönlük|təsirlik|yerlik|çıxışlıq/i)) a.add("az.pos.noun_case");
  if (has(/mənsubiyyət|kəmiyyət kateqoriya|cəm şəkilçi/i)) a.add("az.pos.noun_possess");
  if (has(/əvəzlik/i)) a.add("az.pos.pronoun");
  if (has(/zərf/i)) a.add("az.pos.adverb");
  if (has(/feilin növ|məchul|qayıdış|icbar|qarşılıq/i)) a.add("az.pos.verb_voice");
  if (has(/məsdər|feili sifət|feili bağlama|təsriflənmə/i)) a.add("az.pos.verb_nonfinite");
  if (has(/qoşma|bağlayıcı|ədat/i)) a.add("az.pos.auxiliary");
  if (has(/modal söz|nida/i) && !has(/nida cümlə|nida işarə/i)) a.add("az.pos.modal");
  if (has(/zaman|keçmiş|indiki|gələcək/i) && has(/feil|cavab verir/i)) a.add("az.pos.verb_tense");
  if (has(/\bsay\b|miqdar say|sıra say|neçənci/i)) a.add("az.pos.numeral");
  if (has(/sifət|əlamət bildir/i)) a.add("az.pos.adjective");
  if (has(/isim|əşyanın adı/i)) a.add("az.pos.noun");
  if (has(/feil|hərəkət bildir/i) && !a.has("az.pos.verb_tense")) a.add("az.pos.verb");

  if (has(/söz birləşmə/i)) a.add("az.syn.phrase");
  if (has(/həmcins/i)) a.add("az.syn.homogeneous");
  if (has(/mübtəda|xəbər/i)) a.add("az.syn.main_parts");
  if (has(/tamamlıq|təyin|zərflik|ikinci dərəcəli/i)) a.add("az.syn.secondary_parts");
  if (has(/nəqli|sual cümlə|nida cümlə|əmr cümlə|cümlə növ/i)) a.add("az.syn.sentence_type");
  if (has(/sadə cümlə|cüttərkibli|təktərkibli/i)) a.add("az.syn.simple");
  if (has(/cümlə/i) && !a.size) a.add("az.syn.sentence");

  if (has(/böyük hərflə|xüsusi isim.*yazıl/i)) a.add("az.orth.capital");
  if (has(/vergül|nöqtə|durğu işarə|tire|dırnaq/i)) a.add("az.orth.punctuation");
  if (has(/düzgün yazıl|orfoqrafi/i)) a.add("az.orth.spelling");

  if (has(/nağıl|şeir|tapmaca|atalar sözü|qafiyə|misra|şair/i)) a.add("az.text.genre");
  if (has(/nəzakət|salam|təşəkkür|üzr istə|müraciət ed/i)) a.add("az.text.etiquette");
  if (has(/mətn|abzas|başlıq|giriş|nəticə/i)) a.add("az.text.structure");
  return a;
}

/** İngilis dili — mətn qaydaları. */
function enSkills(t: Task): Set<string> {
  const p = t.prompt;
  const a = new Set<string>();
  const has = (re: RegExp) => re.test(p);

  // Dinləmə və oxu STRUKTUR siqnalıdır — mətndən daha etibarlıdır.
  if (t.type === "listening") a.add("en.listen");
  if (/-read-/.test(t.id)) a.add("en.read");

  if (has(/used to/i)) a.add("en.gram.used_to");
  if (has(/who|which|that\b/i) && has(/relative|budaq|əlaqələndir/i)) a.add("en.gram.relative");
  if (has(/reported|dolayı nitq|said that|asked/i)) a.add("en.gram.reported");
  if (has(/have been|has been|Perfect Continuous/i)) a.add("en.gram.present_perfect_cont");
  else if (has(/have\s+\w+ed|has\s+\w+ed|Present Perfect|ever|never|already|yet|just/i)) a.add("en.gram.present_perfect");
  if (has(/would|Second Conditional/i)) a.add("en.gram.cond_second");
  else if (has(/First Conditional|if .*will/i)) a.add("en.gram.cond_first");
  if (has(/passive|məchul|was .*ed by|is .*ed by/i)) a.add("en.gram.passive");
  if (has(/Past Perfect|had \w+/i)) a.add("en.gram.past_perfect");
  if (has(/Past Continuous|was \w+ing|were \w+ing/i)) a.add("en.gram.past_cont");
  if (has(/must|should|might|have to|modal/i)) a.add("en.gram.modals");
  if (has(/will|going to|gələcək/i)) a.add("en.gram.future");
  if (has(/some|any|much|many|sayıla bil/i)) a.add("en.gram.quantifiers");
  if (has(/comparative|superlative|-er than|the .*est|müqayisə/i)) a.add("en.gram.comparison");
  if (has(/there is|there are|there was|there were/i)) a.add("en.gram.there_is");
  if (has(/have got|has got/i)) a.add("en.gram.have");
  if (has(/\bcan\b|can't|cannot|bacarıq/i)) a.add("en.gram.can");
  if (has(/what|where|when|who|why|how|sual söz/i)) a.add("en.gram.questions");
  if (has(/\bin\b|\bon\b|\bunder\b|next to|behind|between|sözön/i)) a.add("en.gram.prepositions");
  if (has(/cəmi hansı|plural|-s əlavə/i)) a.add("en.gram.plural");
  if (has(/this|that|these|those/i)) a.add("en.gram.demonstrative");
  return a;
}

function skillsFor(t: Task, lessonId: string, unitId: string, family: Family): string[] {
  const p = P(t);
  const s = new Set<string>();

  if (family === "az" || family === "en") {
    const found = family === "az" ? azSkills(t) : enSkills(t);
    // Dinləmə AYRI bacarıqdır və qrammatikanı əvəz etmir: "Present Perfect
    // Continuous" dinləmə sualı hər iki bacarığı yoxlayır. Ona görə onu kənara
    // qoyub qrammatika boş qalıbsa bölmə ehtiyatını işlədirik.
    const listens = found.delete("en.listen");
    for (const id of found) s.add(id);
    if (!s.size) {
      const d = UNIT_DEFAULT_LANG[unitId];
      if (d) s.add(d);
    }
    if (listens) s.add("en.listen");
    return [...s].filter((id) => {
      if (getSkill(id)) return true;
      throw new Error(`qrafda olmayan bacarıq: ${id}`);
    });
  }
  if (family === "other") return [];

  // Əvvəl yuxarı sinif mövzuları: onlar varsa elementar qaydalar bağlanır.
  for (const id of advancedSkills(p)) s.add(id);
  const advFraction = [...s].some((x) => /^(fraction\.(mixed|mul_div|add_sub_diff)|algebra\.fraction)$/.test(x));
  const advGeom = [...s].some((x) => /^geom\.(angles|angle_pairs|triangle|triangle_props|circle|quadrilateral|pythagoras)$/.test(x));
  const advNum = [...s].some((x) => /^(integer\.|rational\.|number\.(primes|gcd_lcm|divisors|real))/.test(x));
  const advAlg = [...s].some((x) => /^(algebra\.|equation\.|poly\.|power\.|function\.|inequality\.|root\.)/.test(x));

  // ── Mövzu açar sözləri (ən spesifikdən ümumiyə) ──────────────────────────
  if (has(t, /yuvarlaqlaşdır/i)) s.add("number.rounding");
  if (has(t, /neçə (onluq|yüzlük|minlik|təklik)|onluq \+|minlik \+|rəqəmlə necə yazılır|mərtəbə/i)) s.add("number.place_value");
  if (has(t, /neçə böləni|bölünür/i)) s.add("number.divisors");

  if (!advFraction && !advAlg && has(t, /kəsr|\d\/\d/)) {
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
  if (!advGeom && has(t, /kvadrat|üçbucaq|düzbucaqlı|dairə|fiqur|tərəf|künc/i)) s.add("geom.shapes");

  if (has(t, /saat|dəqiqə|həftə|sutka|fəsil|ay var|gün var|əqrəb|zaman/i)) s.add("measure.time");
  if (has(t, /manat|qəpik|pul/i)) s.add("measure.money");
  if (has(t, /neçə santimetr|neçə metr|neçə qram|sm-dir|metrdir|qramdır|kq neçə|km neçə|kiloqram neçə/i)) s.add("measure.convert");
  // Həndəsə sualında "hündürlük" ölçü müqayisəsi deyil, düsturun tərəfidir.
  if (!advGeom && !s.has("geom.area") && has(t, /uzun|qısa|ağır|yüngül|hündür|alçaq|geniş|tərəzi|xətkeş/i))
    s.add("measure.compare");
  if (has(t, /ölçülür|ölçü vahidi|litr/i)) s.add("measure.units");

  if (!advNum && has(t, /qalıq/i) && has(t, /[÷:]|bölmə/i)) s.add("arith.div.remainder");
  if (has(t, /mötərizə|əməl birinci|əməllər sırası/i)) s.add("arith.order_of_ops");
  // Qarışıq prioritet (× və ya : ilə birlikdə + və ya −) yaxud mötərizə — YALNIZ onda
  // əməllər sırası yoxlanılır. "1 + 1 + 1" bu deyil: orada sıra əhəmiyyətsizdir.
  // Mötərizə qruplaşdırma sayılsın deyə İÇİNDƏ iki operand olmalıdır: "(2 + 3)".
  // "(−3)" isə sadəcə mənfi ədədin yazılışıdır — 6–7-ci sinifdə belələri yüzlərlədir.
  // Cəbr/tam ədəd mövzusu varsa bu qaydalar ümumiyyətlə işə düşmür.
  if (!advAlg && !advNum) {
    if (/\([^)]*\d[^)]*[+\-−×÷:][^)]*\d[^)]*\)/.test(p) && /=\s*\?/.test(p)) s.add("arith.order_of_ops");
    if (/[×÷:]/.test(p) && /[+\-−]/.test(p) && /=\s*\?/.test(p)) s.add("arith.order_of_ops");
  }
  if (has(t, /\?\s*[+\-−×:]|[+\-−×:]\s*\?|naməlum|yoxlamaq olar|yoxlayırıq/i)) s.add("arith.inverse");

  if (has(t, /növbəti ədəd/i)) s.add("number.sequence");
  if (has(t, /sonra hansı ədəd|əvvəl (gələn|hansı)|qonşusu|neçə hərf|sayarkən/i)) s.add("number.count");
  if (has(t, /böyüyü|kiçiyi|hansı (ədəd |daha )?(böyük|kiçik)|hansı işarə|müqayisədə|ən böyüyü|ən kiçiyi/i) && !has(t, /kəsr|\d\/\d|\d[.,]\d/))
    s.add("number.compare");

  // ── Xalis ifadə: "34 + 25 = ?" ───────────────────────────────────────────
  const e = advAlg ? null : expr(p);
  if (e) {
    const op = NORM[e.op] ?? e.op;
    const f = OP_SKILL[op];
    if (f) s.add(f(e.a, e.b));
  } else if (
    /=\s*\?/.test(p) &&
    !advAlg &&
    !advNum &&
    ![...s].some((x) => /^(number\.place_value|fraction\.|decimal\.|measure\.|geom\.)/.test(x))
  ) {
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
    const d = LESSON_DEFAULT[lessonId] ?? UNIT_DEFAULT[unitId];
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
      const sk = skillsFor(t, l.id, u.id, familyOf(slug));
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
