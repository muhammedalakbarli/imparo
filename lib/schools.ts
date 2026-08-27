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
