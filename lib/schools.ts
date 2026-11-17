// Imparo Məktəb — sinif/tapşırıq client qatı (SECURITY DEFINER RPC-lərə sarğı).
// Bax: supabase/migrations/0023_schools.sql

import { createClient } from "./supabase/client";

export interface TeacherClass {
  id: string;
  name: string;
  code: string;
  subject_slug: string;
  grade: number;
  student_count: number;
}
export interface StudentClass {
  id: string;
  name: string;
  subject_slug: string;
  grade: number;
  teacher: string;
}
export interface RosterRow {
  user_id: string;
  name: string;
  total_xp: number;
  streak_days: number;
  completed: number;
}
export interface ClassAssignment {
  id: string;
  lesson_id: string;
  title: string;
  due_date: string | null;
  min_score: number;
  created_at: string;
}
export interface MyAssignment {
  id: string;
  class_name: string;
  subject_slug: string;
  lesson_id: string;
  title: string;
  due_date: string | null;
  done: boolean;
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await createClient().rpc(fn, args);
  if (error) throw error;
  return data as T;
}

// Müəllim qapısı (təsdiq sistemi)
export type TeacherRequestStatus = "none" | "pending" | "approved" | "rejected";
export interface TeacherStatus {
  is_teacher: boolean;
  request_status: TeacherRequestStatus;
}
export const myTeacherStatus = () =>
  rpc<TeacherStatus>("my_teacher_status").catch(() => ({ is_teacher: false, request_status: "none" as const }));
export const requestTeacher = (note = "") =>
  rpc<void>("request_teacher", { p_note: note });

// Müəllim
export function createClass(name: string, subjectSlug: string, grade: number) {
  return rpc<TeacherClass[]>("create_class", {
    p_name: name,
    p_subject_slug: subjectSlug,
    p_grade: grade,
  }).then((r) => r?.[0] ?? null);
}
export const teacherClasses = () => rpc<TeacherClass[]>("teacher_classes").catch(() => []);
export const classRoster = (classId: string) =>
  rpc<RosterRow[]>("class_roster", { p_class_id: classId }).catch(() => []);
export function assignLesson(
  classId: string,
  lessonId: string,
  title: string,
  due: string | null,
  minScore: number,
) {
  return rpc<string>("assign_lesson", {
    p_class_id: classId,
    p_lesson_id: lessonId,
    p_title: title,
    p_due: due,
    p_min: minScore,
  });
}
/** Sinfin bacarıq mənzərəsi (migration 0048). Əsas sütun weak_students. */
export interface SkillGapRow {
  skill_id: string;
  mastery: number;
  attempts: number;
  students: number;
  weak_students: number;
}
export const classSkillGaps = (classId: string) =>
  rpc<SkillGapRow[]>("class_skill_gaps", { p_class_id: classId }).catch(() => []);

export const classAssignments = (classId: string) =>
  rpc<ClassAssignment[]>("class_assignments", { p_class_id: classId }).catch(() => []);

// Şagird
export function joinClass(code: string) {
  return rpc<StudentClass[]>("join_class", { p_code: code }).then((r) => r?.[0] ?? null);
}
export const studentClasses = () => rpc<StudentClass[]>("student_classes").catch(() => []);
export const myAssignments = () => rpc<MyAssignment[]>("my_assignments").catch(() => []);
export const leaveClass = (classId: string) =>
  rpc<null>("leave_class", { p_class_id: classId }).catch(() => null);

// ── Müəllim idarəetməsi (migration 0054) ──
// 0023-də yalnız yaratmaq mümkün idi; bunlar redaktə/silmə boşluğunu bağlayır.
export const renameClass = (classId: string, name: string) =>
  rpc<null>("rename_class", { p_class_id: classId, p_name: name });
export const regenClassCode = (classId: string) =>
  rpc<string>("regen_class_code", { p_class_id: classId });
export const deleteClass = (classId: string) =>
  rpc<null>("delete_class", { p_class_id: classId });
export const removeStudent = (classId: string, uid: string) =>
  rpc<null>("remove_student", { p_class_id: classId, p_uid: uid });

// due: `undefined` → toxunma, `null` → son tarixi təmizlə, tarix → yenilə.
export function updateAssignment(
  id: string,
  patch: { title?: string; due?: string | null; minScore?: number },
) {
  return rpc<null>("update_assignment", {
    p_id: id,
    p_title: patch.title ?? null,
    p_due: patch.due ?? null,
    p_min: patch.minScore ?? null,
    p_clear_due: patch.due === null,
  });
}
export const deleteAssignment = (id: string) => rpc<null>("delete_assignment", { p_id: id });

/** Hər tapşırıq üzrə neçə şagird tamamlayıb. */
export interface AssignmentProgress { assignment_id: string; done: number; total: number }
export const assignmentProgress = (classId: string) =>
  rpc<AssignmentProgress[]>("assignment_progress", { p_class_id: classId }).catch(() => []);

/** Bir şagirdin müəllim üçün tam mənzərəsi (migration 0054). */
export interface StudentAssignment {
  id: string; title: string; lesson_id: string;
  due_date: string | null; done: boolean; done_at: string | null; late: boolean;
}
export interface StudentDetail {
  user_id: string;
  name: string;
  joined_at: string;
  total_xp: number;
  streak_days: number;
  completed: number;
  active_seconds: number;
  last_active_date: string | null;
  assignments: StudentAssignment[];
  weak_skills: { skill_id: string; mastery: number; attempts: number }[];
  recent: { lesson_id: string; title: string | null; subject: string | null; at: string }[];
}
export const classStudentDetail = (classId: string, uid: string) =>
  rpc<StudentDetail | null>("class_student_detail", { p_class_id: classId, p_uid: uid }).catch(() => null);

// ── E-poçtsuz şagird hesabları (0065) ──────────────────────────────────────────
export interface ManagedStudent {
  user_id: string;
  full_name: string;
  ref: string;
  pin: string;
  last_login_at: string | null;
  locked_until: string | null;
  created_at: string;
}
export const classManagedStudents = (classId: string) =>
  rpc<ManagedStudent[]>("class_managed_students", { p_class_id: classId }).catch(() => [] as ManagedStudent[]);
export const resetStudentPin = (userId: string) => rpc<string>("reset_student_pin", { p_user_id: userId });
export const deleteManagedStudent = (userId: string) => rpc<null>("delete_managed_student", { p_user_id: userId });

/**
 * Adları hissələrlə serverə göndərir (bir sorğuda ən çox STUDENT_CHUNK — Worker
 * alt-sorğu limiti). Hər hissədən sonra irəliləyiş bildirilir.
 */
export async function createManagedStudents(
  classId: string,
  names: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ created: number; failed: string[]; error?: string }> {
  const { STUDENT_CHUNK } = await import("./managedStudents");
  let created = 0;
  const failed: string[] = [];
  for (let i = 0; i < names.length; i += STUDENT_CHUNK) {
    const chunk = names.slice(i, i + STUDENT_CHUNK);
    const r = await fetch("/api/mekteb/students", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ classId, names: chunk }),
    }).catch(() => null);
    const j = (await r?.json().catch(() => null)) as { created?: unknown[]; failed?: string[]; error?: string } | null;
    if (!r || !r.ok || !j) {
      return { created, failed: [...failed, ...names.slice(i)], error: j?.error ?? "Bağlantı xətası" };
    }
    created += j.created?.length ?? 0;
    failed.push(...(j.failed ?? []));
    onProgress?.(Math.min(i + chunk.length, names.length), names.length);
  }
  return { created, failed };
}
