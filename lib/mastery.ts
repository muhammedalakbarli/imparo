// ══════════════════════════════════════════════════════════════════════════════
// MƏNİMSƏMƏ VƏ ADAPTİV SEÇİM
//
// `my_skill_mastery()` (migration 0047) hər bacarıq üçün 0-100 arası mənimsəmə
// qaytarır. Bu modul həmin rəqəmləri bacarıq qrafı ilə birləşdirib növbədə HANSI
// tapşırıqların verilməli olduğunu müəyyən edir.
//
// İki qərar burada verilir:
//  1. GERİYƏ ADDIM: şagird `arith.div.remainder`-də zəifdirsə və onun prereq-i
//     `arith.div.tables` də zəifdirsə, məşq prereq-dən başlayır. Kökü düzəltmədən
//     üstündəki bacarığı məşq etdirmək vaxt itkisidir.
//  2. ASANLIQ: `tasks`-da çətinlik sahəsi yoxdur. Amma eyni bacarıq bir neçə
//     sinifdə keçilir — AŞAĞI sinifdəki tapşırıq real olaraq daha asandır.
//     Ona görə zəif bacarıqda ən aşağı sinifdən başlayırıq.
// ══════════════════════════════════════════════════════════════════════════════

import { createClient } from "./supabase/client";
import { getSkill, type Skill } from "./skills";
import type { Subject, Task } from "./types";

export interface SkillStat {
  mastery: number; // 0-100
  attempts: number;
  lastSeen: string;
}

export type MasteryMap = Map<string, SkillStat>;

/** Bu həddən aşağı mənimsəmə "zəif" sayılır. */
export const WEAK_BELOW = 70;
/** Bu qədər cəhd olmadan zəiflik barədə hökm verilmir (az data = etibarsız). */
export const MIN_ATTEMPTS = 3;

export async function fetchMastery(): Promise<MasteryMap> {
  const sb = createClient();
  const { data, error } = await sb.rpc("my_skill_mastery");
  const out: MasteryMap = new Map();
  if (error || !Array.isArray(data)) return out;
  for (const r of data as { skill_id: string; mastery: number; attempts: number; last_seen: string }[]) {
    out.set(r.skill_id, { mastery: r.mastery, attempts: r.attempts, lastSeen: r.last_seen });
  }
  return out;
}

/** Kifayət qədər cəhd var və mənimsəmə həddən aşağıdır? */
export function isWeak(m: MasteryMap, id: string): boolean {
  const s = m.get(id);
  return !!s && s.attempts >= MIN_ATTEMPTS && s.mastery < WEAK_BELOW;
}

/**
 * Məşq üçün hədəf bacarıqlar — ən zəifdən başlayaraq.
 * Zəif bacarığın prereq-i də zəifdirsə, onun ƏVƏZİNƏ prereq götürülür.
 */
export function targetSkills(m: MasteryMap, max = 3): string[] {
  const weak = [...m.entries()]
    .filter(([id]) => isWeak(m, id))
    .sort((a, b) => a[1].mastery - b[1].mastery)
    .map(([id]) => id);

  const out: string[] = [];
  for (const id of weak) {
    if (out.length >= max) break;
    out.push(rootOf(m, id));
  }
  return [...new Set(out)];
}

/** Zəiflik zəncirinin kökü: prereq-lər zəif olduqca aşağı en. */
function rootOf(m: MasteryMap, id: string, depth = 0): string {
  if (depth > 5) return id;
  const s = getSkill(id);
  if (!s) return id;
  // Zəif prereq-lərdən ƏN zəifini seç.
  const weakPre = s.prereqs.filter((p) => isWeak(m, p)).sort((a, b) => m.get(a)!.mastery - m.get(b)!.mastery);
  return weakPre.length ? rootOf(m, weakPre[0], depth + 1) : id;
}

/** Bacarığı daşıyan tapşırıqlar — sinifə görə (aşağı sinif = asan) sıralanmış. */
export function tasksForSkill(subjects: Subject[], skillId: string, maxGrade?: number): Task[] {
  const rows: { grade: number; task: Task }[] = [];
  for (const s of subjects) {
    if (maxGrade !== undefined && s.grade > maxGrade) continue;
    for (const u of s.units)
      for (const l of u.lessons)
        for (const t of [...l.tasks, ...(l.bonusTasks ?? [])])
          if (t.skills?.includes(skillId)) rows.push({ grade: s.grade, task: t });
  }
  rows.sort((a, b) => a.grade - b.grade);
  return rows.map((r) => r.task);
}

/**
 * Adaptiv dəst: hədəf bacarıqlar arasında bərabər bölünür, hər bacarıqda ən aşağı
 * sinifdən başlanır. Eyni tapşırıq iki dəfə düşmür.
 */
export function buildAdaptiveSet(
  subjects: Subject[],
  targets: string[],
  count: number,
  opts: { maxGrade?: number; exclude?: (t: Task) => boolean } = {},
): Task[] {
  if (!targets.length) return [];
  const per = Math.max(1, Math.ceil(count / targets.length));
  const seen = new Set<string>();
  const out: Task[] = [];
  for (const id of targets) {
    const pool = tasksForSkill(subjects, id, opts.maxGrade).filter(
      (t) => !seen.has(t.id) && !(opts.exclude?.(t) ?? false),
    );
    for (const t of pool.slice(0, per)) {
      seen.add(t.id);
      out.push(t);
    }
  }
  return out.slice(0, count);
}

/** Bilik Xəritəsi üçün: qrupa görə çeşidlənmiş bacarıq + statistika. */
export interface MapRow extends Skill {
  stat?: SkillStat;
}

export function knowledgeMap(m: MasteryMap, skills: Skill[], maxGrade?: number): Map<string, MapRow[]> {
  const byGroup = new Map<string, MapRow[]>();
  for (const s of skills) {
    if (maxGrade !== undefined && s.grade > maxGrade) continue;
    const stat = m.get(s.id);
    // Heç sınanmamış bacarığı xəritədə göstərmirik: "0%" yanlış təəssürat yaradır.
    if (!stat) continue;
    const list = byGroup.get(s.group) ?? [];
    list.push({ ...s, stat });
    byGroup.set(s.group, list);
  }
  for (const list of byGroup.values()) list.sort((a, b) => (a.stat!.mastery - b.stat!.mastery));
  return byGroup;
}

// ── Diaqnostika ─────────────────────────────────────────────────────────────
// Diaqnostikanın işi ÖLÇMƏKDİR, öyrətmək yox. Ona görə:
//  · sual seçimi mənimsəməyə görə yox, ƏHATƏYƏ görə aparılır — hər bacarığa
//    bərabər sayda sual düşür;
//  · əvvəlcə HEÇ SINANMAMIŞ bacarıqlar gəlir: ən az bildiyimiz yer oradır;
//  · runner `silent` rejimində işləyir (cavab göstərilmir), yoxsa test öyrədir.
//
// Nəticə ayrıca hesablanmır: cəhdlər `task_attempts`-a düşür, `my_skill_mastery()`
// isə onları oxuyur. Yəni diaqnostikadan sonra Bilik Xəritəsi elə baseline-dır.

/** Ölçüləcək bacarıqlar: sınanmamışlar əvvəl, sonra yuxarı sinifdən aşağıya. */
export function diagnosticSkills(m: MasteryMap, skills: Skill[], maxGrade: number): string[] {
  return skills
    .filter((s) => s.grade <= maxGrade)
    .sort((a, b) => {
      const ua = m.has(a.id) ? 1 : 0;
      const ub = m.has(b.id) ? 1 : 0;
      if (ua !== ub) return ua - ub;
      return b.grade - a.grade;
    })
    .map((s) => s.id);
}

/** Hər bacarıqdan bərabər sayda sual; ümumi hədd aşılmır. */
export function buildDiagnosticSet(
  subjects: Subject[],
  skillIds: string[],
  perSkill: number,
  opts: { maxGrade?: number; limit?: number; exclude?: (t: Task) => boolean } = {},
): Task[] {
  const seen = new Set<string>();
  const out: Task[] = [];
  const limit = opts.limit ?? Infinity;
  for (const id of skillIds) {
    if (out.length >= limit) break;
    const pool = tasksForSkill(subjects, id, opts.maxGrade).filter(
      (t) => !seen.has(t.id) && !(opts.exclude?.(t) ?? false),
    );
    for (const t of pool.slice(0, perSkill)) {
      if (out.length >= limit) break;
      seen.add(t.id);
      out.push(t);
    }
  }
  return out;
}
