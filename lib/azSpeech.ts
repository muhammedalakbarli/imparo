// Azərbaycan mətnini səsləndirməyə hazırlayan SAF funksiyalar (React-siz).
// Həm brauzerdə (lib/tts.ts), həm də serverdə (app/api/tts/route.ts) işlədilir —
// ona görə bu faylda React hook-u və ya brauzer API-si OLMAMALIDIR: server marşrutu
// hook import edən modulu çəkəndə Next build-i qırılır ("useSyncExternalStore ...
// only available in Client Components").

const EMOJI_NOUN: Record<string, { nom: string; abl: string }> = {
  "🍎": { nom: "alma", abl: "almadan" },
  "🍏": { nom: "alma", abl: "almadan" },
  "⭐": { nom: "ulduz", abl: "ulduzdan" },
  "🐟": { nom: "balıq", abl: "balıqdan" },
  "🎈": { nom: "şar", abl: "şardan" },
  "🐤": { nom: "cücə", abl: "cücədən" },
  "🌸": { nom: "gül", abl: "güldən" },
};

const UNITS_WORD = ["", "bir", "iki", "üç", "dörd", "beş", "altı", "yeddi", "səkkiz", "doqquz"];
const TENS_WORD = ["", "on", "iyirmi", "otuz", "qırx", "əlli", "altmış", "yetmiş", "səksən", "doxsan"];

/** 0..9999 arası tam ədədi Azərbaycan sözlərinə çevirir (məs: 16 → "on altı", 100 → "yüz"). */
export function numberToAzWords(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n > 9999) return String(n);
  n = Math.trunc(n);
  if (n === 0) return "sıfır";
  const parts: string[] = [];
  const thousands = Math.floor(n / 1000);
  if (thousands > 0) {
    parts.push(thousands === 1 ? "min" : `${UNITS_WORD[thousands]} min`);
  }
  const hundreds = Math.floor((n % 1000) / 100);
  if (hundreds > 0) {
    parts.push(hundreds === 1 ? "yüz" : `${UNITS_WORD[hundreds]} yüz`);
  }
  const tens = Math.floor((n % 100) / 10);
  if (tens > 0) {
    parts.push(TENS_WORD[tens]);
  }
  const units = n % 10;
  if (units > 0) {
    parts.push(UNITS_WORD[units]);
  }
  return parts.join(" ");
}

/**
 * Riyazi simvolları, boş xanaları, şəkilçili ədədləri və emojiləri uşağın eşidəndə
 * rahat başa düşəcəyi təbii Azərbaycan dilinə çevirir.
 *
 * Məsələn:
 * - "3 + 2 = ?" → "3 üstəgəl 2 bərabərdir neçə?"
 * - "6-dan sonra hansı ədəd gəlir?" → "altıdan sonra hansı ədəd gəlir?"
 * - "1, 2, __, 4 — boş xanaya hansı ədəd gəlir?" → "1, 2, boş xana, 4 — boş xanaya hansı ədəd gəlir?"
 * - "8 > 5" → "8 böyükdür 5"
 * - "🍎🍎🍎 — neçə alma var?" → "Şəkildə neçə alma var?" (sayı əvvəlcədən demir!)
 */
export function normalizeAzSpeech(raw: string): string {
  if (!raw) return "";
  let s = raw.trim();

  // 1) "🍎 (alma) çox vaxt..." → "alma çox vaxt..." (emoji + mötərizədəki izah təkrarlanmasın)
  s = s.replace(
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?\s*\(([^)]+)\)/gu,
    "$1",
  );

  // 2) Sayma suallarında: "🍎🍎🍎 — neçə alma var?" və ya "⭐⭐⭐⭐⭐ — İngiliscə neçədir?"
  //    Emojiləri bir-bir oxusa uşağa cavabı deyər və ya qəribə səslənər → "Şəkildə ..."
  s = s.replace(
    /^(?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?\s*)+[—–-]\s*(?=(?:neçə|İngiliscə|ingiliscə))/u,
    "Şəkildə ",
  );

  // 3) Emoji qrupları ilə çıxma: "⭐⭐⭐⭐ -dən 1 götürsək" → "4 ulduzdan 1 götürsək"
  s = s.replace(
    /((?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?)+)\s*-[dD](?:ən|an)\b/gu,
    (match, grp: string) => {
      const chars = Array.from(grp).filter((c) => c.trim() && c !== "\uFE0F");
      const first = chars[0];
      const info = first ? EMOJI_NOUN[first] : undefined;
      if (!info) return `${chars.length} ədəddən`;
      return `${chars.length} ${info.abl}`;
    },
  );

  // 4) Emoji qrupları ilə toplama: "🍎🍎 + 🍎" və ya "🍏🍏🍏 və 🍏🍏"
  s = s.replace(
    /((?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?){1,12})(?=\s*(?:\+|və|[—–-]))/gu,
    (grp: string) => {
      const chars = Array.from(grp).filter((c) => c.trim() && c !== "\uFE0F");
      const first = chars[0];
      const info = first ? EMOJI_NOUN[first] : undefined;
      if (!info) return String(chars.length);
      return `${chars.length} ${info.nom}`;
    },
  );
  s = s.replace(
    /(?<=(?:\+|və)\s*)((?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?){1,12})/gu,
    (grp: string) => {
      const chars = Array.from(grp).filter((c) => c.trim() && c !== "\uFE0F");
      const first = chars[0];
      const info = first ? EMOJI_NOUN[first] : undefined;
      if (!info) return String(chars.length);
      return `${chars.length} ${info.nom}`;
    },
  );

  // 5) Tək fiqur/heyvan emojisi ilə başlayan sual: "🔺 hansı fiqurdur?", "🐱 İngiliscə necədir?"
  s = s.replace(
    /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?\s+(?=(?:hansı|İngiliscə|ingiliscə))/u,
    "Şəkildəki ",
  );

  // Qalan dekorativ emojiləri və ✓ işarəsini təmizlə
  s = s.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]\uFE0F?/gu, " ");
  s = s.replace(/✓/g, "");

  // 6) Sualın sonundakı vizual mötərizə ipuclarını ("(a, a)", "(ki-tab)", "(rəqəmlə)", "(bir söz)")
  //    səsləndirmədən çıxar (riyazi "(3 + 4)" və "(0-dan başqa)" qalsın).
  s = s.replace(
    /\s*\((?:rəqəmlə|bir söz|[a-zəöüığçşA-ZƏÖÜIĞÇŞ]{1,4}(?:\s*[-,]\s*[a-zəöüığçşA-ZƏÖÜIĞÇŞ]{1,4})+)\)\s*([.?!]?)$/u,
    "$1",
  );

  // 6b) Şəkilçili ədədləri ("6-dan", "1-ci", "16-ya", "36-dır") bütöv sözə çevir ki,
  //     TTS tirəni oxumasın və ya şəkilçini ayırmasın.
  s = s.replace(
    /(?<![\p{L}\d_/])(\d{1,4})-(dan|dən|da|də|ya|yə|a|ə|nı|ni|nu|nü|nın|nin|nun|nün|ın|in|un|ün|dır|dir|dur|dür|cı|ci|cu|cü|lıq|lik|luq|lük|lar|lər|ı|i|u|ü)(?![\p{L}])/gu,
    (whole, numStr: string, suf: string) => {
      const n = Number(numStr);
      if (!Number.isFinite(n) || n > 9999) return whole;
      const word = numberToAzWords(n);
      // Sıra saylarında "dörd-cü" → "dördüncü", "bir-ci" → "birinci", "üç-cü" → "üçüncü"
      if (suf === "cı" || suf === "ci" || suf === "cu" || suf === "cü") {
        const v = suf.slice(1);
        const endsVowel = /[aəeıioöuü]$/.test(word);
        return endsVowel ? `${word}n${suf}` : `${word}${v}n${suf}`;
      }
      return `${word}${suf}`;
    },
  );

  // 7) Tənlik və boş xana şablonları
  s = s.replace(/(\d+)\s*\+\s*\?\s*=\s*(\d+)/g, "$1 üstəgəl boş xana bərabərdir $2");
  s = s.replace(/\?\s*[−–-]\s*(\d+)\s*=\s*(\d+)/g, "boş xana çıx $1 bərabərdir $2");
  s = s.replace(/(\d+)\s*[−–-]\s*\?\s*=\s*(\d+)/g, "$1 çıx boş xana bərabərdir $2");
  s = s.replace(/=\s*\?/g, " bərabərdir neçə?");

  // 8) Boşluqlar və ardıcıllıq işarələri
  s = s.replace(/_{2,}/g, " boş xana ");
  s = s.replace(/\.\.\.|…/g, " ");
  s = s.replace(/→/g, ", ");

  // 9) Riyazi əməllər və müqayisə işarələri
  s = s.replace(/\+/g, " üstəgəl ");
  s = s.replace(/−/g, " çıx ");
  s = s.replace(/(?<=\d)\s*-\s*(?=\d)/g, " çıx ");
  s = s.replace(/[×*]/g, " vur ");
  s = s.replace(/(?<=\d)\s*[:÷]\s*(?=\d)/g, " böl ");
  s = s.replace(/=/g, " bərabərdir ");
  s = s.replace(/>/g, " böyükdür ");
  s = s.replace(/</g, " kiçikdir ");

  // 10) Ölçü vahidləri (rəqəmdən sonra gələndə tam oxunsun)
  s = s.replace(/\bsm-dir\b/g, "santimetrdir");
  s = s.replace(/\bsm-dən\b/g, "santimetrdən");
  s = s.replace(/(?<=\d\s*)sm\b/g, "santimetr");
  s = s.replace(/(?<=\d\s*)kq\b/g, "kiloqram");
  s = s.replace(/(?<=\d\s*)q\b/g, "qram");
  s = s.replace(/(?<=\d\s*)m\b/g, "metr");

  // Artıq boşluqları yığışdır
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Google Translate TTS `tl=az` sorğusuna 400 qaytarır (Google-da `az` səs paketi yoxdur),
 * `tl=tr` isə 200 OK (audio/mpeg) qaytarır. Lakin xam Azərbaycan mətnini birbaşa `tl=tr`-ə
 * göndərdikdə Türk TTS-i `ə`, `x`, `q` hərflərini tanımır ("çıx" → "çiks", "qələm" → "ku elem")
 * və ədədləri türkcə ("20" → "yirmi", "80" → "seksen") oxuyur.
 *
 * Bu funksiya:
 * 1) Rəqəmləri Azərbaycan sözlərinə çevirir (7 → yeddi, 8 → səkkiz, 9 → doqquz, 20 → iyirmi, 40 → qırx),
 * 2) Azərbaycan hərflərini (`ə → e`, `x → h`, `qq → kk`, `q → k/g`) fonetik qarşılığına çevirir ki,
 *    `/api/tts?lang=az` həmişə 200 OK qaytarsın və təbii səslənsin.
 */
export function azToTrPhonetic(raw: string): string {
  let s = normalizeAzSpeech(raw);
  // Qalan müstəqil ədədləri (0..9999) Azərbaycan sözləri ilə yaz ki, 20="iyirmi", 8="səkkiz" oxunsun
  s = s.replace(/\b(\d{1,4})\b/g, (m, d: string) => {
    const n = Number(d);
    return Number.isFinite(n) && n <= 9999 ? numberToAzWords(n) : m;
  });
  return s
    .replace(/Ə/g, "E")
    .replace(/ə/g, "e")
    .replace(/X/g, "H")
    .replace(/x/g, "h")
    .replace(/QQ/g, "KK")
    .replace(/Qq/g, "Kk")
    .replace(/qq/g, "kk")
    .replace(/Q(?=[eəiöüEƏİÖÜ])/g, "G")
    .replace(/q(?=[eəiöüEƏİÖÜ])/g, "g")
    .replace(/Q/g, "K")
    .replace(/q/g, "k");
}
