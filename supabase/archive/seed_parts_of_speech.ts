// Hədəfli seed — YALNIZ "Nitq hissələri" (az-parts-of-speech) bölməsini DB-yə tətbiq edir.
// Digər bölmələrə/fənlərə və admin redaktələrinə TOXUNMUR (tam seed onları üzərinə yazardı).
//
// Nə edir:
//   - az-parts-of-speech bölməsini upsert edir (başlıq, sıra).
//   - İsim/Sifət/Say/Əvəzlik/Feil dərslərini bu bölməyə köçürür (unit_id yenilənir).
//   - Yeni "Zərf" dərsini + tapşırıqlarını əlavə edir.
//
// İşə salmaq:  npx tsx supabase/seed_parts_of_speech.ts

import { readFileSync } from "node:fs";
import { azerbaijani } from "../lib/content/azerbaijani";
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

function taskData(task: Task, bonus: boolean): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  if (task.figure) d.figure = task.figure;
  if (bonus) d.bonus = true;
  if (task.type === "multiple_choice") {
    d.options = task.options;
    d.correctIndex = task.correctIndex;
  } else if (task.type === "fill_blank") {
    d.accepted = task.accepted;
  } else if (task.type === "numeric") {
    d.answer = task.answer;
    if (task.tolerance !== undefined) d.tolerance = task.tolerance;
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
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  console.log(`  ${table}: ${rows.length} sətir`);
}

async function main() {
  const unitIndex = azerbaijani.units.findIndex((u) => u.id === "az-parts-of-speech");
  if (unitIndex < 0) {
    console.error("az-parts-of-speech bölməsi TS məzmununda tapılmadı.");
    process.exit(1);
  }
  const unit = azerbaijani.units[unitIndex];

  const unitRows = [
    {
      id: unit.id,
      subject_id: azerbaijani.slug,
      title: unit.title,
      description: unit.description ?? null,
      sort_order: unitIndex,
    },
  ];
  const lessonRows: unknown[] = [];
  const taskRows: unknown[] = [];

  unit.lessons.forEach((l, li) => {
    lessonRows.push({
      id: l.id,
      unit_id: unit.id, // köçürmə: unit_id az-parts-of-speech olur
      title: l.title,
      intro: l.intro ?? null,
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

  console.log("Nitq hissələri bölməsi tətbiq olunur...");
  await upsert("units", unitRows);
  await upsert("lessons", lessonRows);
  await upsert("tasks", taskRows);
  console.log(
    `Bitdi: 1 bölmə, ${lessonRows.length} dərs, ${taskRows.length} tapşırıq (Zərf daxil).`,
  );
}

main().catch((e) => {
  console.error("Xəta:", e.message);
  process.exit(1);
});
