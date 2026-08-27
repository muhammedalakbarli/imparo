// GET /api/lessons/{id} — bir dərs: giriş, video, qaydalar (sections) + tapşırıqlar.
// Mobil app da bu marşrutdan oxuyur, ona görə yeni sahələr BURADA da qaytarılmalıdır.

import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/http";
import { getLessonDetail, getTree, findLesson } from "@/lib/api/content";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  // Yalnız bu dərsin sətirləri çəkilir (bax lib/content/db.ts).
  let lesson = await getLessonDetail(id);
  // DB boş/əlçatmaz — köhnə tam-ağac yolu (seed fallback-ı ilə).
  if (!lesson) lesson = findLesson(await getTree(), id) ?? null;
  if (!lesson) return fail("Dərs tapılmadı", 404);

  return ok({
    id: lesson.id,
    title: lesson.title,
    intro: lesson.intro,
    visual: lesson.visual ?? null,
    video: lesson.video ?? null,
    sections: lesson.sections ?? [],
    tasks: lesson.tasks,
    bonusTasks: lesson.bonusTasks ?? [],
  });
}
