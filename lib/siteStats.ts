// Saytda göstərilən rəqəmlər — TƏK MƏNBƏ.
//
// Niyə: ana səhifə "0 fənn" (sayğac brauzerdə DB-dən dolurdu, serverin HTML-ində 0),
// giriş səhifəsi "3 fənn, 60+ dərs" (əl ilə yazılmış, aylarla köhnəlmiş),
// Haqqımızda isə "7 fənn, 650+ dərs" göstərirdi. Valideyn və investor üçün bu,
// "əslində neçədir?" sualı yaradırdı. İndi bütün səhifələr rəqəmi buradan alır,
// bura isə avtomatik yaradılan `subjectMeta`-dan (npx tsx scripts/gen-subject-meta.ts).
//
// Statik fayldır: serverin HTML-ində də düzgün rəqəm görünür (Google üçün vacibdir).

import { subjectMeta } from "./subjectMeta";

/** Kurikulum fənləri — qalanları əlavə (məktəbdənkənar) fənlərdir. */
export const CORE_SUBJECTS = ["Riyaziyyat", "Azərbaycan dili", "İngilis dili"] as const;

/**
 * Vitrin rəqəmi yuvarlaq və DÜRÜST olmalıdır: real say həmişə göstərilən
 * rəqəmdən çoxdur. Addım böyüklüyə uyğunlaşır: 666 → 650, 12 036 → 10 000.
 */
export function niceFloor(n: number): number {
  if (n < 10) return n;
  const step = Math.pow(10, Math.floor(Math.log10(n))) / 2;
  return Math.floor(n / step) * step;
}

// Fənn ADINA görə təkrarsız: bazada hər sinif ayrıca sətirdir.
export const SUBJECT_COUNT = new Set(subjectMeta.map((s) => s.name)).size;
export const EXTRA_SUBJECT_COUNT = SUBJECT_COUNT - CORE_SUBJECTS.length;

const grades = subjectMeta.map((s) => s.grade);
export const GRADE_RANGE = `${Math.min(...grades)}–${Math.max(...grades)}`;

/** Sandıqlar dərs sayılmır (tapşırığı yoxdur) — bax scripts/gen-subject-meta.ts. */
export const LESSON_TOTAL = subjectMeta.reduce((n, s) => n + s.lessons, 0);
export const TASK_TOTAL = subjectMeta.reduce((n, s) => n + s.tasks, 0);

export const LESSONS_SHOWN = niceFloor(LESSON_TOTAL);
export const TASKS_SHOWN = niceFloor(TASK_TOTAL);

/** i18n mətnindəki {subjects} {lessons} {tasks} {extra} {grades} yer tutucularını doldurur. */
export function fillStats(text: string): string {
  return text
    .replaceAll("{subjects}", String(SUBJECT_COUNT))
    .replaceAll("{lessons}", String(LESSONS_SHOWN))
    .replaceAll("{tasks}", String(TASKS_SHOWN))
    .replaceAll("{extra}", String(EXTRA_SUBJECT_COUNT))
    .replaceAll("{grades}", GRADE_RANGE);
}
