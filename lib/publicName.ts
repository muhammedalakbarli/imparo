// Başqalarına göstərilən ad — SQL `public_name()` (migration 0064) ilə EYNİ qayda.
// "Aysel Məmmədova" → "Aysel M."; tək söz olduğu kimi; boş → "İstifadəçi".
// Server onsuz da qısa ad qaytarır; bu, client tərəfində eyni formatı yoxlamaq və
// testləmək üçündür (botların formatı da buna uyğun olmalıdır).
export function publicName(full: string | null | undefined): string {
  const w = (full ?? "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (w.length === 0) return "İstifadəçi";
  if (w.length === 1) return w[0].slice(0, 24);
  return `${w[0].slice(0, 24)} ${w[1].charAt(0).toUpperCase()}.`;
}
