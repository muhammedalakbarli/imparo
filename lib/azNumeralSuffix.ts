// Rəqəmlə yazılmış ədədə qoşulan şəkilçinin ahəngi (Azərbaycan dili).
//
// "6-dən" səhvdir, "6-dan" düzdür: şəkilçi RƏQƏMƏ yox, ədədin OXUNUŞUNA uyğunlaşır —
// altı → altıdan. Ona görə ədədin sonuncu deyilən sözü tapılır (16 = "on altı" → altı,
// 40 = "qırx", 100 = "yüz", 110 = "yüz on" → on) və həmin sözün son saitinə və son
// səsinə (sait/samit) görə şəkilçi seçilir.
//
// Şablonla yaradılan suallarda ("{n}-dən sonra hansı ədəd gəlir?") bu səhv minlərlə
// tapşırığa yayılırdı. Bu modul həm mövcud məzmunu düzəldir (scripts/fix-numeral-suffixes.ts),
// həm də generatorlar ondan istifadə edir ki, səhv yenidən yaranmasın.

type Harmony = "back-unrounded" | "back-rounded" | "front-unrounded" | "front-rounded";

interface Spoken {
  harmony: Harmony;
  endsWithVowel: boolean;
}

// Oxunuşun son sözü → son saitin növü və sözün sait/samitlə bitməsi.
const WORD: Record<string, Spoken> = {
  sıfır: { harmony: "back-unrounded", endsWithVowel: false },
  bir: { harmony: "front-unrounded", endsWithVowel: false },
  iki: { harmony: "front-unrounded", endsWithVowel: true },
  üç: { harmony: "front-rounded", endsWithVowel: false },
  dörd: { harmony: "front-rounded", endsWithVowel: false },
  beş: { harmony: "front-unrounded", endsWithVowel: false },
  altı: { harmony: "back-unrounded", endsWithVowel: true },
  yeddi: { harmony: "front-unrounded", endsWithVowel: true },
  səkkiz: { harmony: "front-unrounded", endsWithVowel: false },
  doqquz: { harmony: "back-rounded", endsWithVowel: false },
  on: { harmony: "back-rounded", endsWithVowel: false },
  iyirmi: { harmony: "front-unrounded", endsWithVowel: true },
  otuz: { harmony: "back-rounded", endsWithVowel: false },
  qırx: { harmony: "back-unrounded", endsWithVowel: false },
  əlli: { harmony: "front-unrounded", endsWithVowel: true },
  altmış: { harmony: "back-unrounded", endsWithVowel: false },
  yetmiş: { harmony: "front-unrounded", endsWithVowel: false },
  səksən: { harmony: "front-unrounded", endsWithVowel: false },
  doxsan: { harmony: "back-unrounded", endsWithVowel: false },
  yüz: { harmony: "front-rounded", endsWithVowel: false },
  min: { harmony: "front-unrounded", endsWithVowel: false },
  milyon: { harmony: "back-rounded", endsWithVowel: false },
  milyard: { harmony: "back-unrounded", endsWithVowel: false },
};

const UNITS = ["", "bir", "iki", "üç", "dörd", "beş", "altı", "yeddi", "səkkiz", "doqquz"];
const TENS = ["", "on", "iyirmi", "otuz", "qırx", "əlli", "altmış", "yetmiş", "səksən", "doxsan"];

/** Ədədin oxunuşunda SONUNCU söz (yalnız ahəng üçün lazımdır). */
export function lastSpokenWord(n: number): string {
  n = Math.abs(Math.trunc(n));
  if (n === 0) return "sıfır";
  if (n % 10) return UNITS[n % 10];
  if (n % 100) return TENS[Math.floor((n % 100) / 10)];
  if (n % 1000) return "yüz";
  if (n % 1_000_000) return "min";
  if (n % 1_000_000_000) return "milyon";
  return "milyard";
}

function spoken(n: number): Spoken {
  return WORD[lastSpokenWord(n)];
}

// İkivariantlı (a/ə) və dördvariantlı (ı/i/u/ü) sait.
const A = (h: Harmony) => (h.startsWith("back") ? "a" : "ə");
const I = (h: Harmony) =>
  h === "back-unrounded" ? "ı" : h === "back-rounded" ? "u" : h === "front-unrounded" ? "i" : "ü";

export type SuffixKind =
  | "abl" // -dan/-dən (çıxışlıq)
  | "loc" // -da/-də (yerlik)
  | "dat" // -a/-ə, saitdən sonra -ya/-yə (yönlük)
  | "acc" // -ı/-i/-u/-ü, saitdən sonra -nı/-ni/-nu/-nü (təsirlik)
  | "gen" // -ın/-in/-un/-ün, saitdən sonra -nın/... (yiyəlik)
  | "pred" // -dır/-dir/-dur/-dür (xəbərlik)
  | "ord" // -cı/-ci/-cu/-cü (sıra sayı)
  | "lik" // -lıq/-lik/-luq/-lük
  | "pl"; // -lar/-lər

/** n-ə qoşulan düzgün şəkilçi (tiresiz): suffixFor(6, "abl") → "dan". */
export function suffixFor(n: number, kind: SuffixKind): string {
  const { harmony: h, endsWithVowel: v } = spoken(n);
  switch (kind) {
    case "abl":
      return `d${A(h)}n`;
    case "loc":
      return `d${A(h)}`;
    case "dat":
      return v ? `y${A(h)}` : A(h);
    case "acc":
      return v ? `n${I(h)}` : I(h);
    case "gen":
      return v ? `n${I(h)}n` : `${I(h)}n`;
    case "pred":
      return `d${I(h)}r`;
    case "ord":
      return `c${I(h)}`;
    case "lik": {
      const vowel = I(h);
      // Arxa sıra saitlərdən sonra -lıq/-luq (q), ön sıradan sonra -lik/-lük (k).
      return `l${vowel}${h.startsWith("back") ? "q" : "k"}`;
    }
    case "pl":
      return `l${A(h)}r`;
  }
}

/** "6" + abl → "6-dan". Generatorlarda bunu işlət, şəkilçini əl ilə yazma. */
export function withSuffix(n: number, kind: SuffixKind): string {
  return `${n}-${suffixFor(n, kind)}`;
}

// Mətndə tanınan şəkilçilər → növü. Uzunlar əvvəl yoxlanır (regex alternasiyası).
const SUFFIX_KIND: Record<string, SuffixKind> = {};
const add = (kind: SuffixKind, forms: string[]) => forms.forEach((f) => (SUFFIX_KIND[f] = kind));
add("abl", ["dan", "dən"]);
add("loc", ["da", "də"]);
add("dat", ["ya", "yə", "a", "ə"]);
add("acc", ["nı", "ni", "nu", "nü", "ı", "i", "u", "ü"]);
add("gen", ["nın", "nin", "nun", "nün", "ın", "in", "un", "ün"]);
add("pred", ["dır", "dir", "dur", "dür"]);
add("ord", ["cı", "ci", "cu", "cü"]);
add("lik", ["lıq", "lik", "luq", "lük"]);
add("pl", ["lar", "lər"]);

const FORMS = Object.keys(SUFFIX_KIND).sort((a, b) => b.length - a.length);
// (?<![\p{L}\d_./]) — ədəd sözün/id-nin (ry2-a), kəsrin (1/2-yə: "ikidə bir") və ya
// başqa ədədin davamı deyil. Onluq kəsr/saat (2,6-dan; 10:30-da) dəstəklənir:
// tirədən əvvəlki rəqəm qrupu oxunuşun son hissəsidir.
const RE = new RegExp(
  `(?<![\\p{L}\\d_/])((?:\\d+[,:])?\\d+)-(${FORMS.join("|")})(?![\\p{L}])`,
  "gu",
);

/**
 * Mətndəki bütün "rəqəm-şəkilçi" birləşmələrini ahəngə uyğunlaşdırır.
 * Düzgün olanlara toxunmur; tanımadığı şəkilçiyə (məs. "-dək", "-cən") toxunmur.
 */
export function fixNumeralSuffixes(text: string): string {
  return text.replace(RE, (whole, num: string, suf: string) => {
    const group = num.split(/[,:]/).pop()!;
    const n = Number(group);
    if (!Number.isFinite(n)) return whole;
    // "1 000-dən" kimi minlik ayırıcı: son qrup "000" → oxunuş "min".
    const value = n === 0 && group.length >= 3 ? 1000 : n;
    const kind = SUFFIX_KIND[suf];
    const right = suffixFor(value, kind);
    return right === suf ? whole : `${num}-${right}`;
  });
}

/**
 * Sıra ilə sayma izahı — "+"/"−" işarəsiz (1-ci sinfin ilk dərsləri üçün):
 *   after(6)  → "Sayarkən 6-dan sonra 7 gəlir: 5 → 6 → 7."
 *   before(6) → "Sayarkən 5-dən sonra 6 gəlir: 4 → 5 → 6. Deməli 6-dan əvvəl 5 gəlir."
 */
export function sequenceExplanation(dir: "after" | "before", n: number): string {
  const chain = (a: number, b: number) =>
    Array.from({ length: b - a + 1 }, (_, i) => a + i).filter((x) => x >= 0).join(" → ");
  if (dir === "after") {
    return `Sayarkən ${withSuffix(n, "abl")} sonra ${n + 1} gəlir: ${chain(n - 1, n + 1)}.`;
  }
  return `Sayarkən ${withSuffix(n - 1, "abl")} sonra ${n} gəlir: ${chain(n - 2, n)}. Deməli ${withSuffix(n, "abl")} əvvəl ${n - 1} gəlir.`;
}
