// IndexNow — məzmun dəyişəndə axtarış sistemlərinə DƏRHAL xəbər verir.
//
// Adi halda gəzicinin (Googlebot/Bingbot) saytı öz qrafiki ilə yenidən gəzməsini
// gözləmək lazımdır — bu, günlər çəkə bilər. IndexNow bunun əksidir: sayt özü
// "bu URL yeniləndi" deyə bildirir. Bing, Yandex, Seznam və Naver protokolu
// dəstəkləyir; api.indexnow.org-a bir dəfə göndərmək hamısına çatır.
// (Google IndexNow-a qoşulmayıb — orada Search Console + sitemap işləyir.)
//
// AÇAR NİYƏ AÇIQDIR
// `public/<açar>.txt` faylı qəsdən hamıya görünəndir və repoda saxlanılır: bu,
// sirr deyil, sahiblik sübutudur. Protokol belə işləyir — göndərilən açar həmin
// ünvandakı fayl ilə üst-üstə düşməlidir, yoxsa sorğu rədd edilir. Ona görə
// faylı SİLMƏ və adını dəyişmə.
//
// NİYƏ DEPLOY-A BAĞLANMAYIB
// IndexNow yalnız DƏYİŞƏN ünvanlar üçün nəzərdə tutulub. Hər deploy-da 39 URL-in
// hamısını göndərmək protokolun ruhuna ziddir və faydasızdır. Üstəlik sitemap-dakı
// `lastmod` build anında hamısı üçün eyni yazılır, yəni ondan "nə dəyişdi" çıxarmaq
// mümkün deyil. Ona görə əmr ƏL İLƏ işlədilir və dəyişən ünvanlar göstərilir.
//
// İSTİFADƏ
//   npm run indexnow -- https://imparo.app/yardim        (bir və ya bir neçə ünvan)
//   npm run indexnow -- --all                            (sitemap-dakı hamısı)
//   npm run indexnow -- --all --dry                      (göndərmədən yoxla)

import { SITE_HOST, SITE_URL } from "../lib/site";

const KEY = "46fb484755a04b32f2bd4d76f0742716";
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

/** Açar faylının həqiqətən yayımda olduğunu yoxla — yoxdursa sorğu onsuz da rədd edilər. */
async function checkKeyFile(): Promise<boolean> {
  try {
    const res = await fetch(KEY_LOCATION, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      console.error(`Açar faylı açılmır: ${KEY_LOCATION} → ${res.status}`);
      return false;
    }
    const body = (await res.text()).trim();
    if (body !== KEY) {
      console.error(`Açar faylının içi uyğun gəlmir.\n  gözlənilən: ${KEY}\n  gələn: ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Açar faylı yoxlanıla bilmədi: ${String(err)}`);
    return false;
  }
}

/** Sitemap-dan bütün ünvanları oxu. */
async function urlsFromSitemap(): Promise<string[]> {
  const res = await fetch(`${SITE_URL}/sitemap.xml`, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`sitemap.xml → ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const all = args.includes("--all");
  const explicit = args.filter((a) => a.startsWith("http"));

  if (!all && explicit.length === 0) {
    console.error(
      "Ünvan göstərilməyib.\n" +
        "  npm run indexnow -- https://imparo.app/yardim\n" +
        "  npm run indexnow -- --all",
    );
    process.exit(1);
  }

  const urls = all ? await urlsFromSitemap() : explicit;

  // Yad domenə aid ünvan göndərilsə bütün sorğu 422 ilə rədd edilir.
  const foreign = urls.filter((u) => new URL(u).host !== SITE_HOST);
  if (foreign.length) {
    console.error(`Bu ünvanlar ${SITE_HOST} domenində deyil:\n  ${foreign.join("\n  ")}`);
    process.exit(1);
  }

  console.log(`${urls.length} ünvan:`);
  for (const u of urls) console.log("  " + u);

  if (dry) {
    console.log("\n--dry — göndərilmədi.");
    return;
  }

  if (!(await checkKeyFile())) {
    console.error("\nAçar faylı hazır deyil — əvvəlcə deploy et, sonra yenidən işlət.");
    process.exit(1);
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: SITE_HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
    signal: AbortSignal.timeout(30_000),
  });

  // 200 = qəbul edildi, 202 = qəbul edildi amma açar hələ yoxlanılır.
  // Digərləri: 400 format, 403 açar uyğun deyil, 422 host/URL uyğunsuzluğu, 429 çox tez-tez.
  const text = await res.text().catch(() => "");
  if (res.status === 200 || res.status === 202) {
    console.log(`\n✓ Qəbul edildi (HTTP ${res.status}).`);
    if (res.status === 202) console.log("  202 — açar yoxlanılır, normaldır.");
  } else {
    console.error(`\n✗ Rədd edildi (HTTP ${res.status}). ${text}`);
    process.exit(1);
  }
}

void main();
