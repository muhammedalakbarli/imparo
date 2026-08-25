// Məzmun seed skripti — lib/content-dəki fənləri verilənlər bazasına yükləyir.
//
// Şərtlər:
//   1. Əvvəlcə `0001_init.sql` migration-ı işə düşməlidir (cədvəllər olmalıdır).
//   2. `.env.local`-da NEXT_PUBLIC_SUPABASE_URL və SUPABASE_SERVICE_ROLE_KEY olmalıdır.
//      (service_role açarı gizlidir — yalnız serverdə/skriptdə istifadə olunur, commit olunmur.)
//
// İşə salmaq:  npx tsx supabase/seed.ts
//
// Qeyd: PostgREST-ə birbaşa fetch ilə yazır (upsert), ona görə supabase-js lazım deyil.

import { readFileSync } from "node:fs";
import { subjects } from "../lib/content";
import type { Task } from "../lib/types";

function loadEnv(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(".env.local", "utf8")
        .split("\n")
        .filter((l) => l && !l.startsWith("#") && l.includes("="))
        .map((l) => {
          const i = l.indexOf("=");
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
        }),
    );
  } catch {
    return {};
  }
}

const env = { ...loadEnv(), ...process.env };
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL və SUPABASE_SERVICE_ROLE_KEY (.env.local) lazımdır.");
  process.exit(1);
}

// Tapşırığın tip-spesifik hissəsini jsonb `data`-ya çevirir.
function taskData(task: Task, bonus: boolean): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  if (task.figure) d.figure = task.figure;
  if (bonus) d.bonus = true;
  if (task.speakOptions) d.speakOptions = true;
  if (task.explanation) d.explanation = task.explanation;
  if (task.skills?.length) d.skills = task.skills;
  if (task.type === "multiple_choice") {
    d.options = task.options;
    d.correctIndex = task.correctIndex;
  } else if (task.type === "fill_blank") {
    d.accepted = task.accepted;
  } else if (task.type === "numeric") {
    d.answer = task.answer;
    if (task.tolerance !== undefined) d.tolerance = task.tolerance;
  } else if (task.type === "word_order") {
    d.words = task.words;
    d.answer = task.answer;
    if (task.translation !== undefined) d.translation = task.translation;
  } else if (task.type === "listening") {
    d.audioText = task.audioText;
    d.options = task.options;
    d.correctIndex = task.correctIndex;
  }
  return d;
}

async function upsert(table: string, rows: unknown[]) {
  if (rows.length === 0) return;
  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: KEY!,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`${table}: ${res.status} ${await res.text()}`);
  }
  console.log(`  ${table}: ${rows.length} sətir`);
}

async function main() {
  const subjectRows: unknown[] = [];
  const unitRows: unknown[] = [];
  const lessonRows: unknown[] = [];
  const taskRows: unknown[] = [];

  subjects.forEach((s, si) => {
    subjectRows.push({
      id: s.slug,
      name: s.name,
      grade: s.grade,
      icon: s.icon,
      color: s.color ?? null,
      sort_order: si,
    });
    s.units.forEach((u, ui) => {
      unitRows.push({
        id: u.id,
        subject_id: s.slug,
        title: u.title,
        description: u.description ?? null,
        sort_order: ui,
      });
      u.lessons.forEach((l, li) => {
        lessonRows.push({
          id: l.id,
          unit_id: u.id,
          title: l.title,
          intro: l.intro ?? null,
          kind: l.kind ?? "lesson",
          visual: l.visual ?? null,
          sections: l.sections ?? null,
          sort_order: li,
        });
        const all = [
          ...l.tasks.map((t) => ({ t, bonus: false })),
          ...(l.bonusTasks ?? []).map((t) => ({ t, bonus: true })),
        ];
        all.forEach(({ t, bonus }, ti) => {
          taskRows.push({
            id: t.id,
            lesson_id: l.id,
            type: t.type,
            prompt: t.prompt,
            data: taskData(t, bonus),
            xp: t.xp,
            sort_order: ti,
          });
        });
      });
    });
  });

  console.log("Seed başladı...");
  await upsert("subjects", subjectRows);
  await upsert("units", unitRows);
  await upsert("lessons", lessonRows);
  await upsert("tasks", taskRows);
  console.log(
    `Bitdi: ${subjectRows.length} fənn, ${unitRows.length} bölmə, ` +
      `${lessonRows.length} dərs, ${taskRows.length} tapşırıq.`,
  );
}

main().catch((e) => {
  console.error("Seed xətası:", e.message);
  process.exit(1);
});
