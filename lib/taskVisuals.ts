// İbtidai sinif (1–4) tapşırıqları üçün avtomatik vizual köməkçi.
// Hər tapşırığın mətnindən (prompt) uyğun şəkilli modeli çıxarır ki,
// oxumaqda çətinlik çəkən uşaq sualı şəkildən də başa düşsün.

import type { Task } from "./types";
import { isPrimaryTask, sequenceHint } from "./numberHints";

export type AutoVisual =
  | { kind: "addGroups"; a: number; b: number; c?: number; icon: string }
  | { kind: "subGroups"; total: number; take: number; icon: string }
  | { kind: "mulGroups"; groups: number; perGroup: number; icon: string }
  | { kind: "divGroups"; total: number; divisor: number; icon: string }
  | { kind: "compareNums"; nums: number[] }
  | { kind: "placeValue"; num: number }
  | { kind: "shape"; shape: "triangle" | "square" | "circle" | "rectangle" | "all" }
  | { kind: "clock"; hour: number; minute?: number }
  | { kind: "colorSwatch"; colorHex: string; border?: boolean; label?: string }
  | { kind: "pictureCard"; emojis: string[]; title?: string; badges?: string[] };

const MATH_ICONS = ["🍎", "⭐", "🎈", "🍓", "🌸", "🐟", "🍊", "🦋"];

function pickIcon(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return MATH_ICONS[h % MATH_ICONS.length];
}

// Mətn məsələlərində və Azərbaycan dili suallarında söz → şəkil xəritəsi
const NOUN_EMOJI: [RegExp, string][] = [
  [/alma/i, "🍎"],
  [/armud/i, "🍐"],
  [/nar\b/i, "🍎"],
  [/üzüm/i, "🍇"],
  [/qarpız/i, "🍉"],
  [/banan/i, "🍌"],
  [/portağal/i, "🍊"],
  [/limon/i, "🍋"],
  [/çiyələk/i, "🍓"],
  [/gilas/i, "🍒"],
  [/quş|bülbül|qarğa|sərçə/i, "🐦"],
  [/cücə/i, "🐤"],
  [/ördək/i, "🦆"],
  [/dovşan/i, "🐰"],
  [/pişik/i, "🐱"],
  [/\bit\b|itin|itlər/i, "🐶"],
  [/\bat\b|atın|atlar/i, "🐴"],
  [/inək/i, "🐮"],
  [/qoyun|quzu/i, "🐑"],
  [/balıq/i, "🐟"],
  [/şir|aslan/i, "🦁"],
  [/ayı\b/i, "🐻"],
  [/fil\b/i, "🐘"],
  [/tülkü/i, "🦊"],
  [/ilan/i, "🐍"],
  [/meymun/i, "🐒"],
  [/siçan/i, "🐭"],
  [/qarışqa/i, "🐜"],
  [/kəpənək/i, "🦋"],
  [/arı\b/i, "🐝"],
  [/şar|balon/i, "🎈"],
  [/karandaş|qələm/i, "✏️"],
  [/kitab/i, "📖"],
  [/dəftər/i, "📓"],
  [/məktəb|sinif/i, "🏫"],
  [/çanta/i, "🎒"],
  [/xətkeş/i, "📏"],
  [/tərəzi/i, "⚖️"],
  [/gül|çiçək|lalə|qızılgül/i, "🌸"],
  [/ağac|meşə|bağ/i, "🌳"],
  [/yarpaq|ot\b/i, "🍃"],
  [/konfet|şirniyyat/i, "🍬"],
  [/yumurta/i, "🥚"],
  [/çörək/i, "🍞"],
  [/süd/i, "🥛"],
  [/pendir/i, "🧀"],
  [/su\b|hovuz|dəniz|göl/i, "💧"],
  [/çay/i, "☕"],
  [/maşın|avtomobil|araba/i, "🚗"],
  [/avtobus/i, "🚌"],
  [/qatar/i, "🚂"],
  [/velosiped/i, "🚲"],
  [/təyyarə/i, "✈️"],
  [/gəmi/i, "🚢"],
  [/top\b/i, "⚽"],
  [/ulduz|stiker/i, "⭐"],
  [/daş|kərpic/i, "🪨"],
  [/lələk/i, "🪶"],
  [/ev\b|otaq|dam/i, "🏠"],
  [/pəncərə/i, "🪟"],
  [/qapı/i, "🚪"],
  [/masa|stol|parta/i, "🪑"],
  [/papaq/i, "🎩"],
  [/köynək|paltar|don\b/i, "👕"],
  [/palto/i, "🧥"],
  [/ayaqqabı/i, "👟"],
  [/corab/i, "🧦"],
  [/əlcək/i, "🧤"],
  [/ana\b/i, "👩"],
  [/ata\b/i, "👨"],
  [/baba\b/i, "👴"],
  [/nənə/i, "👵"],
  [/müəllim/i, "👩‍🏫"],
  [/uşaq|şagird|oğlan|qız|dost|bala/i, "🧒"],
  [/günəş/i, "☀️"],
  [/qar\b|qış/i, "❄️"],
  [/yağış|payız/i, "🌧️"],
  [/bahar|yaz\b/i, "🌷"],
  [/yay\b/i, "☀️"],
  [/gecə|yuxu|yat/i, "🌙"],
  [/səhər/i, "🌅"],
  [/əl\b|əllər/i, "✋"],
  [/göz(?!əl|lə)/i, "👀"], // "gözəl", "gözlə(nilir)" — göz deyil
  [/qulaq/i, "👂"],
  [/burun/i, "👃"],
  [/ağız|diş/i, "👄"],
  [/Bakı|şəhər/i, "🏙️"],
  [/qaçır|qaçmaq/i, "🏃"],
  [/oxuyur|oxumaq/i, "📖"],
  [/yazır|yazmaq/i, "✍️"],
  [/oynayır|oynamaq/i, "🤸"],
  [/gülür|sevgi/i, "😊"],
  [/uçur/i, "🕊️"],
];

// JS regex-də `\b` yalnız ASCII hərflərini tanıyır — "ı ə ö ü ç ş ğ" onun üçün hərf
// deyil. Ona görə /ayı\b/ "başlayır"-da, /arı\b/ "bunların"-da, /əl\b/ "əmələ"-də
// tuturdu və suala aidiyyəti olmayan şəkil (🐻, 🐝, ✋) çıxırdı. Azərbaycan dili
// şəkilçili dildir — isim kökü sözün ƏVVƏLİNDƏ olur. Ona görə hər alternativ söz
// başlanğıcına bağlanır və `\b` Unicode hərf sərhədi ilə əvəzlənir.
const NOT_AFTER_LETTER = "(?<![\\p{L}\\p{M}])";
const NOT_BEFORE_LETTER = "(?![\\p{L}\\p{M}])";

/** Regex mənbəyini yalnız ən üst səviyyədəki `|` üzrə bölür (`(?:a|b)` qrupuna toxunmur). */
function splitTopLevel(src: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "\\") {
      cur += ch + (src[i + 1] ?? "");
      i++;
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "|" && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Azərbaycan hərflərini tanıyan, söz əvvəlinə bağlı regex. */
export function azWordRegex(re: RegExp): RegExp {
  const src = splitTopLevel(re.source)
    .map((alt) => NOT_AFTER_LETTER + alt.replace(/^\\b/, "").replace(/\\b/g, NOT_BEFORE_LETTER))
    .join("|");
  return new RegExp(src, "iu");
}

const NOUN_RE: [RegExp, string][] = NOUN_EMOJI.map(([re, e]) => [azWordRegex(re), e]);

function detectNounEmoji(text: string): string | null {
  for (const [re, emoji] of NOUN_RE) {
    if (re.test(text)) return emoji;
  }
  return null;
}

// İngilis dili rəngləri
const COLOR_MAP: Record<string, { hex: string; border?: boolean; label: string }> = {
  red: { hex: "#EF4444", label: "Red · Qırmızı" },
  qırmızı: { hex: "#EF4444", label: "Qırmızı" },
  blue: { hex: "#3B82F6", label: "Blue · Mavi" },
  mavi: { hex: "#3B82F6", label: "Mavi" },
  green: { hex: "#22C55E", label: "Green · Yaşıl" },
  yaşıl: { hex: "#22C55E", label: "Yaşıl" },
  yellow: { hex: "#FACC15", label: "Yellow · Sarı" },
  sarı: { hex: "#FACC15", label: "Sarı" },
  orange: { hex: "#F97316", label: "Orange · Narıncı" },
  narıncı: { hex: "#F97316", label: "Narıncı" },
  pink: { hex: "#EC4899", label: "Pink · Çəhrayı" },
  çəhrayı: { hex: "#EC4899", label: "Çəhrayı" },
  purple: { hex: "#A855F7", label: "Purple · Bənövşəyi" },
  bənövşəyi: { hex: "#A855F7", label: "Bənövşəyi" },
  brown: { hex: "#92400E", label: "Brown · Qəhvəyi" },
  qəhvəyi: { hex: "#92400E", label: "Qəhvəyi" },
  black: { hex: "#1E293B", label: "Black · Qara" },
  qara: { hex: "#1E293B", label: "Qara" },
  white: { hex: "#FFFFFF", border: true, label: "White · Ağ" },
  ağ: { hex: "#FFFFFF", border: true, label: "Ağ" },
};

// İngilis sözləri üçün şəkil xəritəsi
const EN_WORD_EMOJI: [RegExp, string][] = [
  [/\b(?:hello|hi|welcome)\b|salam/i, "👋"],
  [/\bgoodbye|bye|see you\b|sağ ol|əlvida/i, "👋"],
  [/\bgood morning\b|sabahın xeyir/i, "🌅"],
  [/\bgood night\b|gecən xeyrə/i, "🌙"],
  [/\bgood afternoon\b|günortan xeyir/i, "☀️"],
  [/\bthank you\b|təşəkkür/i, "🙏"],
  [/\bplease\b|zəhmət olmasa/i, "✨"],
  [/\bsorry\b|üzr/i, "🙇"],
  [/\byes\b|'bəli'/i, "✅"],
  [/\bno\b|'xeyr'/i, "❌"],
  [/\bname\b|adın/i, "🪪"],
  [/\bhow are you|fine\b|necəsən/i, "😊"],
  [/\bcat|cats\b/i, "🐱"],
  [/\bdog|dogs\b/i, "🐶"],
  [/\bfish\b/i, "🐟"],
  [/\bbird|birds\b/i, "🐦"],
  [/\bcow\b/i, "🐮"],
  [/\bhorse\b/i, "🐴"],
  [/\bsheep\b/i, "🐑"],
  [/\blion\b/i, "🦁"],
  [/\bbear\b/i, "🐻"],
  [/\brabbit\b/i, "🐰"],
  [/\belephant\b/i, "🐘"],
  [/\bmonkey\b/i, "🐒"],
  [/\bmouse\b/i, "🐭"],
  [/\bduck\b/i, "🦆"],
  [/\bfrog\b/i, "🐸"],
  [/\bmother|mum|mom\b/i, "👩"],
  [/\bfather|dad\b/i, "👨"],
  [/\bbrother\b/i, "👦"],
  [/\bsister\b/i, "👧"],
  [/\bbaby\b/i, "👶"],
  [/\bgrandmother|grandma\b/i, "👵"],
  [/\bgrandfather|grandpa\b/i, "👴"],
  [/\bfamily\b|ailə/i, "👨‍👩‍👧‍👦"],
  [/\bfriend\b/i, "🤝"],
  [/\bbook|books\b/i, "📖"],
  [/\bpen\b/i, "🖊️"],
  [/\bpencil\b/i, "✏️"],
  [/\bbag\b/i, "🎒"],
  [/\bdesk|table\b/i, "🪑"],
  [/\bchair\b/i, "🪑"],
  [/\bschool|classroom\b/i, "🏫"],
  [/\bteacher\b/i, "👩‍🏫"],
  [/\bstudent|pupil\b/i, "🧑‍🎓"],
  [/\bruler\b/i, "📏"],
  [/\beraser|rubber\b/i, "🧽"],
  [/\bhead\b|'baş'/i, "🙂"],
  [/\bhand|hands\b|'əl'/i, "✋"],
  [/\bfoot|feet|leg\b|'ayaq'/i, "🦶"],
  [/\beye|eyes\b|'göz'/i, "👀"],
  [/\bear|ears\b|'qulaq'/i, "👂"],
  [/\bnose\b|'burun'/i, "👃"],
  [/\bmouth\b|'ağız'/i, "👄"],
  [/\bhair\b|'saç'/i, "💇"],
  [/\btooth|teeth\b|'diş'/i, "🦷"],
  [/\bhat\b|'papaq'/i, "🎩"],
  [/\bshirt\b|'köynək'/i, "👕"],
  [/\bshoes|shoe\b|'ayaqqabı'/i, "👟"],
  [/\bsocks|sock\b|'corab'/i, "🧦"],
  [/\bcoat|jacket\b|'palto'/i, "🧥"],
  [/\bdress\b|'don/i, "👗"],
  [/\btrousers|pants\b|'şalvar'/i, "👖"],
  [/\bgloves\b|'əlcək'/i, "🧤"],
  [/\bapple|apples\b/i, "🍎"],
  [/\bbanana|bananas\b/i, "🍌"],
  [/\bgrape|grapes\b/i, "🍇"],
  [/\bpear\b/i, "🍐"],
  [/\bwatermelon\b/i, "🍉"],
  [/\bstrawberry\b/i, "🍓"],
  [/\bcherry\b/i, "🍒"],
  [/\blemon\b/i, "🍋"],
  [/\bfruit\b/i, "🧺"],
  [/\bbread\b/i, "🍞"],
  [/\bmilk\b/i, "🥛"],
  [/\bwater\b/i, "💧"],
  [/\begg|eggs\b/i, "🥚"],
  [/\bcheese\b/i, "🧀"],
  [/\btea\b/i, "☕"],
  [/\bjuice\b/i, "🧃"],
  [/\brice\b/i, "🍚"],
  [/\bbreakfast|lunch|dinner\b/i, "🍽️"],
  [/\bcake\b/i, "🎂"],
  [/\bice cream\b/i, "🍦"],
  [/\bsunny|sun\b/i, "☀️"],
  [/\brainy|rain\b/i, "🌧️"],
  [/\bsnowy|snow\b/i, "❄️"],
  [/\bwindy|wind\b/i, "💨"],
  [/\bcloudy|cloud\b/i, "☁️"],
  [/\brun|running\b/i, "🏃"],
  [/\bswim|swimming\b/i, "🏊"],
  [/\bjump|jumping\b/i, "🦘"],
  [/\bfly|flying\b/i, "🕊️"],
  [/\bsing|singing\b/i, "🎤"],
  [/\bdance|dancing\b/i, "💃"],
  [/\bread|reading\b/i, "📖"],
  [/\bwrite|writing\b/i, "✍️"],
  [/\bsleep|sleeping\b/i, "😴"],
  [/\bplay|playing\b/i, "⚽"],
];

const EN_WORD_RE: [RegExp, string][] = EN_WORD_EMOJI.map(([re, e]) => [azWordRegex(re), e]);

const EN_NUM_WORD: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};

const AZ_NUM_WORD: Record<string, number> = {
  bir: 1, iki: 2, üç: 3, dörd: 4, beş: 5,
  altı: 6, yeddi: 7, səkkiz: 8, doqquz: 9, on: 10,
  "on bir": 11, "on iki": 12, "on üç": 13, "on dörd": 14, "on beş": 15,
  "on altı": 16, "on yeddi": 17, "on səkkiz": 18, "on doqquz": 19, iyirmi: 20,
};

function mathTaskVisual(task: Task): AutoVisual | null {
  const p = task.prompt.trim();

  // Əgər sual artıq NumberTrain (sequenceHint) göstərirsə və rəqəm tiplidirsə,
  // ikinci qatar göstərməyə ehtiyac yoxdur.
  if (task.type === "numeric" && sequenceHint(p)) return null;

  // 1) Emoji sayma sualları: "🍎🍎🍎 — neçə alma var?" və ya "⭐⭐⭐⭐ -dən 1 götürsək"
  const subEmoji = p.match(/^((?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?)+)\s*-[dD](?:ən|an)\s*(\d+)\s*götürsək/u);
  if (subEmoji) {
    const chars = Array.from(subEmoji[1]).filter((c) => c.trim() && c !== "\uFE0F");
    return { kind: "subGroups", total: chars.length, take: +subEmoji[2], icon: chars[0] || "🍎" };
  }

  const addEmoji = p.match(/^((?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?)+)\s*(?:\+|və)\s*((?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?)+)/u);
  if (addEmoji) {
    const aChars = Array.from(addEmoji[1]).filter((c) => c.trim() && c !== "\uFE0F");
    const bChars = Array.from(addEmoji[2]).filter((c) => c.trim() && c !== "\uFE0F");
    return { kind: "addGroups", a: aChars.length, b: bChars.length, icon: aChars[0] || "🍎" };
  }

  const countEmoji = p.match(/^((?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?){2,})\s*[—–-]/u);
  if (countEmoji) {
    const chars = Array.from(countEmoji[1]).filter((c) => c.trim() && c !== "\uFE0F");
    return { kind: "pictureCard", emojis: chars };
  }

  // 2) 3 toplananlı ifadə: "2 + 2 + 1 = ?"
  const add3 = p.match(/^(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)\s*=\s*\?/);
  if (add3) {
    return { kind: "addGroups", a: +add3[1], b: +add3[2], c: +add3[3], icon: pickIcon(task.id) };
  }

  // 3) Adi toplama: "3 + 2 = ?"
  const add2 = p.match(/^(\d+)\s*\+\s*(\d+)\s*=\s*\?/);
  if (add2) {
    return { kind: "addGroups", a: +add2[1], b: +add2[2], icon: pickIcon(task.id) };
  }

  // 4) Adi çıxma: "5 − 2 = ?" və ya "20 − 5 − 5 = ?"
  const sub3 = p.match(/^(\d+)\s*[−-]\s*(\d+)\s*[−-]\s*(\d+)\s*=\s*\?/);
  if (sub3) {
    return { kind: "subGroups", total: +sub3[1], take: +sub3[2] + +sub3[3], icon: pickIcon(task.id) };
  }
  const sub2 = p.match(/^(\d+)\s*[−-]\s*(\d+)\s*=\s*\?/);
  if (sub2) {
    return { kind: "subGroups", total: +sub2[1], take: +sub2[2], icon: pickIcon(task.id) };
  }

  // 5) Vurma və bölmə: "3 × 4 = ?", "12 : 3 = ?"
  const mul = p.match(/^(\d+)\s*[×*·]\s*(\d+)\s*=\s*\?/);
  if (mul) {
    return { kind: "mulGroups", groups: +mul[1], perGroup: +mul[2], icon: pickIcon(task.id) };
  }
  const div = p.match(/^(\d+)\s*[:÷]\s*(\d+)\s*=\s*\?/);
  if (div) {
    return { kind: "divGroups", total: +div[1], divisor: +div[2], icon: pickIcon(task.id) };
  }

  // 6) "6-ya nə əlavə etsək 10 alınar?" və ya "3 + ? = 9"
  const missingAdd = p.match(/^(\d+)\s*\+\s*\?\s*=\s*(\d+)/) ?? p.match(/^(\d+)-[yY]?[aə] nə əlavə etsək (\d+)/);
  if (missingAdd && +missingAdd[2] >= +missingAdd[1] && +missingAdd[2] <= 20) {
    return {
      kind: "pictureCard",
      emojis: Array.from({ length: +missingAdd[1] }, () => "🟢"),
      title: `${missingAdd[1]} + ? = ${missingAdd[2]}`,
      badges: [`Hədəf: ${missingAdd[2]}`],
    };
  }

  // 7) Sözlə yazılmış ədəd: "'beş' ədədi rəqəmlə necə yazılır?"
  const wordNum = p.match(/^'([^']+)' ədədi rəqəmlə/);
  if (wordNum) {
    const n = AZ_NUM_WORD[wordNum[1].toLowerCase()];
    if (n && n <= 20) {
      return {
        kind: "pictureCard",
        emojis: Array.from({ length: Math.min(n, 10) }, () => "⭐"),
        title: `«${wordNum[1]}»`,
        badges: n > 10 ? [`1 onluq + ${n - 10} təklik`] : undefined,
      };
    }
  }

  // 8) Onluq və təklik / mərtəbə: "15 ədədində neçə onluq var?"
  const pv = p.match(/^(\d+) ədədi(?:ndə|ni)\b/);
  if (pv) {
    return { kind: "placeValue", num: +pv[1] };
  }

  // 9) Həndəsi fiqurlar
  if (/🔺|[üÜ]çbuca(?:q|ğın)/.test(p) && /[kK]vadrat/.test(p)) {
    return { kind: "shape", shape: "all" };
  }
  if (/🔺|[üÜ]çbuca(?:q|ğın)|Dam \(ev üstü\)/.test(p)) {
    return { kind: "shape", shape: "triangle" };
  }
  if (/⬛|[kK]vadrat/.test(p)) {
    return { kind: "shape", shape: "square" };
  }
  if (/🔵|[dD]airə|[dD]əyirmi|Top hansı fiqura|Günəş hansı fiqura/.test(p)) {
    return { kind: "shape", shape: "circle" };
  }
  if (/[dD]üzbucaqlı|Kitab hansı fiqura|Pəncərə adətən hansı fiqura|perimetr|sahə/i.test(p)) {
    return { kind: "shape", shape: "rectangle" };
  }
  if (/fiqur/.test(p)) {
    return { kind: "shape", shape: "all" };
  }

  // 10) Saat və zaman
  const clockMatch = p.match(/Saat (\d+)-d[ıiuü]r|saat (\d+)-da başladı|Səhər (\d+)-dən/i);
  if (clockMatch) {
    const hr = +(clockMatch[1] ?? clockMatch[2] ?? clockMatch[3]);
    return { kind: "clock", hour: hr };
  }
  if (/əqrəb|saatda neçə dəqiqə|Yarım saat|Gecə yarısı|Saatda neçə/i.test(p)) {
    return { kind: "clock", hour: 3, minute: 0 };
  }
  if (/həftə|Bazar ertəsi|iş günü|istirahət günü/i.test(p)) {
    return {
      kind: "pictureCard",
      emojis: ["📅", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣"],
      title: "1 həftə = 7 gün",
    };
  }
  if (/fəsil|qar yağır|Yaz fəslindən|ildə neçə ay/i.test(p)) {
    return {
      kind: "pictureCard",
      emojis: ["❄️", "🌷", "☀️", "🍂"],
      title: "4 fəsil · 12 ay",
      badges: ["Qış", "Yaz", "Yay", "Payız"],
    };
  }
  if (/yatırıq|məktəbə gedirik|Günün ilk hissəsi|Nahar nə vaxt|gündə neçə saat/i.test(p)) {
    return {
      kind: "pictureCard",
      emojis: ["🌅", "☀️", "🌇", "🌙"],
      badges: ["Səhər", "Günorta", "Axşam", "Gecə"],
    };
  }

  // 11) Pul (manat və qəpik)
  if (/manat|qəpik|pulu|qiyməti/i.test(p)) {
    return {
      kind: "pictureCard",
      emojis: ["🪙", "💵", "🛍️"],
      title: "1 manat = 100 qəpik",
      badges: ["10 qəpik", "50 qəpik", "1 ₼", "5 ₼"],
    };
  }

  // 12) Müqayisə sualları: "3 və 6 ədədlərindən...", "7 və 4 — hansı çoxdur?", "8 ... 5"
  const cmpPair =
    p.match(/^(\d+)\s*(?:sm|kq)?\s*və\s*(\d+)\s*(?:sm|kq)?\s*(?:—|ədədlərindən)/) ??
    p.match(/^(\d+)\s*\.\.\.\s*(\d+)/) ??
    p.match(/'(\d+)\s*(?:böyükdür|kiçikdir|=)\s*(\d+)'/);
  if (cmpPair) {
    const a = +cmpPair[1];
    const b = +cmpPair[2];
    if (a <= 20 && b <= 20) return { kind: "compareNums", nums: [a, b] };
  }
  if (
    task.type === "multiple_choice" &&
    /Hansı (?:ədəd )?(?:daha )?(?:böyükdür|kiçikdir)\?/.test(p)
  ) {
    const nums = task.options.map((o) => Number(o)).filter((n) => Number.isFinite(n) && n >= 0 && n <= 20);
    if (nums.length >= 2) return { kind: "compareNums", nums: nums.slice(0, 4) };
  }

  // 13) Mətn məsələləri: içində 2 ədəd və əşya adı olan suallar
  const nounIcon = detectNounEmoji(p);
  const numsInPrompt = Array.from(p.matchAll(/\b(\d+)\b/g)).map((m) => +m[1]);
  if (nounIcon && numsInPrompt.length >= 2) {
    const [a, b] = numsInPrompt;
    const isSub = /uçdu|partladı|verdi|götürdük|evə getdi|düşdü|çıxartdıq|yığdıq|sındı|yeyildi|yedik|bağışladı|qısa|az\b/i.test(p);
    if (isSub && a >= b && a <= 20) {
      return { kind: "subGroups", total: a, take: b, icon: nounIcon };
    }
    if (!isSub && a <= 15 && b <= 15) {
      return { kind: "addGroups", a, b, icon: nounIcon };
    }
  }
  if (nounIcon) {
    return { kind: "pictureCard", emojis: [nounIcon] };
  }

  // 14) Ölçmə: uzun/qısa, ağır/yüngül
  if (/UZUNDUR|QISADIR|HÜNDÜRDÜR|GENİŞDİR|santimetr|metr|Xətkeş/i.test(p)) {
    return {
      kind: "pictureCard",
      emojis: ["📏", "✏️", "🚂"],
      badges: ["Uzun ↔ Qısa", "1 m = 100 sm"],
    };
  }
  if (/AĞIRDIR|YÜNGÜLDÜR|kiloqram|qram|Tərəzi|Çəki|Maye|Litr/i.test(p)) {
    return {
      kind: "pictureCard",
      emojis: ["⚖️", "🪨", "🪶"],
      badges: ["Ağır ↔ Yüngül", "1 kq = 1000 q"],
    };
  }

  // 15) Konkret şəkil yoxdursa ümumi kart (🔢, 🧮) GÖSTƏRİLMİR — mobil ekranda
  //     cavab variantlarını aşağı itələyir, suala heç nə əlavə etmir.
  return null;
}

function azTaskVisual(task: Task): AutoVisual | null {
  const p = task.prompt.trim();

  // Dırnaq içindəki hədəf sözü tap: "'kitab' sözündə..."
  const quoted = p.match(/'([^']+)'/);
  const word = quoted ? quoted[1] : null;
  const emoji = (word && detectNounEmoji(word)) ?? detectNounEmoji(p);

  // Heca sualları
  if (/heca/i.test(p)) {
    const sylHint = p.match(/\(([a-zəöüığçşA-ZƏÖÜIĞÇŞ-]+)\)/u);
    const parts = sylHint ? sylHint[1].split("-") : word ? [word] : [];
    if (parts.length <= 1 && !emoji) return null;
    return {
      kind: "pictureCard",
      emojis: [emoji ?? "👏"],
      title: word ?? "Heca",
      badges: parts.length > 1 ? parts.map((s) => `[ ${s} ]`) : ["Sait sayı = Heca sayı"],
    };
  }

  // Sait / samit / qalın-incə sualları
  if (/sait|samit|əlifba/i.test(p)) {
    if (!emoji) return null;
    const isVowel = /sait/i.test(p);
    return {
      kind: "pictureCard",
      emojis: [emoji ?? (isVowel ? "🅰️" : "🔤")],
      title: word ? `«${word}»` : isVowel ? "Sait səslər (9)" : "Samit səslər (23)",
      badges: /QALIN|İNCƏ|qalın|incə/.test(p)
        ? ["Qalın: a, ı, o, u", "İncə: e, ə, i, ö, ü"]
        : isVowel
          ? ["a, e, ə, ı, i, o, ö, u, ü"]
          : ["32 hərf = 9 sait + 23 samit"],
    };
  }

  // Hərf / söz yazılışı
  if (/hərf|düzgün sözdür|hansı söz alınır/i.test(p)) {
    // Əgər "Hansı düzgün sözdür?" sualıdırsa, düzgün yazılışı başlığa yazma ki cavabı ələ verməsin;
    // yalnız əşyanın şəklini göstər!
    if (/Hansı düzgün sözdür/.test(p)) {
      const optEmoji = task.type === "multiple_choice" ? detectNounEmoji(task.options.join(" ")) : null;
      if (!optEmoji && !emoji) return null;
      return {
        kind: "pictureCard",
        emojis: [optEmoji ?? emoji ?? "✍️"],
        badges: ["Düzgün yazılışı seç"],
      };
    }
    if (!emoji) return null;
    return {
      kind: "pictureCard",
      emojis: [emoji ?? "🔤"],
      title: word ? `«${word}»` : undefined,
    };
  }

  // Kim? Nə? Nə edir? (İsim / Sifət / Feil)
  if (/kim\?|nə\?|nə edir\?|hərəkət|əşya|canlı|isim|sifət|feil/i.test(p)) {
    if (!emoji) return null;
    return {
      kind: "pictureCard",
      emojis: [emoji ?? "🙋", "📦", "🏃"],
      title: word ? `«${word}»` : undefined,
      badges: ["🧑 Kim?", "📦 Nə?", "🏃 Nə edir?"],
    };
  }

  // Cümlə və durğu işarələri
  if (/cümlə|nöqtə|sual işarəsi|nida|boşluq/i.test(p)) {
    if (!emoji) return null;
    return {
      kind: "pictureCard",
      emojis: [emoji ?? "📝"],
      title: word ? `«${word}»` : "Cümlə qaydası",
      badges: ["Böyük hərf", "Sözlər", ". ? !"],
    };
  }

  // Nağıl, şeir, qafiyə, tapmaca, atalar sözü
  if (/qafiyə|şeir|misra|şair/i.test(p)) {
    if (!emoji) return null;
    return {
      kind: "pictureCard",
      emojis: [emoji ?? "🎵", "📜"],
      title: word ? `«${word}»` : "Şeir və qafiyə",
      badges: ["Həmahəng sətirlər"],
    };
  }
  if (/tapmaca|atalar sözü/i.test(p)) {
    if (!emoji) return null;
    return {
      kind: "pictureCard",
      emojis: [emoji ?? "🧩", "💡"],
      title: word ? `«${word}»` : "Düşün və tap",
    };
  }
  if (/nağıl|Cırtdan|Tülkü/i.test(p)) {
    if (!emoji) return null;
    return {
      kind: "pictureCard",
      emojis: [emoji ?? "🧚", "📖"],
      title: "Nağıl dünyası",
      badges: ["Biri var idi, biri yox idi..."],
    };
  }

  // Konkret əşya şəkli yoxdursa ümumi 📖 kartı GÖSTƏRİLMİR.
  if (!emoji) return null;
  return {
    kind: "pictureCard",
    emojis: [emoji],
    title: word ? `«${word}»` : undefined,
  };
}

function enTaskVisual(task: Task): AutoVisual | null {
  const p = task.prompt.trim();

  // 1) Dinləmə tapşırığıdırsa, cavabı şəkillə ələ verməmək üçün dinləmə kartı göstər
  // Dinləmə tapşırığının öz "Dinlə" düyməsi var; cavabı şəkillə ələ verməmək üçün şəkil yoxdur.
  if (task.type === "listening") return null;

  // 2) Rəng sualları: "'qırmızı' İngiliscə necədir?" və ya "'red' nə rəngdir?"
  const quoted = p.match(/'([^']+)'/)?.[1]?.toLowerCase();
  if (quoted && COLOR_MAP[quoted]) {
    const c = COLOR_MAP[quoted];
    return { kind: "colorSwatch", colorHex: c.hex, border: c.border, label: `«${quoted}»` };
  }

  // 3) Emoji ilə başlayan suallar: "🍎🍎 — İngiliscə neçədir?", "🐱 İngiliscə necədir?"
  const countEmoji = p.match(/^((?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?){2,})\s*[—–-]/u);
  if (countEmoji) {
    const chars = Array.from(countEmoji[1]).filter((c) => c.trim() && c !== "\uFE0F");
    return { kind: "pictureCard", emojis: chars };
  }
  const leadEmoji = p.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?)/u);
  if (leadEmoji) {
    return { kind: "pictureCard", emojis: [leadEmoji[1]] };
  }

  // 4) İngiliscə rəqəm sualları: "'3' İngiliscə necədir?", "'seven' hansı ədəddir?", "one + two = ?"
  const addEn = p.match(/'?([a-z]+)'?\s*\+\s*'?([a-z]+)'?\s*=\s*\?/i);
  if (addEn) {
    const a = EN_NUM_WORD[addEn[1].toLowerCase()];
    const b = EN_NUM_WORD[addEn[2].toLowerCase()];
    if (a && b) return { kind: "addGroups", a, b, icon: "⭐" };
  }
  const digitPrompt = p.match(/^'?(\d+)'?\s*[—–-]?\s*[İi]ngiliscə/);
  if (digitPrompt) {
    const n = +digitPrompt[1];
    if (n >= 1 && n <= 20) {
      return {
        kind: "pictureCard",
        emojis: Array.from({ length: Math.min(n, 10) }, () => "⭐"),
        title: String(n),
      };
    }
  }
  if (quoted && EN_NUM_WORD[quoted]) {
    const n = EN_NUM_WORD[quoted];
    return {
      kind: "pictureCard",
      emojis: Array.from({ length: Math.min(n, 10) }, () => "⭐"),
      title: `«${quoted}»`,
    };
  }

  // 5) İngilis və ya Azərbaycan açar sözünə görə şəkil
  for (const [re, emoji] of EN_WORD_RE) {
    if (re.test(p)) {
      return {
        kind: "pictureCard",
        emojis: [emoji],
        title: quoted ? `«${quoted}»` : undefined,
      };
    }
  }
  // "'X' İngiliscə necədir?" — dırnaqdakı söz Azərbaycancadır, şəkil ondan seçilir.
  // "'X' nə deməkdir?" — dırnaqdakı mətn İngiliscədir: "at 7", "at night" kimi ön
  // qoşmalar Azərbaycanca "at" (🐴) kimi tanınmasın deyə dırnaq hissəsi atılır.
  const azEmoji = detectNounEmoji(/[İi]ngiliscə/.test(p) ? p : p.replace(/'[^']*'/g, " "));
  if (azEmoji) {
    return {
      kind: "pictureCard",
      emojis: [azEmoji],
      title: quoted ? `«${quoted}»` : undefined,
    };
  }

  // Konkret şəkil yoxdursa ümumi 🇬🇧 kartı GÖSTƏRİLMİR.
  return null;
}

/**
 * İbtidai sinif (1–4) tapşırıqları üçün avtomatik vizual model qaytarır.
 * Əgər tapşırığın öz `figure` sahəsi varsa, o üstünlük təşkil edir.
 */
export function getAutoTaskVisual(task: Task): AutoVisual | null {
  if (task.figure) return null;
  if (!isPrimaryTask(task.id)) return null;

  if (task.id.startsWith("ry")) return mathTaskVisual(task);
  if (task.id.startsWith("az")) return azTaskVisual(task);
  if (task.id.startsWith("en")) return enTaskVisual(task);
  return null;
}
