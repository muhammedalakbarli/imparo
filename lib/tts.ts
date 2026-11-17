// Səsli oxuma (TTS) — Azərbaycan və İngilis dilləri üçün.
// Əsas yol: eyni-mənşəli /api/tts?text=...&lang=az|en (Google Translate TTS + Edge keşi).
// Ehtiyat yol: brauzerin Web Speech API-si (əgər şəbəkə və ya audio alınmasa).
// İbtidai sinif (1–4) şagirdləri mətni sərbəst oxuya bilmədiyi üçün riyazi işarələr
// (+, −, =, >, <, ×, :, __) səsləndirilməzdən əvvəl təbii Azərbaycan dilinə çevrilir.

import { useSyncExternalStore } from "react";
import type { Task } from "@/lib/types";
import { normalizeAzSpeech } from "./azSpeech";

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

export { numberToAzWords, normalizeAzSpeech, azToTrPhonetic } from "./azSpeech";

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
