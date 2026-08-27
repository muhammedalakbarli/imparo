// Bütün fənlərin məzmununu birləşdirən mərkəzi fayl.
// "@/lib/content" importları bu index-i istifadə edir (əvvəlki content.ts əvəzi).

import type { Subject, Task } from "../types";
import { balanceSubjects } from "./balance";
import { fillUnitTests } from "./unitTest";
import { math1 } from "./math1";
import { azerbaijani1 } from "./azerbaijani1";
import { english1 } from "./english1";
import { math2 } from "./math2";
import { azerbaijani2 } from "./azerbaijani2";
import { english2 } from "./english2";
import { math3 } from "./math3";
import { azerbaijani3 } from "./azerbaijani3";
import { english3 } from "./english3";
import { math4 } from "./math4";
import { azerbaijani4 } from "./azerbaijani4";
import { english4 } from "./english4";
import { math } from "./math";
import { azerbaijani } from "./azerbaijani";
import { english } from "./english";
import { math6 } from "./math6";
import { azerbaijani6 } from "./azerbaijani6";
import { english6 } from "./english6";
import { math7 } from "./math7";
import { azerbaijani7 } from "./azerbaijani7";
import { english7 } from "./english7";
import { math8 } from "./math8";
import { azerbaijani8 } from "./azerbaijani8";
import { english8 } from "./english8";
import { tehlukesizlik5 } from "./tehlukesizlik5";
import { maliyye5 } from "./maliyye5";

// 5-ci sinif fənləri + 6-cı sinif fənləri. App dashboard-da istifadəçinin
// sinfinə (user_metadata.grade) görə süzür (bax lib/grade.ts).
// Cavab mövqeyi balanslaşdırılır — düzgün cavab artıq həmişə birinci variant deyil
// (deterministik, task.id-ə görə sabit). Bax lib/content/balance.ts.
export const subjects: Subject[] = fillUnitTests(
  balanceSubjects([
  math1, azerbaijani1, english1,
  math2, azerbaijani2, english2,
  math3, azerbaijani3, english3,
  math4, azerbaijani4, english4,
  math, azerbaijani, english, tehlukesizlik5, maliyye5,
  math6, azerbaijani6, english6,
  math7, azerbaijani7, english7,
    math8, azerbaijani8, english8,
  ]),
);

export function getSubject(slug: string): Subject | undefined {
  return subjects.find((s) => s.slug === slug);
}

export function getLesson(lessonId: string) {
  for (const subject of subjects) {
    for (const unit of subject.units) {
      const lesson = unit.lessons.find((l) => l.id === lessonId);
      if (lesson) return { subject, unit, lesson };
    }
  }
  return undefined;
}

// Fənn üzrə bütün layihələrin sırası (unlock məntiqi üçün)
export function orderedLessonIds(slug: string): string[] {
  const subject = getSubject(slug);
  if (!subject) return [];
  return subject.units.flatMap((u) => u.lessons.map((l) => l.id));
}

// Praktika üçün: bütün tapşırıqlar (əsas + bonus).
export function getAllTasks(): Task[] {
  return subjects.flatMap((s) =>
    s.units.flatMap((u) =>
      u.lessons.flatMap((l) => [...l.tasks, ...(l.bonusTasks ?? [])]),
    ),
  );
}

// Tapşırığı id ilə tap (səhvlər praktikası üçün).
export function getTaskById(id: string): Task | undefined {
  return getAllTasks().find((t) => t.id === id);
}

// Saf köməkçilər ayrıca fayldadır (məzmunu bundle-a çəkməmək üçün) — bax helpers.ts.
export { isPassageTask } from "./helpers";
