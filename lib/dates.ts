// Layihələrin başlama və son tarixləri (deadline).
// Hər layihə 1 həftə sürür və ardıcıl gəlir. Baza — dərs ilinin başlanğıcı: 15 Sentyabr.

const MONTHS_AZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

// İlk layihənin başlama tarixi: cari dərs ilinin 15 Sentyabrı.
// Dərs ili sentyabrda başlayıb yaza qədər davam edir, ona görə:
//  - Sentyabr–Dekabr: bu ilin 15 Sentyabrı
//  - Yanvar–İyun (dərs ili ortası): keçən ilin 15 Sentyabrı
//  - İyul–Avqust (yay tətili, növbəti il üçün hazırlıq): bu ilin 15 Sentyabrı
function academicStart(): Date {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0=Yanvar ... 8=Sentyabr
  let year = y;
  if (m <= 5) year = y - 1; // Yanvar–İyun → keçən sentyabr
  const start = new Date(year, 8, 15); // 15 Sentyabr
  start.setHours(0, 0, 0, 0);
  return start;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function formatAz(d: Date): string {
  return `${d.getDate()} ${MONTHS_AZ[d.getMonth()]}`;
}

// index — layihənin fənn daxilindəki sırası (0-dan).
export function projectDates(index: number): {
  start: Date;
  deadline: Date;
  startLabel: string;
  deadlineLabel: string;
  status: "gələcək" | "aktiv" | "keçmiş";
} {
  const base = academicStart();
  const start = addDays(base, index * 7);
  const deadline = addDays(start, 6);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let status: "gələcək" | "aktiv" | "keçmiş" = "aktiv";
  if (today < start) status = "gələcək";
  else if (today > deadline) status = "keçmiş";

  return {
    start,
    deadline,
    startLabel: formatAz(start),
    deadlineLabel: formatAz(deadline),
    status,
  };
}
