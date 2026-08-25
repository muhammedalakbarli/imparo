// Route handler-lər üçün məzmun oxuma. DB-dən çəkir, boş olsa TS seed-ə fallback.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "../supabase/server";
import { SITE_URL } from "../site";
import {
  fetchContentTreeWith,
  fetchSubjectSummariesWith,
  fetchSubjectDetailWith,
  fetchLessonDetailWith,
  type SubjectSummary,
  type SubjectDetail,
} from "../content/db";
import type { Subject, Lesson } from "../types";

// Bütün fənn ağacını qaytar (DB → yoxsa seed).
//
// Seed BURADA import EDİLMİR — nə statik, nə `import()` ilə. `@/lib/content` 25 fənn
// faylını (~11700 tapşırıq) daşıyır:
//   1) qiymətləndirilməsi ~500 ms CPU tutur → Worker soyuq başlanğıcda Error 1102;
//   2) `import()` olsa belə Turbopack onu server chunk-ına qoyur (2.1 MB) və bu,
//      3 MiB-lıq Worker yükünə sayılır.
// Ona görə fallback statik JSON-u ASSETS binding-i ilə oxuyur. JSON-u
// `scripts/gen-content-seed.ts` yaradır (`npm run build` avtomatik çağırır).
export async function getTree(): Promise<Subject[]> {
  const supabase = await createClient();
  const tree = await fetchContentTreeWith(supabase);
  if (tree) return tree;
  const { env } = await getCloudflareContext({ async: true });
  const res = await env.ASSETS.fetch(new URL("/content-seed.json", SITE_URL));
  if (!res.ok) throw new Error(`content-seed.json: ${res.status}`);
  return (await res.json()) as Subject[];
}

export function findSubject(tree: Subject[], id: string): Subject | undefined {
  return tree.find((s) => s.slug === id);
}

export function findLesson(tree: Subject[], id: string): Lesson | undefined {
  for (const s of tree)
    for (const u of s.units) {
      const l = u.lessons.find((x) => x.id === id);
      if (l) return l;
    }
  return undefined;
}

// ── Hədəflənmiş oxumalar ───────────────────────────────────────────────────────
// Bunlar getTree()-dən fərqli olaraq bütün tapşırıq cədvəlini çəkmir (bax
// lib/content/db.ts-dəki izah). DB boş/xətalıdırsa null qaytarırlar — çağıran
// route köhnə tam-ağac yoluna, oradan da seed fallback-ına keçir.

export async function getSubjectSummaries(): Promise<SubjectSummary[] | null> {
  const supabase = await createClient();
  return fetchSubjectSummariesWith(supabase);
}

export async function getSubjectDetail(slug: string): Promise<SubjectDetail | null> {
  const supabase = await createClient();
  return fetchSubjectDetailWith(supabase, slug);
}

export async function getLessonDetail(id: string): Promise<Lesson | null> {
  const supabase = await createClient();
  return fetchLessonDetailWith(supabase, id);
}
