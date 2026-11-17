// GET /api/tts?text=... — İngilis tələffüzü (audio/mpeg).
// Serverdən Google Translate TTS audiosunu gətirir və eyni-mənşəli qaytarır.
// Beləcə brauzerdəki CORS/referer/reklam-bloklayıcı problemləri aradan qalxır.
//
// GECİKMƏ: ölçüldü — Google-a gediş-gəliş 330–750 ms çəkir. Şagird variant
// düyməsinə basanda səs bu qədər gecikirdi. İki qat keş qoyulub:
//   1. Brauzerdə: variantlar ekrana gələn kimi önyüklənir (bax lib/tts.ts).
//   2. Burada: Cloudflare edge keşi — eyni söz (məsələn "have") bütün
//      şagirdlər üçün eynidir, ona görə bir dəfə gətirilib paylaşılır.
// Keşsiz halda `Cache-Control` tək başına kifayət etmirdi: Cloudflare
// sorğu-sətirli /api/* yollarını defolt keşləmir.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { azToTrPhonetic } from "@/lib/tts";

export const runtime = "nodejs";

type TtsLang = "en" | "az" | "tr";

function parseLang(raw: string | null): TtsLang {
  const clean = raw?.trim().toLowerCase();
  if (clean === "az" || clean === "tr") return clean;
  return "en";
}

function ttsUrl(text: string, lang: TtsLang): string {
  // Google Translate TTS `tl=az` üçün 400 qaytarır; Azərbaycan mətni fonetik olaraq
  // uyğunlaşdırılıb (`azToTrPhonetic`) `tl=tr` səsi ilə 200 OK olaraq gətirilir.
  const spoken = lang === "az" ? azToTrPhonetic(text) : text;
  const tl = lang === "az" ? "tr" : lang;
  const q = encodeURIComponent(spoken.slice(0, 200));
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${q}`;
}

// Edge keşi üçün sabit açar. Sorğu-sətri və dil normallaşdırılır ki, "have" və "have "
// eyni girişə düşsün, fərqli dillər isə bir-birini əzməsin.
function cacheKeyFor(text: string, lang: TtsLang): Request {
  const prefix = lang === "en" ? "" : `${lang}-v2/`;
  return new Request(`https://tts.imparo.internal/${prefix}${encodeURIComponent(text)}`);
}

const HEADERS = {
  "Content-Type": "audio/mpeg",
  // Brauzer keşi: eyni mətn təkrar səsləndiriləndə şəbəkəyə çıxmasın.
  "Cache-Control": "public, max-age=604800, immutable",
};

export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams;
  const text = searchParams.get("text")?.trim();
  if (!text) return new Response("text lazımdır", { status: 400 });
  const lang = parseLang(searchParams.get("lang"));

  // `caches.default` Workers qlobalıdır; OpenNext-in Node qatında olmaya bilər,
  // ona görə hər çağırış qorunur — keş yoxdursa sadəcə birbaşa gətirilir.
  let cache: Cache | undefined;
  try {
    cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  } catch {
    /* keş yoxdur — problem deyil */
  }
  const key = cacheKeyFor(text, lang);

  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit) return hit;
    } catch {
      /* keş oxunmadı — aşağıda birbaşa gətirilir */
    }
  }

  try {
    const upstream = await fetch(ttsUrl(text, lang), {
      headers: {
        // Google bəzən brauzer User-Agent tələb edir.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response("tts alınmadı", { status: 502 });
    }

    const buf = await upstream.arrayBuffer();
    const res = new Response(buf, { status: 200, headers: HEADERS });

    if (cache) {
      try {
        const { ctx } = await getCloudflareContext({ async: true });
        // Cavabı gözlətmədən keşə yaz — şagird audionu dərhal alır.
        ctx.waitUntil(cache.put(key, res.clone()));
      } catch {
        /* keşə yazıla bilmədi — cavab yenə də qaytarılır */
      }
    }
    return res;
  } catch {
    return new Response("tts xətası", { status: 502 });
  }
}
