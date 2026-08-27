// İstifadəçinin sinfi — onboardingdə seçilib user_metadata.grade-də saxlanılır.
// App məzmunu bu sinfə görə süzür (dashboard yalnız uyğun sinfin fənlərini göstərir).

import type { User } from "@supabase/supabase-js";
import type { Subject } from "./types";

// Onboarding sinfi (1–11). Yoxdursa/etibarsızsa default 5.
export function userGrade(user: User | null): number {
  const g = user?.user_metadata?.grade;
  return typeof g === "number" && g >= 1 && g <= 11 ? g : 5;
}

// Hazırda məzmunu olan siniflər (settings sinif dəyişdiricisi bunları göstərir).
export const GRADES_WITH_CONTENT = [1, 2, 3, 4, 5, 6, 7, 8];

// Azərbaycan dilində sıra sayı şəkilçisi (1-ci, 3-cü, 6-cı ...) — sinif etiketi üçün.
const GRADE_ORDINAL: Record<number, string> = {
  1: "1-ci", 2: "2-ci", 3: "3-cü", 4: "4-cü",
  5: "5-ci", 6: "6-cı", 7: "7-ci", 8: "8-ci",
};

export function gradeLabel(g: number): string {
  return `${GRADE_ORDINAL[g] ?? `${g}-ci`} sinif`;
}

// İstifadəçinin sinfinə uyğun fənlər. BÜTÜN şagird-üzlü səhifələr (dashboard,
// praktika, profil, "daha") bu funksiyadan istifadə etməlidir — əks halda hər
// sinifdə eyni adlı fənlər (Riyaziyyat, Azərbaycan dili, İngilis dili) təkrarlanır.
export function subjectsForGrade(subjects: Subject[], user: User | null): Subject[] {
  const g = userGrade(user);
  return subjects.filter((s) => s.grade === g);
}
