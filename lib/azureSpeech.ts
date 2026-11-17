// Azure Speech (Neural TTS) — Azərbaycan dili üçün əsl səs (az-AZ-BanuNeural).
// SAF funksiyalar: serverdə (app/api/tts/route.ts) işlədilir, React/brauzer asılılığı YOXDUR.
//
// Açarlar Worker secret-i kimi qoyulur:
//   npx wrangler secret put AZURE_SPEECH_KEY
//   npx wrangler secret put AZURE_SPEECH_REGION   (məs. "westeurope")
// İkisi də varsa /api/tts?lang=az Azure-dan gəlir; yoxdursa və ya Azure xəta verərsə
// köhnə üsula (Google tl=tr + fonetik çevirmə, bax lib/azSpeech.ts) düşür.

export const AZURE_AZ_VOICE = "az-AZ-BanuNeural";
/** MP3 — brauzerlərin hamısı oxuyur, cavab kiçik olur (≈6 KB/san). */
export const AZURE_OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";
/** Oxumağı yenicə öyrənən uşaq üçün bir az yavaş. */
export const AZURE_RATE = "-8%";

export interface AzureConfig {
  key: string;
  region: string;
}

/** Region yalnız hərf/rəqəm ola bilər — URL-ə düşdüyü üçün başqa simvol qəbul edilmir. */
export function parseAzureConfig(key: string | undefined, region: string | undefined): AzureConfig | null {
  const k = key?.trim();
  const r = region?.trim().toLowerCase();
  if (!k || !r || !/^[a-z0-9]{2,32}$/.test(r)) return null;
  return { key: k, region: r };
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function azureSsml(text: string, voice: string = AZURE_AZ_VOICE): string {
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="az-AZ">` +
    `<voice name="${voice}"><prosody rate="${AZURE_RATE}">${escapeXml(text)}</prosody></voice>` +
    `</speak>`
  );
}

export function azureTtsRequest(text: string, cfg: AzureConfig): { url: string; init: RequestInit } {
  return {
    url: `https://${cfg.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    init: {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": cfg.key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": AZURE_OUTPUT_FORMAT,
        "User-Agent": "imparo-tts",
      },
      body: azureSsml(text),
    },
  };
}
