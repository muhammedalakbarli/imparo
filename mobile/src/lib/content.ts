// Məzmunu Supabase cədvəllərindən oxu (web lib/content/db.ts port).
import { supabase } from "./supabase";
import type { Subject, Unit, Lesson, Task, TaskType } from "./types";

interface SubjectRow { id: string; name: string; grade: number; icon: string | null; color: string | null; sort_order: number }
interface UnitRow { id: string; subject_id: string; title: string; description: string | null; sort_order: number }
interface LessonRow { id: string; unit_id: string; title: string; intro: string | null; sort_order: number }
interface TaskRow { id: string; lesson_id: string; type: TaskType; prompt: string; data: Record<string, unknown> | null; xp: number; sort_order: number }

function parseTask(row: TaskRow): { task: Task; bonus: boolean } {
  const d = row.data ?? {};
  const bonus = d.bonus === true;
  const base = { id: row.id, prompt: row.prompt, xp: row.xp } as const;
  let task: Task;
  if (row.type === "multiple_choice")
    task = { ...base, type: "multiple_choice", options: (d.options as string[]) ?? [], correctIndex: (d.correctIndex as number) ?? 0 };
  else if (row.type === "fill_blank")
    task = { ...base, type: "fill_blank", accepted: (d.accepted as string[]) ?? [] };
  else if (row.type === "word_order")
    task = { ...base, type: "word_order", words: (d.words as string[]) ?? [], answer: (d.answer as string) ?? "", translation: d.translation as string | undefined };
  else if (row.type === "listening")
    task = { ...base, type: "listening", audioText: (d.audioText as string) ?? "", options: (d.options as string[]) ?? [], correctIndex: (d.correctIndex as number) ?? 0 };
  else
    task = { ...base, type: "numeric", answer: (d.answer as number) ?? 0, tolerance: d.tolerance as number | undefined };
  if (d.speakOptions === true) task.speakOptions = true;
  return { task, bonus };
}

async function fetchAllTasks(): Promise<TaskRow[]> {
  const PAGE = 1000;
  const all: TaskRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from("tasks").select("*").order("sort_order").order("id").range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    all.push(...(data as TaskRow[]));
    if (data.length < PAGE) break;
  }
  return all;
}

export async function fetchContentTree(): Promise<Subject[]> {
  const [subsRes, unitsRes, lessonsRes, taskRows] = await Promise.all([
    supabase.from("subjects").select("*").order("sort_order").order("id"),
    supabase.from("units").select("*").order("sort_order").order("id"),
    supabase.from("lessons").select("*").order("sort_order").order("id"),
    fetchAllTasks(),
  ]);
  const subs = (subsRes.data as SubjectRow[] | null) ?? [];
  if (subs.length === 0) return [];
  const unitRows = (unitsRes.data ?? []) as UnitRow[];
  const lessonRows = (lessonsRes.data ?? []) as LessonRow[];

  const tasksByLesson = new Map<string, { main: Task[]; bonus: Task[] }>();
  for (const row of taskRows) {
    const { task, bonus } = parseTask(row);
    let e = tasksByLesson.get(row.lesson_id);
    if (!e) { e = { main: [], bonus: [] }; tasksByLesson.set(row.lesson_id, e); }
    (bonus ? e.bonus : e.main).push(task);
  }
  const lessonsByUnit = new Map<string, Lesson[]>();
  for (const row of lessonRows) {
    const t = tasksByLesson.get(row.id) ?? { main: [], bonus: [] };
    const arr = lessonsByUnit.get(row.unit_id) ?? [];
    arr.push({ id: row.id, title: row.title, intro: row.intro ?? "", tasks: t.main, bonusTasks: t.bonus.length ? t.bonus : undefined });
    lessonsByUnit.set(row.unit_id, arr);
  }
  const unitsBySubject = new Map<string, Unit[]>();
  for (const row of unitRows) {
    const arr = unitsBySubject.get(row.subject_id) ?? [];
    arr.push({ id: row.id, title: row.title, description: row.description ?? undefined, lessons: lessonsByUnit.get(row.id) ?? [] });
    unitsBySubject.set(row.subject_id, arr);
  }
  // slug: web-də subjects.slug var; DB SubjectRow-da yoxdur → id-dən istifadə (unikal).
  return subs.map((s) => ({
    slug: s.id,
    name: s.name,
    grade: s.grade,
    icon: s.icon ?? "📘",
    color: s.color ?? undefined,
    units: unitsBySubject.get(s.id) ?? [],
  }));
}
