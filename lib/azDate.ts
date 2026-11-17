// Qısa Azərbaycan tarixi: "25 noy".
// Ay adları ƏLLƏ yazılıb, `toLocaleDateString("az-AZ", { month: "short" })` ilə YOX:
// Chromium-un və Cloudflare Workers-in ICU məlumatında az-AZ ay adları yoxdur, nəticə
// "M11 25" olur (lokal Node-da isə düzgün görünür — səhv yalnız brauzerdə üzə çıxır).
// Bax lib/parentReport.ts — eyni səbəbdən məktub mövzusunda "M08" yazılırdı.

const AY_QISA = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avq", "sen", "okt", "noy", "dek"];

/**
 * "2026-11-25" (yalnız tarix — yerli gün kimi oxunur, UTC sürüşməsi günü dəyişmir)
 * və ya tam ISO vaxt / Date → "25 noy". Etibarsız giriş olduğu kimi qaytarılır.
 */
export function azShortDate(input: string | Date): string {
  let d: Date;
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, day] = input.split("-").map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = input instanceof Date ? input : new Date(input);
  }
  if (isNaN(d.getTime())) return String(input);
  return `${d.getDate()} ${AY_QISA[d.getMonth()]}`;
}
