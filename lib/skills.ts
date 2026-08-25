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
  { id: "number.divisors", title: "Bölənlər və bölünmə əlamətləri", group: "Ədədlər", grade: 5, prereqs: ["arith.div.tables"] },

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

  // ── 5–8-ci sinif: ədədlər ──────────────────────────────────────────────────
  { id: "number.primes", title: "Sadə və mürəkkəb ədədlər", group: "Ədədlər", grade: 5, prereqs: ["number.divisors"] },
  { id: "number.gcd_lcm", title: "ƏBOB və ƏKOB", group: "Ədədlər", grade: 6, prereqs: ["number.primes"] },
  { id: "integer.concept", title: "Tam ədədlər (mənfi ədədlər)", group: "Ədədlər", grade: 6, prereqs: ["number.compare"] },
  { id: "integer.ops", title: "Tam ədədlər üzərində əməllər", group: "Ədədlər", grade: 6, prereqs: ["integer.concept", "arith.add.carry", "arith.sub.borrow"] },
  { id: "rational.concept", title: "Rasional ədədlər", group: "Ədədlər", grade: 6, prereqs: ["integer.concept", "fraction.concept"] },
  { id: "number.real", title: "Həqiqi ədədlər", group: "Ədədlər", grade: 8, prereqs: ["rational.concept", "root.square"] },
  { id: "sets.basic", title: "Çoxluqlar", group: "Ədədlər", grade: 5, prereqs: [] },

  // ── Kəsrlər (davamı) ───────────────────────────────────────────────────────
  { id: "fraction.mixed", title: "Qarışıq ədədlər", group: "Kəsrlər", grade: 5, prereqs: ["fraction.concept"] },
  { id: "fraction.add_sub_diff", title: "Fərqli məxrəcli kəsrləri toplamaq və çıxmaq", group: "Kəsrlər", grade: 6, prereqs: ["fraction.add_sub_same", "number.gcd_lcm"] },
  { id: "fraction.mul_div", title: "Kəsrləri vurmaq və bölmək", group: "Kəsrlər", grade: 6, prereqs: ["fraction.concept", "arith.mul.tables"] },

  // ── Faiz və nisbət ─────────────────────────────────────────────────────────
  { id: "percent.concept", title: "Faiz anlayışı", group: "Faiz və nisbət", grade: 5, prereqs: ["fraction.concept", "decimal.concept"] },
  { id: "percent.of", title: "Ədədin faizini tapmaq", group: "Faiz və nisbət", grade: 5, prereqs: ["percent.concept", "arith.mul.multi_digit"] },
  { id: "percent.find_whole", title: "Faizə görə bütövü tapmaq", group: "Faiz və nisbət", grade: 5, prereqs: ["percent.of", "arith.div.multi_digit"] },
  { id: "ratio.concept", title: "Nisbət", group: "Faiz və nisbət", grade: 5, prereqs: ["fraction.concept"] },
  { id: "ratio.proportion", title: "Tənasüb", group: "Faiz və nisbət", grade: 6, prereqs: ["ratio.concept"] },

  // ── Cəbr ───────────────────────────────────────────────────────────────────
  { id: "algebra.expression", title: "Cəbri ifadələr", group: "Cəbr", grade: 7, prereqs: ["arith.order_of_ops", "rational.concept"] },
  { id: "algebra.simplify", title: "Bənzər hədləri yığmaq", group: "Cəbr", grade: 7, prereqs: ["algebra.expression"] },
  { id: "equation.linear", title: "Birdəyişənli tənliklər", group: "Cəbr", grade: 7, prereqs: ["algebra.simplify", "arith.inverse"] },
  { id: "poly.concept", title: "Tək və çoxhədlilər", group: "Cəbr", grade: 7, prereqs: ["algebra.expression"] },
  { id: "poly.multiply", title: "Çoxhədliləri vurmaq", group: "Cəbr", grade: 7, prereqs: ["poly.concept", "power.natural"] },
  { id: "poly.formulas", title: "Müxtəsər vurma düsturları", group: "Cəbr", grade: 7, prereqs: ["poly.multiply"] },
  { id: "algebra.fraction", title: "Cəbri kəsrlər", group: "Cəbr", grade: 8, prereqs: ["fraction.mul_div", "algebra.simplify"] },
  { id: "equation.quadratic", title: "Kvadrat tənliklər", group: "Cəbr", grade: 8, prereqs: ["equation.linear", "root.square", "poly.formulas"] },
  { id: "inequality.linear", title: "Xətti bərabərsizliklər", group: "Cəbr", grade: 8, prereqs: ["equation.linear", "number.compare"] },

  // ── Qüvvət və kök ──────────────────────────────────────────────────────────
  { id: "power.natural", title: "Natural üstlü qüvvət", group: "Qüvvət və kök", grade: 7, prereqs: ["arith.mul.tables"] },
  { id: "power.rules", title: "Qüvvətin xassələri", group: "Qüvvət və kök", grade: 7, prereqs: ["power.natural"] },
  { id: "power.integer", title: "Tam üstlü qüvvət", group: "Qüvvət və kök", grade: 8, prereqs: ["power.rules", "integer.ops"] },
  { id: "power.standard", title: "Standart şəkil", group: "Qüvvət və kök", grade: 8, prereqs: ["power.integer"] },
  { id: "root.square", title: "Kvadrat kök", group: "Qüvvət və kök", grade: 8, prereqs: ["power.natural"] },

  // ── Funksiya və koordinat ──────────────────────────────────────────────────
  { id: "coord.plane", title: "Koordinat müstəvisi", group: "Funksiya", grade: 6, prereqs: ["integer.concept"] },
  { id: "function.concept", title: "Funksiya anlayışı", group: "Funksiya", grade: 7, prereqs: ["coord.plane"] },
  { id: "function.quadratic", title: "y = x² funksiyası", group: "Funksiya", grade: 8, prereqs: ["function.concept", "power.natural"] },
  { id: "function.inverse_prop", title: "y = k/x funksiyası", group: "Funksiya", grade: 8, prereqs: ["function.concept", "fraction.mul_div"] },

  // ── Həndəsə (davamı) ───────────────────────────────────────────────────────
  { id: "geom.angles", title: "Bucaqlar", group: "Həndəsə", grade: 5, prereqs: ["geom.shapes"] },
  { id: "geom.angle_pairs", title: "Qonşu və qarşılıqlı bucaqlar", group: "Həndəsə", grade: 7, prereqs: ["geom.angles"] },
  { id: "geom.triangle", title: "Üçbucaqlar", group: "Həndəsə", grade: 6, prereqs: ["geom.angles"] },
  { id: "geom.triangle_props", title: "Üçbucağın xassələri", group: "Həndəsə", grade: 7, prereqs: ["geom.triangle"] },
  { id: "geom.circle", title: "Çevrə və dairə", group: "Həndəsə", grade: 6, prereqs: ["geom.shapes"] },
  { id: "geom.quadrilateral", title: "Dördbucaqlılar", group: "Həndəsə", grade: 8, prereqs: ["geom.triangle_props"] },
  { id: "geom.pythagoras", title: "Pifaqor teoremi", group: "Həndəsə", grade: 8, prereqs: ["geom.triangle_props", "root.square"] },

  // ── Məlumat və ehtimal ─────────────────────────────────────────────────────
  { id: "data.read", title: "Cədvəl və diaqramları oxumaq", group: "Məlumat və ehtimal", grade: 5, prereqs: ["number.compare"] },
  // QEYD: "orta qiymət" bacarığı qrafdan çıxarılıb — məzmunda onu ölçən BİR
  // tapşırıq belə yoxdur (5-ci sinif kurikulumunda mövzu var, bizdə yazılmayıb).
  // Məzmun yazılanda bacarıq geri qaytarılmalıdır.
  { id: "prob.basic", title: "Ehtimal", group: "Məlumat və ehtimal", grade: 5, prereqs: ["fraction.concept"] },
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
