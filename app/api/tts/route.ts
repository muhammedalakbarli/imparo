// GET /api/tts?text=...&lang=en|az — səsli oxuma (audio/mpeg), eyni-mənşəli.
// Serverdən xarici TTS audiosunu gətirir və eyni-mənşəli qaytarır.
// Beləcə brauzerdəki CORS/referer/reklam-bloklayıcı problemləri aradan qalxır.
//
// Provayderlər:
//   en → Google Translate TTS (tl=en).
//   az → Azure Speech (az-AZ-BanuNeural), ƏGƏR AZURE_SPEECH_KEY + AZURE_SPEECH_REGION
//        secret-ləri qoyulubsa. Yoxdursa və ya Azure xəta verərsə → Google tl=tr +
//        fonetik çevirmə (Google-da `az` səsi yoxdur, tl=az → 400). Bax lib/azureSpeech.ts.
//
// GECİKMƏ: ölçüldü — Google-a gediş-gəliş 330–750 ms çəkir. Şagird variant
// düyməsinə basanda səs bu qədər gecikirdi. İki qat keş qoyulub:
//   1. Brauzerdə: variantlar ekrana gələn kimi önyüklənir (bax lib/tts.ts).
//   2. Burada: Cloudflare edge keşi — eyni söz (məsələn "have") bütün
//      şagirdlər üçün eynidir, ona görə bir dəfə gətirilib paylaşılır.
// Keşsiz halda `Cache-Control` tək başına kifayət etmirdi: Cloudflare
// sorğu-sətirli /api/* yollarını defolt keşləmir.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { azToTrPhonetic, normalizeAzSpeech } from "@/lib/azSpeech";
import { azureTtsRequest, parseAzureConfig, type AzureConfig } from "@/lib/azureSpeech";

export const runtime = "nodejs";

type TtsLang = "en" | "az" | "tr";
type Provider = "google" | "azure";

function parseLang(raw: string | null): TtsLang {
  const clean = raw?.trim().toLowerCase();
  if (clean === "az" || clean === "tr") return clean;
  return "en";
}

function googleUrl(text: string, lang: TtsLang): string {
  // Google Translate TTS `tl=az` üçün 400 qaytarır; Azərbaycan mətni fonetik olaraq
  // uyğunlaşdırılıb (`azToTrPhonetic`) `tl=tr` səsi ilə 200 OK olaraq gətirilir.
  const spoken = lang === "az" ? azToTrPhonetic(text) : text;
  const tl = lang === "az" ? "tr" : lang;
  const q = encodeURIComponent(spoken.slice(0, 200));
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${q}`;
}

// Edge keşi üçün sabit açar. Sorğu-sətri, dil və PROVAYDER normallaşdırılır:
// Azure açarı sonradan qoyulanda türk səsli köhnə yazılar Azure açarının altında
// qalmasın deyə provayder açarın bir hissəsidir.
function cacheKeyFor(text: string, lang: TtsLang, provider: Provider): Request {
  const prefix = lang === "en" ? "" : provider === "azure" ? `${lang}-azure-v1/` : `${lang}-v2/`;
  return new Request(`https://tts.imparo.internal/${prefix}${encodeURIComponent(text)}`);
}

function headersFor(lang: TtsLang, provider: Provider): HeadersInit {
  return {
    "Content-Type": "audio/mpeg",
    // Brauzer keşi: eyni mətn təkrar səsləndiriləndə şəbəkəyə çıxmasın.
    // Türk səsli AZ ehtiyat yolu qısa saxlanır — Azure açarı qoyulanda
    // uşaqların cihazında köhnə səs bir gündən çox qalmasın.
    "Cache-Control":
      lang === "az" && provider === "google"
        ? "public, max-age=86400"
        : "public, max-age=604800, immutable",
    "X-TTS-Provider": provider,
  };
}

async function readAzureConfig(): Promise<AzureConfig | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return parseAzureConfig(env.AZURE_SPEECH_KEY, env.AZURE_SPEECH_REGION);
  } catch {
    return null;
  }
}

async function fetchGoogle(text: string, lang: TtsLang): Promise<ArrayBuffer | null> {
  const upstream = await fetch(googleUrl(text, lang), {
    headers: {
      // Google bəzən brauzer User-Agent tələb edir.
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Referer: "https://translate.google.com/",
    },
  });
  if (!upstream.ok || !upstream.body) return null;
  return upstream.arrayBuffer();
}

async function fetchAzure(text: string, cfg: AzureConfig): Promise<ArrayBuffer | null> {
  // Brauzer mətni onsuz da normallaşdırır; birbaşa çağırışlar üçün təkrar edilir
  // (funksiya idempotentdir). Rəqəmləri Azure-un az-AZ səsi özü düzgün oxuyur.
  const { url, init } = azureTtsRequest(normalizeAzSpeech(text).slice(0, 200), cfg);
  const upstream = await fetch(url, init);
  if (!upstream.ok) return null;
  const buf = await upstream.arrayBuffer();
  return buf.byteLength > 0 ? buf : null;
}

function getEdgeCache(): Cache | undefined {
  // `caches.default` Workers qlobalıdır; OpenNext-in Node qatında olmaya bilər,
  // ona görə hər çağırış qorunur — keş yoxdursa sadəcə birbaşa gətirilir.
  try {
    return (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  } catch {
    return undefined;
  }
}

async function cacheMatch(cache: Cache | undefined, key: Request): Promise<Response | undefined> {
  if (!cache) return undefined;
  try {
    return await cache.match(key);
  } catch {
    return undefined; // keş oxunmadı — birbaşa gətirilir
  }
}

export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams;
  const text = searchParams.get("text")?.trim();
  if (!text) return new Response("text lazımdır", { status: 400 });
  const lang = parseLang(searchParams.get("lang"));

  const azure = lang === "az" ? await readAzureConfig() : null;
  let provider: Provider = azure ? "azure" : "google";
  const cache = getEdgeCache();

  const hit = await cacheMatch(cache, cacheKeyFor(text, lang, provider));
  if (hit) return hit;

  try {
    let buf: ArrayBuffer | null = null;
    if (azure) {
      try {
        buf = await fetchAzure(text, azure);
      } catch {
        buf = null;
      }
      if (!buf) {
        // Azure alınmadı (kvota, açar, şəbəkə) — uşaq səssiz qalmasın, ehtiyat yola düş.
        provider = "google";
        const fallbackHit = await cacheMatch(cache, cacheKeyFor(text, lang, provider));
        if (fallbackHit) return fallbackHit;
      }
    }
    if (!buf) buf = await fetchGoogle(text, lang);
    if (!buf) return new Response("tts alınmadı", { status: 502 });

    const res = new Response(buf, { status: 200, headers: headersFor(lang, provider) });

    if (cache) {
      try {
        const { ctx } = await getCloudflareContext({ async: true });
        // Cavabı gözlətmədən keşə yaz — şagird audionu dərhal alır.
        ctx.waitUntil(cache.put(cacheKeyFor(text, lang, provider), res.clone()));
      } catch {
        /* keşə yazıla bilmədi — cavab yenə də qaytarılır */
      }
    }
    return res;
  } catch {
    return new Response("tts xətası", { status: 502 });
  }
}
