"use client";

// Qonaq (hesabsız) vəziyyəti — Duolingo modeli: şagird ƏVVƏL sınayır, SONRA qeydiyyatdan keçir.
//
// Niyə lazımdır: onboarding və ilk dərs artıq girişdən ƏVVƏL baş verir, ona görə həmin
// müddətdə yazacaq bir hesab yoxdur. Cavablar və ilk dərsin nəticəsi brauzerdə saxlanılır,
// qeydiyyat anında isə hesaba köçürülür (bax adoptGuest).
//
// Bu, YALNIZ onboarding üçündür — daimi tərəqqi mənbəyi deyil. Hesab yaradılan kimi
// həqiqət mənbəyi yenidən Supabase olur və qonaq vəziyyəti silinir.

const KEY = "imparo.guest.v1";

export interface GuestState {
  grade?: number;
  focus?: string;        // fənn slug prefiksi və ya "hamisi"
  reason?: string;
  source?: string;
  level?: string;        // özünü qiymətləndirmə
  goal?: number;         // gündəlik dəqiqə
  streakGoal?: number;   // 7 / 14 / 30 / 50 gün
  notify?: "allow" | "block";
  placement?: "scratch" | "test";
  age?: number;
  /** Onboarding-də bitirilən dərslər — qeydiyyatda serverdə təkrar hesablanır. */
  lessons?: string[];
  /** Diaqnostikada "bilirəm" işarələnən dərslər (XP-siz tamamlanmış sayılır). */
  knownLessons?: string[];
  /** Diaqnostikada səhv cavablanan tapşırıqlar — qeydiyyatda SRS-ə düşür. */
  wrongTasks?: string[];
  xp?: number;
  gems?: number;
  /** Onboarding skripti bitibmi (ilk dərs + mükafat zənciri daxil). */
  done?: boolean;
}

function read(): GuestState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as GuestState;
  } catch {
    return {};
  }
}

export function getGuest(): GuestState {
  return read();
}

/** Vəziyyəti hissə-hissə yenilə (mövcud sahələr saxlanılır). */
export function setGuest(patch: Partial<GuestState>): GuestState {
  const next = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Şəxsi rejimdə localStorage bağlı ola bilər — onboarding yenə işləməlidir,
    // sadəcə yeniləmədə vəziyyət itir. Səssiz keçirik.
  }
  return next;
}

export function addGuestLesson(lessonId: string, xp: number, gems: number): GuestState {
  const g = read();
  const lessons = g.lessons ?? [];
  return setGuest({
    lessons: lessons.includes(lessonId) ? lessons : [...lessons, lessonId],
    xp: (g.xp ?? 0) + xp,
    gems: (g.gems ?? 0) + gems,
  });
}

export function clearGuest(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* yuxarıdakı kimi — səssiz */
  }
}

/** user_metadata-ya yazılacaq sahələr (qeydiyyat anında). */
export function guestMetadata(g: GuestState): Record<string, unknown> {
  const m: Record<string, unknown> = { onboarded: true };
  for (const k of ["grade", "focus", "reason", "source", "level", "goal", "streakGoal", "age"] as const) {
    if (g[k] !== undefined) m[k] = g[k];
  }
  return m;
}
