// Məzmunu Supabase DB-dən oxuyub `Subject[]` ağacına bərpa edir (seed.ts-in əksi).
// DB boşdursa/xəta olsa null qaytarır → ContentProvider TS seed-ə fallback edir.

import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Subject,
  Unit,
  Lesson,
  Task,
  TaskFigure,
  RuleSection,
} from "../types";

// QEYD: əvvəl burada TS seed-dən dərs id → {intro, sections, visual} xəritəsi qurulurdu
// (DB-də boş sahələri doldurmaq üçün). Ölçüldü: DB-nin 566 dərsinin HAMISINDA bu sahələr
// artıq doludur — seed sıfır əlavə dəyər verirdi, əvəzində 25 məzmun faylını (~500 ms CPU,
// 23 MB heap) həm brauzer, həm də Worker bundle-ına çəkirdi. Bu isə Cloudflare-də soyuq
// başlanğıcda "Error 1102 — Worker exceeded resource limits" səbəbi idi. Ona görə seed
// asılılığı SİLİNDİ; seed yalnız DB tamamilə əlçatmaz olanda (ContentProvider-də lazy
// `import()` ilə) yüklənir.

interface SubjectRow {
  id: string;
  name: string;
  grade: number;
  icon: string | null;
  color: string | null;
  sort_order: number;
}
interface UnitRow {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}
interface LessonRow {
  id: string;
  unit_id: string;
  title: string;
  intro: string | null;
  kind?: string | null;
  visual: string | null;
  sections: RuleSection[] | null;
  sort_order: number;
}
interface TaskRow {
  id: string;
  lesson_id: string;
  type: Task["type"];
  prompt: string;
  data: Record<string, unknown> | null;
  xp: number;
  sort_order: number;
}

// jsonb `data`-nı Task-a çevir + bonus bayrağını qaytar.
function parseTask(row: TaskRow): { task: Task; bonus: boolean } {
  const d = row.data ?? {};
  const figure = d.figure as TaskFigure | undefined;
  const bonus = d.bonus === true;
  let task: Task;
  if (row.type === "multiple_choice") {
    task = {
      id: row.id,
      type: "multiple_choice",
      prompt: row.prompt,
      xp: row.xp,
      figure,
      options: (d.options as string[]) ?? [],
      correctIndex: (d.correctIndex as number) ?? 0,
    };
  } else if (row.type === "fill_blank") {
    task = {
      id: row.id,
      type: "fill_blank",
      prompt: row.prompt,
      xp: row.xp,
      figure,
      accepted: (d.accepted as string[]) ?? [],
    };
  } else if (row.type === "word_order") {
    task = {
      id: row.id,
      type: "word_order",
      prompt: row.prompt,
      xp: row.xp,
      figure,
      words: (d.words as string[]) ?? [],
      answer: (d.answer as string) ?? "",
      translation: d.translation as string | undefined,
    };
  } else if (row.type === "listening") {
    task = {
      id: row.id,
      type: "listening",
      prompt: row.prompt,
      xp: row.xp,
      figure,
      audioText: (d.audioText as string) ?? "",
      options: (d.options as string[]) ?? [],
      correctIndex: (d.correctIndex as number) ?? 0,
    };
  } else {
    task = {
      id: row.id,
      type: "numeric",
      prompt: row.prompt,
      xp: row.xp,
      figure,
      answer: (d.answer as number) ?? 0,
      tolerance: d.tolerance as number | undefined,
    };
  }
  if (d.speakOptions === true) task.speakOptions = true;
  if (typeof d.explanation === "string" && d.explanation) task.explanation = d.explanation;
  return { task, bonus };
}

// Bütün məzmunu bir dəfə çəkib ağac qur. Boş/xəta → null (fallback siqnalı).
// Brauzer client ilə (ContentProvider bunu çağırır).
export async function fetchContentTree(): Promise<Subject[] | null> {
  return fetchContentTreeWith(createClient());
}

// Tapşırıqları TAM çək — Supabase sorğu başına default 1000 sətir qaytarır, tapşırıqlar
// isə mindən çoxdur. Səhifələmə olmasa hər dərsin yalnız ilk ~10 tapşırığı gəlir (sort_order
// 0–9 global kəsilir). Ona görə 1000-lik səhifələrlə hamısını yığırıq.
//
// ƏVVƏL: səhifələr ARDICIL çəkilirdi — 9000+ tapşırıq = 10 gediş-gəliş bir-birinin ardınca,
// yəni path açılana qədər ~5 saniyə skeleton. İNDİ: əvvəlcə ümumi say alınır, sonra bütün
// səhifələr PARALEL çəkilir (bir gediş-gəliş qədər vaxt).
async function fetchPage(
  supabase: SupabaseClient,
  from: number,
  size: number,
): Promise<TaskRow[] | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("sort_order")
    .order("id")
    .range(from, from + size - 1);
  if (error || !data) return null;
  return data as TaskRow[];
}

// Ehtiyat yol: paralel çəkiliş alınmasa köhnə (ardıcıl) üsulla topla.
async function fetchAllTasksSequential(
  supabase: SupabaseClient,
  page: number,
): Promise<TaskRow[]> {
  const all: TaskRow[] = [];
  for (let from = 0; ; from += page) {
    const rows = await fetchPage(supabase, from, page);
    if (!rows || rows.length === 0) break;
    all.push(...rows);
    if (rows.length < page) break;
  }
  return all;
}

async function fetchAllTasks(supabase: SupabaseClient): Promise<TaskRow[]> {
  const PAGE = 1000;

  const { count, error: countError } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true });

  // Say alınmadısa risk etmirik — köhnə, sınanmış ardıcıl yola keçirik.
  if (countError || typeof count !== "number") {
    return fetchAllTasksSequential(supabase, PAGE);
  }
  if (count === 0) return [];

  const pages = Math.ceil(count / PAGE);
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) => fetchPage(supabase, i * PAGE, PAGE)),
  );

  // Bir səhifə belə uğursuz olsa NATAMAM məzmunla davam etmək olmaz (dərs tapşırıqsız
  // görünər, mükafat 0 olar) — belə halda tam siyahını ardıcıl yenidən yığırıq.
  if (results.some((r) => r === null)) {
    return fetchAllTasksSequential(supabase, PAGE);
  }

  return results.flat() as TaskRow[];
}

// Eyni məntiq, amma verilmiş client ilə — server (route handler) tərəf üçün.
export async function fetchContentTreeWith(
  supabase: SupabaseClient,
): Promise<Subject[] | null> {
  try {
    // İkinci açar (id) — eyni sort_order-lu sətirlərdə sıra sabit qalsın
    // (məs. admin paneldən yaradılıb təsadüfən eyni sort_order almış bölmələr).
    const [subsRes, unitsRes, lessonsRes, taskRows] = await Promise.all([
      supabase.from("subjects").select("*").order("sort_order").order("id"),
      supabase.from("units").select("*").order("sort_order").order("id"),
      supabase.from("lessons").select("*").order("sort_order").order("id"),
      fetchAllTasks(supabase),
    ]);

    const subs = subsRes.data as SubjectRow[] | null;
    if (subsRes.error || !subs || subs.length === 0) return null;
    const unitRows = (unitsRes.data ?? []) as UnitRow[];
    const lessonRows = (lessonsRes.data ?? []) as LessonRow[];

    // Tapşırıqları dərsə görə qrupla (əsas + bonus).
    const tasksByLesson = new Map<string, { main: Task[]; bonus: Task[] }>();
    for (const row of taskRows) {
      const { task, bonus } = parseTask(row);
      let entry = tasksByLesson.get(row.lesson_id);
      if (!entry) {
        entry = { main: [], bonus: [] };
        tasksByLesson.set(row.lesson_id, entry);
      }
      (bonus ? entry.bonus : entry.main).push(task);
    }

    // Dərsləri bölməyə görə qrupla.
    const lessonsByUnit = new Map<string, Lesson[]>();
    for (const row of lessonRows) {
      const t = tasksByLesson.get(row.id) ?? { main: [], bonus: [] };
      const lesson: Lesson = {
        id: row.id,
        title: row.title,
        intro: row.intro ?? "",
        kind: (row.kind as Lesson["kind"]) ?? "lesson",
        visual: row.visual ?? undefined,
        sections: row.sections && row.sections.length ? row.sections : undefined,
        tasks: t.main,
        bonusTasks: t.bonus.length ? t.bonus : undefined,
      };
      const arr = lessonsByUnit.get(row.unit_id) ?? [];
      arr.push(lesson);
      lessonsByUnit.set(row.unit_id, arr);
    }

    // Bölmələri fənnə görə qrupla.
    const unitsBySubject = new Map<string, Unit[]>();
    for (const row of unitRows) {
      const unit: Unit = {
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        lessons: lessonsByUnit.get(row.id) ?? [],
      };
      const arr = unitsBySubject.get(row.subject_id) ?? [];
      arr.push(unit);
      unitsBySubject.set(row.subject_id, arr);
    }

    return subs.map((s) => ({
      slug: s.id,
      name: s.name,
      grade: s.grade,
      icon: s.icon ?? "",
      color: s.color ?? "",
      units: unitsBySubject.get(s.id) ?? [],
    }));
  } catch {
    return null;
  }
}
