// Hüquqi sənədlərin versiyası — TƏK MƏNBƏ.
//
// Niyə lazımdır: İstifadə şərtləri özü söz verir ki, dəyişiklik olanda saytda
// ƏN AZI 7 GÜN bildiriş yerləşdiriləcək və son yenilənmə tarixi göstəriləcək.
// Əvvəl belə bir mexanizm YOX İDİ — tarix i18n-də üç ayrı sətirdə əl ilə
// yazılırdı (ona görə köhnəlirdi), banner isə ümumiyyətlə mövcud deyildi.
// Yəni sənəd öz öhdəliyini pozurdu.
//
// ŞƏRTLƏRİ/MƏXFİLİYİ DƏYİŞƏNDƏ: aşağıdakı LEGAL_UPDATED tarixini bugünə qoy və
// LEGAL_CHANGE_SUMMARY açarındakı mətni (lib/i18n.ts) yenilə. Qalanı avtomatikdir —
// banner 7 gün göstərilir, tarix hər iki sənəddə özü yenilənir.

/** Son hüquqi yeniləmə (ISO, Bakı vaxtı ilə gün). */
export const LEGAL_UPDATED = "2026-08-24";

/** Şərtlərdə vəd edilən bildiriş müddəti. */
export const LEGAL_NOTICE_DAYS = 7;

// Ay adları ƏLLƏ yazılıb: Cloudflare Workers runtime-ında `az-AZ` lokalının ay
// adları yoxdur və ICU "M08" qaytarır (bu tələyə valideyn hesabatında düşmüşdük,
// bax lib/parentReport.ts).
const MONTHS: Record<string, string[]> = {
  az: ["yanvar","fevral","mart","aprel","may","iyun","iyul","avqust","sentyabr","oktyabr","noyabr","dekabr"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  ru: ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],
};

/** "24 avqust 2026" / "August 24, 2026" / "24 августа 2026" */
export function formatLegalDate(lang: string): string {
  const [y, m, d] = LEGAL_UPDATED.split("-").map(Number);
  const months = MONTHS[lang] ?? MONTHS.az;
  const name = months[m - 1];
  if (lang === "en") return `${name} ${d}, ${y}`;
  return `${d} ${name} ${y}`;
}

/**
 * Bildiriş pəncərəsi hələ açıqdırmı? (dəyişiklikdən sonrakı 7 gün)
 * `now` parametri test üçündür.
 */
export function legalNoticeOpen(now: Date = new Date()): boolean {
  const [y, m, d] = LEGAL_UPDATED.split("-").map(Number);
  // Bakı UTC+4 — yerli günün başlanğıcı UTC-də 4 saat əvvəldir.
  const start = Date.UTC(y, m - 1, d) - 4 * 60 * 60 * 1000;
  const end = start + LEGAL_NOTICE_DAYS * 24 * 60 * 60 * 1000;
  return now.getTime() >= start && now.getTime() < end;
}

/** Bağlama seçimi tarixə bağlıdır — yeni dəyişiklikdə banner yenidən çıxır. */
export const LEGAL_DISMISS_KEY = `imparo-legal-notice-${LEGAL_UPDATED}`;
