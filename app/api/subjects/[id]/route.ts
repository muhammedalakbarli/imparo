// GET /api/subjects/{id} — bir fənn: bölmələr + dərs başlıqları.

import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/http";
import { getSubjectDetail, getTree, findSubject } from "@/lib/api/content";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  // Tapşırıq mətnləri çəkilmir, yalnız saylar (bax lib/content/db.ts).
  const detail = await getSubjectDetail(id);
  if (detail) return ok(detail);

  // DB boş/əlçatmaz — köhnə tam-ağac yolu (seed fallback-ı ilə).
  const subject = findSubject(await getTree(), id);
  if (!subject) return fail("Fənn tapılmadı", 404);
  return ok({
    id: subject.slug,
    name: subject.name,
    grade: subject.grade,
    icon: subject.icon,
    color: subject.color,
    units: subject.units.map((u) => ({
      id: u.id,
      title: u.title,
      description: u.description,
      lessons: u.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        taskCount: l.tasks.length,
        bonusCount: l.bonusTasks?.length ?? 0,
      })),
    })),
  });
}
