// Səsli oxuma (TTS) — Azərbaycan və İngilis dilləri üçün.
// Əsas yol: eyni-mənşəli /api/tts?text=...&lang=az|en (Google Translate TTS + Edge keşi).
// Ehtiyat yol: brauzerin Web Speech API-si (əgər şəbəkə və ya audio alınmasa).
// İbtidai sinif (1–4) şagirdləri mətni sərbəst oxuya bilmədiyi üçün riyazi işarələr
// (+, −, =, >, <, ×, :, __) səsləndirilməzdən əvvəl təbii Azərbaycan dilinə çevrilir.

import { useSyncExternalStore } from "react";
import type { Task } from "@/lib/types";

export type TtsLang = "en" | "az";

let current: HTMLAudioElement | null = null;
let playSeqId = 0;

// ── Qlobal "danışır" vəziyyəti (mascot lipsync və düymə animasiyası üçün) ──
let speaking = false;
const speakingListeners = new Set<(v: boolean) => void>();

function setSpeaking(v: boolean): void {
  if (speaking === v) return;
  speaking = v;
  speakingListeners.forEach((fn) => fn(v));
}

// React hook — komponent TTS "danışır" vəziyyətini izləsin (Mascot avto-lipsync).
export function useSpeaking(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      speakingListeners.add(onChange);
      return () => {
        speakingListeners.delete(onChange);
      };
    },
    () => speaking,
    () => false,
  );
}

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

function ttsUrl(text: string, lang: TtsLang): string {
  const q = encodeURIComponent(text.slice(0, 200));
  return lang === "en" ? `/api/tts?text=${q}` : `/api/tts?text=${q}&lang=${lang}`;
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined";
}

// ── Önyükləmə keşi ───────────────────────────────────────────────────────────
const ready = new Map<string, HTMLAudioElement>();
const MAX_CACHE = 80;

function cacheKey(text: string, lang: TtsLang): string {
  return `${lang}:${text.trim().slice(0, 200)}`;
}

function getOrCreate(text: string, lang: TtsLang): HTMLAudioElement {
  const clean = text.trim().slice(0, 200);
  const key = cacheKey(clean, lang);
  const hit = ready.get(key);
  if (hit) return hit;

  const audio = new Audio(ttsUrl(clean, lang));
  audio.preload = "auto";
  audio.load();

  if (ready.size >= MAX_CACHE) {
    const oldest = ready.keys().next().value;
    if (oldest !== undefined) ready.delete(oldest);
  }
  ready.set(key, audio);
  return audio;
}

/**
 * Uzun mətni (məsələn dərs qaydası və ya geniş izah) Google TTS-in 200 simvol
 * limitinə uyğun cümlə-cümlə hissələrə bölür.
 */
export function splitSpeechChunks(text: string, maxLen = 185): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let cur = "";

  for (const sent of sentences) {
    if (!sent) continue;
    if (!cur) {
      if (sent.length <= maxLen) {
        cur = sent;
      } else {
        // Çox uzun tək cümləni vergül və ya boşluqdan böl
        const words = sent.split(" ");
        for (const w of words) {
          if ((cur + " " + w).trim().length <= maxLen) {
            cur = (cur + " " + w).trim();
          } else {
            if (cur) chunks.push(cur);
            cur = w.slice(0, maxLen);
          }
        }
      }
    } else if ((cur + " " + sent).length <= maxLen) {
      cur = `${cur} ${sent}`;
    } else {
      chunks.push(cur);
      cur = sent.slice(0, maxLen);
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

/**
 * Tapşırıqda səsləndiriləcək İngilis mətnləri.
 */
export function spokenTextsOf(task: Task): string[] {
  const out: string[] = [];
  if (task.type === "listening") out.push(task.audioText);
  if ((task.type === "listening" || task.type === "multiple_choice") && task.speakOptions) {
    out.push(...task.options);
  }
  return out;
}

/**
 * Verilmiş İngilis mətnlərini ƏVVƏLCƏDƏN yükləyir (səsləndirmir).
 */
export function preloadEnglish(texts: (string | undefined | null)[]): void {
  if (typeof window === "undefined") return;
  for (const t of texts) {
    if (t && t.trim()) {
      try {
        getOrCreate(t, "en");
      } catch {
        /* önyükləmə məcburi deyil */
      }
    }
  }
}

/**
 * Verilmiş Azərbaycan mətnlərini normallaşdırıb ƏVVƏLCƏDƏN yükləyir.
 */
export function preloadAz(texts: (string | undefined | null)[]): void {
  if (typeof window === "undefined") return;
  for (const t of texts) {
    if (!t || !t.trim()) continue;
    const norm = normalizeAzSpeech(t);
    for (const chunk of splitSpeechChunks(norm)) {
      try {
        getOrCreate(chunk, "az");
      } catch {
        /* önyükləmə məcburi deyil */
      }
    }
  }
}

// Web Speech API ehtiyat yolu
function webSpeechFallback(text: string, lang: TtsLang): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const speak = () => {
    const u = new SpeechSynthesisUtterance(text);
    if (lang === "az") {
      const voices = synth.getVoices();
      const azVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith("az")) ??
        voices.find((v) => v.lang.toLowerCase().startsWith("tr"));
      u.lang = azVoice?.lang ?? "az-AZ";
      if (azVoice) u.voice = azVoice;
      u.rate = 0.92;
    } else {
      u.lang = "en-US";
      u.rate = 0.9;
      const voice =
        synth.getVoices().find((v) => v.lang === "en-US") ??
        synth.getVoices().find((v) => v.lang.startsWith("en"));
      if (voice) u.voice = voice;
    }
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
  };
  if (synth.getVoices().length === 0) {
    synth.addEventListener("voiceschanged", speak, { once: true });
    setTimeout(speak, 250);
  } else {
    speak();
  }
}

/** Aktiv səsləndirməni dayandırır. */
export function stopSpeaking(): void {
  playSeqId++;
  if (current) {
    current.pause();
    current = null;
  }
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* yoxdursa keç */
  }
  setSpeaking(false);
}

/** Mətni seçilmiş dildə (az və ya en) səsləndirir. */
export function speakText(rawText: string, lang: TtsLang = "az"): void {
  if (typeof window === "undefined" || !rawText.trim()) return;
  const text = lang === "az" ? normalizeAzSpeech(rawText) : rawText.trim();
  if (!text) return;

  stopSpeaking();
  const seq = ++playSeqId;
  const chunks = splitSpeechChunks(text);
  if (chunks.length === 0) return;

  const playChunk = (idx: number) => {
    if (seq !== playSeqId || idx >= chunks.length) {
      if (seq === playSeqId) setSpeaking(false);
      return;
    }
    const chunk = chunks[idx];
    try {
      const audio = getOrCreate(chunk, lang);
      audio.currentTime = 0;
      current = audio;
      audio.onplaying = () => {
        if (seq === playSeqId) setSpeaking(true);
      };
      audio.onended = () => {
        if (seq !== playSeqId) return;
        if (idx + 1 < chunks.length) {
          playChunk(idx + 1);
        } else {
          setSpeaking(false);
        }
      };
      audio.onpause = () => {
        if (seq === playSeqId && idx + 1 >= chunks.length && audio.ended) {
          setSpeaking(false);
        }
      };
      audio.play().catch(() => {
        if (seq !== playSeqId) return;
        setSpeaking(false);
        webSpeechFallback(text, lang);
      });
    } catch {
      webSpeechFallback(text, lang);
    }
  };

  playChunk(0);
}

/** Verilmiş Azərbaycan mətnini (riyazi simvolları çevirərək) səsləndirir. */
export function speakAz(text: string): void {
  speakText(text, "az");
}

/** Verilmiş İngilis mətnini səsləndirir. */
export function speakEnglish(text: string): void {
  speakText(text, "en");
}
