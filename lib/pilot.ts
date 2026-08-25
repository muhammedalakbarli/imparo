// ══════════════════════════════════════════════════════════════════════════════
// PİLOT — element hovuzları, uyğunluq və deterministik hədəf seçimi
//
// Sənədlər: docs/pilot/measurement-design.md · docs/pilot/analysis-plan.md
//
// İKİ İNVARİANT (testlə qorunur, şərh deyil):
//   1. B (baseline), F (final) və P (məşq) hovuzları KƏSİŞMİR.
//   2. F hovuzundakı tapşırıq məşqə, adaptiv seçimə və SRS-ə HEÇ VAXT düşmür.
// İkincisi olmasa "şagird bu tapşırığı əvvəl görməmişdi" iddiası yalan olur və
// bütün transfer nəticəsi etibarsız qalır.
//
// NİYƏ CƏDVƏL YOX: bölgü (bacarıq, sinif, tapşırıq) üçlüyündən deterministik
// çıxarılır. Saxlanc yoxdur, hər an yenidən hesablana bilir, auditi asandır.
// ŞƏRT: pilot boyu MƏZMUN DONDURULUR (data freeze) — tapşırıq əlavə/silinsə
// bölgü sürüşər.
// ══════════════════════════════════════════════════════════════════════════════

import { tasksForSkill, isWeak, type MasteryMap } from "./mastery";
import type { Subject, Task } from "./types";

export const BASELINE_ITEMS = 3;
export const FINAL_ITEMS = 3;
/** Bacarıq pilota namizəd olsun deyə lazım olan minimum tapşırıq. */
export const MIN_ITEMS = BASELINE_ITEMS + FINAL_ITEMS + 6;
/** Mühərrikin eyni anda hədəflədiyi bacarıq sayı. */
export const TARGET_COUNT = 3;

/**
 * Pilotun prioritet bacarıqları — sinif bantına görə.
 * Mənbə və əsaslandırma: docs/pilot/measurement-design.md §4.
 *
 * Burada saxlanır ki, sənədlə kod ayrılmasın: `tests/pilot.test.ts` hər bacarığın
 * material tələbini ödədiyini yoxlayır. Məzmun dəyişib material azalsa test düşür
 * və pilot dizaynının etibarsızlaşdığını dərhal bilirik.
 */
export const PILOT_SKILLS: Record<number, string[]> = {
  1: ["number.count", "number.compare", "arith.add.basic", "arith.sub.basic", "geom.shapes", "measure.time", "problem.one_step"],
  2: ["number.place_value", "arith.add.no_carry", "arith.add.carry", "arith.sub.no_borrow", "arith.sub.borrow", "arith.mul.concept", "arith.mul.tables", "arith.div.concept", "arith.div.tables", "problem.one_step"],
  3: ["arith.add.carry", "arith.sub.borrow", "arith.mul.tables", "arith.div.tables", "arith.div.remainder", "fraction.concept", "fraction.compare", "geom.perimeter", "problem.one_step"],
  4: ["arith.mul.tables", "arith.mul.multi_digit", "arith.div.multi_digit", "arith.order_of_ops", "number.rounding", "fraction.add_sub_same", "decimal.add_sub", "geom.area", "measure.convert", "problem.one_step"],
};

/**
 * Materialı sərhəddə olan bacarıqlar (məşqə 8-9 tapşırıq qalır). Ölçülür, amma
 * ƏSAS analizə daxil edilmir — 4-8 həftəlik müdaxiləni bu qədər materialla
 * etibarlı ölçmək olmur. Hesabatda ikinci dərəcəli nəticə kimi verilir.
 */
export const LIMITED_ITEM_SKILLS = new Set(["arith.div.remainder", "fraction.concept", "fraction.compare"]);

/** Əsas analizə daxil olan bacarıqlar (sərhəddəkilər çıxılmış). */
export function primarySkills(grade: number): string[] {
  return (PILOT_SKILLS[grade] ?? []).filter((id) => !LIMITED_ITEM_SKILLS.has(id));
}

export type Pool = "B" | "F" | "P";
export interface SkillPools {
  B: Task[];
  F: Task[];
  P: Task[];
}

/**
 * Bacarığın tapşırıqlarını üç hovuza bölür.
 *
 * Sıralama tapşırıq ID-sinə görədir — QƏSDƏN ixtiyaridir. Sinifə və ya çətinliyə
 * görə sıralasaq, test məşqdən sistematik asan (və ya çətin) olar və müqayisə
 * korlanar. ID sırası isə hər iki tərəf üçün eyni cür təsadüfidir.
 */
export function skillPools(subjects: Subject[], skillId: string, grade: number): SkillPools {
  const all = [...tasksForSkill(subjects, skillId, grade)].sort((a, b) => a.id.localeCompare(b.id));
  return {
    B: all.slice(0, BASELINE_ITEMS),
    F: all.slice(BASELINE_ITEMS, BASELINE_ITEMS + FINAL_ITEMS),
    P: all.slice(BASELINE_ITEMS + FINAL_ITEMS),
  };
}

/** Tapşırıq bu bacarıq/sinif üçün hansı hovuzdadır? Heç birində deyilsə null. */
export function poolOf(subjects: Subject[], skillId: string, grade: number, taskId: string): Pool | null {
  const p = skillPools(subjects, skillId, grade);
  if (p.B.some((t) => t.id === taskId)) return "B";
  if (p.F.some((t) => t.id === taskId)) return "F";
  if (p.P.some((t) => t.id === taskId)) return "P";
  return null;
}

/**
 * Pilot iştirakçısı üçün məşqdən kənarlaşdırma predikatı.
 * `buildAdaptiveSet`/`buildDiagnosticSet` `exclude` parametrinə verilir.
 */
export function makeFinalPoolGuard(subjects: Subject[], skillIds: string[], grade: number): (t: Task) => boolean {
  const banned = new Set<string>();
  for (const id of skillIds) for (const t of skillPools(subjects, id, grade).F) banned.add(t.id);
  return (t: Task) => banned.has(t.id);
}

/**
 * Bacarıq pilotda ölçülə bilərmi? Material çatmırsa namizəd hovuzuna DÜŞMÜR —
 * əks halda baseline/final üçün tapşırıq qalmır və ya məşq hovuzu boşalır.
 */
export function isEligible(subjects: Subject[], skillId: string, grade: number): boolean {
  return tasksForSkill(subjects, skillId, grade).length >= MIN_ITEMS;
}

// ── Deterministik təsadüfilik ───────────────────────────────────────────────
// Toxum şagird ID-sindən çıxarılır: eyni şagird üçün seçim HƏMİŞƏ eynidir, yəni
// nəticə aylar sonra da yenidən hesablana bilir. Math.random() bunu pozardı.

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministik qarışdırma (Fisher–Yates). */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const rnd = mulberry32(hashSeed(seed));
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface PilotAssignment {
  /** Mühərrikin məşq etdirdiyi bacarıqlar. */
  target: string[];
  /** Eyni dərəcədə zəif, amma bu dövrdə hədəfə alınmayanlar. */
  comparison: string[];
}

/**
 * Hədəf/müqayisə bölgüsü.
 *
 * NİYƏ TƏSADÜFİ: adi rejimdə mühərrik ƏN ZƏİF bacarıqları seçir. Pilotda bu,
 * hədəf dəstini müqayisə dəstindən sistematik zəif edərdi və ortaya qayıdış
 * effekti (regression to the mean) təkbaşına "hədəfdə daha çox artım" yaradardı —
 * nəticə etibarsız olardı. Təsadüfi seçim bunu aradan qaldırır və heç kimdən heç
 * nə əsirgəmir: qalan zəif bacarıqlar da növbə ilə hədəfə düşür.
 */
export function assignPilotSkills(
  subjects: Subject[],
  mastery: MasteryMap,
  candidateSkills: string[],
  grade: number,
  studentId: string,
): PilotAssignment {
  const weak = candidateSkills.filter((id) => isWeak(mastery, id) && isEligible(subjects, id, grade));
  const shuffled = seededShuffle(weak, studentId);
  return {
    target: shuffled.slice(0, TARGET_COUNT),
    comparison: shuffled.slice(TARGET_COUNT),
  };
}

// ── Əsas göstərici ──────────────────────────────────────────────────────────

export interface GainInput {
  /** bacarıq → baseline mənimsəməsi */
  baseline: Map<string, number>;
  /** bacarıq → final mənimsəməsi */
  final: Map<string, number>;
}

/** Bir dəst bacarıq üzrə orta qazanc (faiz bəndi). Ölçülə bilməyən bacarıq atılır. */
export function meanGain(input: GainInput, skills: string[]): number | null {
  const gains: number[] = [];
  for (const id of skills) {
    const b = input.baseline.get(id);
    const f = input.final.get(id);
    if (b === undefined || f === undefined) continue;
    gains.push(f - b);
  }
  return gains.length ? gains.reduce((a, b) => a + b, 0) / gains.length : null;
}

/**
 * Əsas estimand: qazanclar fərqi.
 *   (hədəf final − hədəf baseline) − (müqayisə final − müqayisə baseline)
 * Hər iki dəstdə ölçülə bilən bacarıq olmalıdır; yoxsa şagird əsas analizdən çıxır.
 */
export function differenceInGains(input: GainInput, a: PilotAssignment): number | null {
  const t = meanGain(input, a.target);
  const c = meanGain(input, a.comparison);
  return t === null || c === null ? null : t - c;
}
