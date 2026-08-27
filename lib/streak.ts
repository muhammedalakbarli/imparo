"use client";

// Seriya (streak) üçün ortaq köməkçilər — həm hover pəncərəsi, həm /streak səhifəsi
// eyni məntiqi işlədir ki, iki yerdə fərqli hesablama olmasın.

/** Həftə günlərinin qısa adları — bazar günündən başlayır (Duolingo sırası). */
export const WEEKDAYS = ["B", "B.e", "Ç.a", "Ç", "C.a", "C", "Ş"];

/** "YYYY-MM-DD" — yerli vaxt üzrə (UTC-yə sürüşmə olmasın). */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Cari həftənin 7 günü (bazardan şənbəyə) + hər gün üçün aktivlik. */
export function thisWeek(activeDays: string[]): { key: string; active: boolean; today: boolean }[] {
  const set = new Set(activeDays);
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  const todayKey = dayKey(now);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const key = dayKey(d);
    return { key, active: set.has(key), today: key === todayKey };
  });
}

/** Bir ayın təqvim şəbəkəsi — əvvəlinə/sonuna qonşu ayların günləri doldurulur. */
export function monthGrid(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay()); // həftənin bazar gününə çək
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: d, inMonth: d.getMonth() === month };
  });
}

export const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

/** Seriya Cəmiyyəti — Duolingo-dakı kimi 30 gündən sonra açılır. */
export const SOCIETY_AT = 30;

/** Növbəti seriya mərhələsi (məqsəd zolağı üçün): 7 → 14 → 30 → 50 → 100 → ... */
export function nextMilestone(days: number): { from: number; to: number } {
  const steps = [7, 14, 30, 50, 100, 150, 200, 250, 300, 365, 500, 730, 1000];
  for (let i = 0; i < steps.length; i++) {
    if (days < steps[i]) return { from: i === 0 ? 0 : steps[i - 1], to: steps[i] };
  }
  const base = Math.floor(days / 500) * 500;
  return { from: base, to: base + 500 };
}
