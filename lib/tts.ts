// İngilis dili tələffüzü — OS səsindən asılı olmayan etibarlı həll.
// Əsas yol: onlayn İngilis TTS audiosu (<audio> elementi, açar tələb etmir, real səs).
// Ehtiyat yol: brauzerin Web Speech API-si (əgər audio çalınmasa).
// Bütün çağırışlar istifadəçi klikindən gəlir, ona görə autoplay siyasəti bloklamır.

import { useSyncExternalStore } from "react";

let current: HTMLAudioElement | null = null;

// ── Qlobal "danışır" vəziyyəti (mascot lipsync üçün) ──
// Audio çalınanda Zefi ağzını sinxron oynadır; bunun üçün sadə pub/sub.
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
    () => speaking, // brauzer snapshot-u
    () => false, // server snapshot-u (SSR)
  );
}

// Eyni-mənşəli TTS proxy (bax app/api/tts/route.ts). Server Google-dan audionu
// gətirir → brauzerdə CORS/referer/reklam-bloklayıcı problemi olmur.
function ttsUrl(text: string): string {
  return `/api/tts?text=${encodeURIComponent(text.slice(0, 200))}`;
}

// Bu cihazda tələffüz mümkündür? (audio elementi hər brauzerdə var)
export function ttsSupported(): boolean {
  return typeof window !== "undefined";
}

// ── Önyükləmə keşi ───────────────────────────────────────────────────────────
// Problem: klikdən sonra audio SIFIRDAN yüklənirdi — Worker Google-a gedib
// qayıdırdı (ölçülmüş: 330–750 ms). Şagird düyməni basırdı, səs yarım saniyə
// sonra gəlirdi və seçimlə səs əlaqəsi itirdi.
//
// Həll: variantlar EKRANA GƏLƏN KİMİ audio arxa planda yüklənir. Klik anında
// element artıq hazırdır → səs dərhal çıxır.
//
// Audio ELEMENTİ keşlənir (yalnız URL yox): `preload="auto"` faylı endirməklə
// yanaşı dekod da edir, yəni play() anında əlavə iş qalmır.
const ready = new Map<string, HTMLAudioElement>();
const MAX_CACHE = 64; // ~8 KB × 64 ≈ 0.5 MB — bir dərs üçün bol-bol bəsdir

function cacheKey(text: string): string {
  return text.trim().slice(0, 200);
}

function getOrCreate(text: string): HTMLAudioElement {
  const key = cacheKey(text);
  const hit = ready.get(key);
  if (hit) return hit;

  const audio = new Audio(ttsUrl(key));
  audio.preload = "auto";
  audio.load();

  // Ən köhnəni at (Map daxil olma sırasını saxlayır).
  if (ready.size >= MAX_CACHE) {
    const oldest = ready.keys().next().value;
    if (oldest !== undefined) ready.delete(oldest);
  }
  ready.set(key, audio);
  return audio;
}

/**
 * Verilmiş İngilis mətnlərini ƏVVƏLCƏDƏN yükləyir (səsləndirmir).
 * Tapşırıq ekrana gələndə çağırılır — bax components/tasks/TaskInput.tsx.
 */
export function preloadEnglish(texts: (string | undefined | null)[]): void {
  if (typeof window === "undefined") return;
  for (const t of texts) {
    if (t && t.trim()) {
      try {
        getOrCreate(t);
      } catch {
        /* yaddaş/quota problemi olsa səssizcə keç — önyükləmə məcburi deyil */
      }
    }
  }
}

// Web Speech API ehtiyat yolu — səslər asinxron yüklənə bilər.
function webSpeechFallback(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const speak = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.9;
    const voice =
      synth.getVoices().find((v) => v.lang === "en-US") ??
      synth.getVoices().find((v) => v.lang.startsWith("en"));
    if (voice) u.voice = voice;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
  };
  // Səslər hələ yüklənməyibsə, hadisəni gözlə.
  if (synth.getVoices().length === 0) {
    synth.addEventListener("voiceschanged", speak, { once: true });
    // Bəzi brauzerlərdə hadisə gəlmir — kiçik gecikmə ilə də cəhd et.
    setTimeout(speak, 250);
  } else {
    speak();
  }
}

// Verilmiş İngilis mətnini səsləndirir. Əvvəlki səsi dayandırır.
export function speakEnglish(text: string): void {
  if (typeof window === "undefined" || !text.trim()) return;

  // Əvvəlki səsi dayandır (üst-üstə düşməsin).
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

  try {
    // Önyüklənmiş element varsa ondan istifadə olunur → şəbəkə gözləməsi YOXDUR.
    // Yoxdursa yaradılır və eyni zamanda keşə düşür (ikinci klik dərhal işləyir).
    const audio = getOrCreate(text);
    audio.currentTime = 0; // eyni sözə təkrar basanda əvvəldən başlasın
    current = audio;
    audio.onplaying = () => setSpeaking(true);
    audio.onended = () => setSpeaking(false);
    audio.onpause = () => setSpeaking(false);
    // Onlayn audio alınmasa (şəbəkə/bloklama) → Web Speech ehtiyatı.
    audio.play().catch(() => {
      setSpeaking(false);
      webSpeechFallback(text);
    });
  } catch {
    webSpeechFallback(text);
  }
}
