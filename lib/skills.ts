// ══════════════════════════════════════════════════════════════════════════════
// BACARIQ QRAFI (Skill Graph) — İmparonun semantik qatı.
//
// NİYƏ: `task_attempts` hər cəhdi yazır, amma cəhd yalnız DƏRSƏ bağlıdır. Ona görə
// sistem "Kəsrlər dərsi 67%" deyə bilir, "ortaq məxrəcə gətirmə 38%" deyə bilmir.
// Bacarıq qrafı hər tapşırığı konkret bacarıqlara bağlayır; beləcə eyni xam data
// bacarıq səviyyəsində mənimsəmə (mastery) hesablamağa imkan verir.
//
// QAYDALAR (pozulmasın — ID-lər DB-də və analitikada qalır):
//  1. ID ingiliscə, kiçik hərflə, nöqtə ilə ayrılır: `arith.add.carry`. Başlıq isə
//     azərbaycancadır (şagirdə/valideynə göstərilir).
//  2. ID HEÇ VAXT dəyişmir. Ad dəyişmək lazımdırsa `title` dəyişir, ID qalır —
//     yoxsa toplanmış cəhdlərin bacarıq bağlantısı qopur.
//  3. Bacarıq SİNİFDƏN ASILI DEYİL. "Kəsrlərin toplanması" həm 3-cü, həm 4-cü
//     sinifdə keçilir və EYNİ bacarıqdır — məhz buna görə qraf işə yarayır:
//     şagird 4-cü sinifdə səhv edəndə 3-cü sinifdəki köklərinə qayıda bilirik.
//  4. `prereqs` — bu bacarığı öyrənməzdən əvvəl bilinməli olanlar. Adaptiv mühərrik
//     zəiflik görəndə məhz bu siyahı ilə geriyə addımlayır.
//  5. `grade` — bacarığın İLK keçildiyi sinif (sıralama və diaqnostika üçün).
// ══════════════════════════════════════════════════════════════════════════════

export interface Skill {
  id: string;
  title: string; // azərbaycanca, şagird/valideyn görür
  group: string; // Bilik Xəritəsində qruplaşdırma başlığı
  grade: number; // ilk keçildiyi sinif
  prereqs: string[]; // əvvəlcədən bilinməli bacarıqlar
}

export const SKILLS: Skill[] = [
  // ── Ədəd anlayışı ──────────────────────────────────────────────────────────
  { id: "number.count", title: "Sayma və ardıcıllıq", group: "Ədədlər", grade: 1, prereqs: [] },
  { id: "number.compare", title: "Ədədləri müqayisə etmək", group: "Ədədlər", grade: 1, prereqs: ["number.count"] },
  { id: "number.place_value", title: "Mərtəbələr (onluq, yüzlük, minlik)", group: "Ədədlər", grade: 1, prereqs: ["number.count"] },
  { id: "number.sequence", title: "Ədəd naxışları və sıralar", group: "Ədədlər", grade: 2, prereqs: ["number.count"] },
  { id: "number.rounding", title: "Yuvarlaqlaşdırma", group: "Ədədlər", grade: 4, prereqs: ["number.place_value", "number.compare"] },
  { id: "number.divisors", title: "Bölənlər və bölünmə əlamətləri", group: "Ədədlər", grade: 4, prereqs: ["arith.div.tables"] },

  // ── Toplama və çıxma ───────────────────────────────────────────────────────
  { id: "arith.add.basic", title: "Sadə toplama (10 dairəsində)", group: "Toplama və çıxma", grade: 1, prereqs: ["number.count"] },
  { id: "arith.add.no_carry", title: "Keçidsiz toplama", group: "Toplama və çıxma", grade: 2, prereqs: ["arith.add.basic", "number.place_value"] },
  { id: "arith.add.carry", title: "Keçidli toplama", group: "Toplama və çıxma", grade: 2, prereqs: ["arith.add.no_carry"] },
  { id: "arith.sub.basic", title: "Sadə çıxma (10 dairəsində)", group: "Toplama və çıxma", grade: 1, prereqs: ["number.count"] },
  { id: "arith.sub.no_borrow", title: "Keçidsiz çıxma", group: "Toplama və çıxma", grade: 2, prereqs: ["arith.sub.basic", "number.place_value"] },
  { id: "arith.sub.borrow", title: "Keçidli çıxma (onluq sındırmaq)", group: "Toplama və çıxma", grade: 2, prereqs: ["arith.sub.no_borrow"] },

  // ── Vurma və bölmə ─────────────────────────────────────────────────────────
  { id: "arith.mul.concept", title: "Vurmanın mənası", group: "Vurma və bölmə", grade: 2, prereqs: ["arith.add.basic"] },
  { id: "arith.mul.tables", title: "Vurma cədvəli", group: "Vurma və bölmə", grade: 2, prereqs: ["arith.mul.concept"] },
  { id: "arith.mul.multi_digit", title: "Çoxrəqəmli vurma", group: "Vurma və bölmə", grade: 4, prereqs: ["arith.mul.tables", "number.place_value", "arith.add.carry"] },
  { id: "arith.div.concept", title: "Bölmənin mənası", group: "Vurma və bölmə", grade: 2, prereqs: ["arith.mul.concept"] },
  { id: "arith.div.tables", title: "Cədvəl üzrə bölmə", group: "Vurma və bölmə", grade: 2, prereqs: ["arith.div.concept", "arith.mul.tables"] },
  { id: "arith.div.remainder", title: "Qalıqlı bölmə", group: "Vurma və bölmə", grade: 3, prereqs: ["arith.div.tables"] },
  { id: "arith.div.multi_digit", title: "Çoxrəqəmli bölmə", group: "Vurma və bölmə", grade: 4, prereqs: ["arith.div.tables", "arith.mul.multi_digit"] },
  { id: "arith.inverse", title: "Tərs əməllər və naməlum komponent", group: "Vurma və bölmə", grade: 2, prereqs: ["arith.add.basic", "arith.sub.basic"] },
  { id: "arith.order_of_ops", title: "Əməllər sırası", group: "Vurma və bölmə", grade: 4, prereqs: ["arith.mul.tables", "arith.add.no_carry"] },

  // ── Kəsrlər ────────────────────────────────────────────────────────────────
  { id: "fraction.concept", title: "Kəsrin mənası", group: "Kəsrlər", grade: 3, prereqs: ["arith.div.concept"] },
  { id: "fraction.of_quantity", title: "Ədədin kəsr hissəsini tapmaq", group: "Kəsrlər", grade: 3, prereqs: ["fraction.concept", "arith.div.tables"] },
  { id: "fraction.compare", title: "Kəsrləri müqayisə etmək", group: "Kəsrlər", grade: 3, prereqs: ["fraction.concept"] },
  { id: "fraction.add_sub_same", title: "Eyni məxrəcli kəsrləri toplamaq və çıxmaq", group: "Kəsrlər", grade: 4, prereqs: ["fraction.concept"] },
  { id: "fraction.simplify", title: "Kəsri sadələşdirmək", group: "Kəsrlər", grade: 4, prereqs: ["fraction.concept", "arith.div.tables"] },
  { id: "fraction.equivalent", title: "Bərabər kəsrlər", group: "Kəsrlər", grade: 4, prereqs: ["fraction.concept", "arith.mul.tables"] },

  // ── Onluq kəsrlər ──────────────────────────────────────────────────────────
  { id: "decimal.concept", title: "Onluq kəsrin mənası", group: "Onluq kəsrlər", grade: 4, prereqs: ["fraction.concept", "number.place_value"] },
  { id: "decimal.compare", title: "Onluq kəsrləri müqayisə etmək", group: "Onluq kəsrlər", grade: 4, prereqs: ["decimal.concept", "number.compare"] },
  { id: "decimal.add_sub", title: "Onluq kəsrləri toplamaq və çıxmaq", group: "Onluq kəsrlər", grade: 4, prereqs: ["decimal.concept", "arith.add.carry"] },
  { id: "decimal.mul_div", title: "Onluq kəsrləri vurmaq və bölmək", group: "Onluq kəsrlər", grade: 4, prereqs: ["decimal.add_sub", "arith.mul.tables"] },

  // ── Ölçmə ──────────────────────────────────────────────────────────────────
  { id: "measure.compare", title: "Ölçüyə görə müqayisə (uzun, ağır, çox)", group: "Ölçmə və zaman", grade: 1, prereqs: ["number.compare"] },
  { id: "measure.units", title: "Ölçü vahidləri", group: "Ölçmə və zaman", grade: 1, prereqs: [] },
  { id: "measure.convert", title: "Vahid çevirmələri (m ↔ sm, kq ↔ q)", group: "Ölçmə və zaman", grade: 2, prereqs: ["measure.units", "arith.mul.tables"] },
  { id: "measure.time", title: "Saat, gün, həftə, ay", group: "Ölçmə və zaman", grade: 1, prereqs: ["number.count"] },
  { id: "measure.money", title: "Pul (manat və qəpik)", group: "Ölçmə və zaman", grade: 1, prereqs: ["number.count"] },

  // ── Həndəsə ────────────────────────────────────────────────────────────────
  { id: "geom.shapes", title: "Həndəsi fiqurlar", group: "Həndəsə", grade: 1, prereqs: [] },
  { id: "geom.perimeter", title: "Perimetr", group: "Həndəsə", grade: 2, prereqs: ["geom.shapes", "arith.add.no_carry"] },
  { id: "geom.area", title: "Sahə", group: "Həndəsə", grade: 3, prereqs: ["geom.shapes", "arith.mul.tables"] },
  { id: "geom.volume", title: "Həcm", group: "Həndəsə", grade: 5, prereqs: ["geom.area", "arith.mul.multi_digit"] },

  // ── Mətn məsələləri ────────────────────────────────────────────────────────
  // Bunlar əməldən AYRI bacarıqdır: şagird 7 + 8-i bilib, "neçə qaldı?" sualını
  // əməlyə çevirə bilməyə bilər. Tapşırıq HƏM əməl, HƏM məsələ bacarığı daşıyır.
  { id: "problem.one_step", title: "Bir addımlı mətn məsələsi", group: "Mətn məsələləri", grade: 1, prereqs: ["arith.add.basic"] },
  { id: "problem.multi_step", title: "Çoxaddımlı mətn məsələsi", group: "Mətn məsələləri", grade: 2, prereqs: ["problem.one_step"] },
];

const BY_ID = new Map(SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string): Skill | undefined {
  return BY_ID.get(id);
}

/** Bacarığın bütün prerequisite-ləri (dərinliyinə, təkrarsız). */
export function allPrereqs(id: string, seen = new Set<string>()): string[] {
  const s = BY_ID.get(id);
  if (!s) return [];
  for (const p of s.prereqs) {
    if (seen.has(p)) continue;
    seen.add(p);
    allPrereqs(p, seen);
  }
  return [...seen];
}

/** Qrafın bütövlüyünü yoxlayır: naməlum ID və dövr (cycle) olmamalıdır. */
export function validateGraph(): string[] {
  const errs: string[] = [];
  for (const s of SKILLS) {
    for (const p of s.prereqs) if (!BY_ID.has(p)) errs.push(`${s.id}: naməlum prereq "${p}"`);
  }
  const state = new Map<string, 0 | 1 | 2>();
  const walk = (id: string, path: string[]): void => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      errs.push(`dövr: ${[...path, id].join(" → ")}`);
      return;
    }
    state.set(id, 1);
    for (const p of BY_ID.get(id)?.prereqs ?? []) walk(p, [...path, id]);
    state.set(id, 2);
  };
  for (const s of SKILLS) walk(s.id, []);
  return errs;
}
