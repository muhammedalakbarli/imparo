import { describe, it, expect } from "vitest";
import { subjects } from "@/lib/content";
import { buildAdaptiveSet, buildDiagnosticSet, type MasteryMap } from "@/lib/mastery";
import {
  PILOT_SKILLS,
  LIMITED_ITEM_SKILLS,
  primarySkills,
  skillPools,
  poolOf,
  makeFinalPoolGuard,
  isEligible,
  seededShuffle,
  assignPilotSkills,
  meanGain,
  differenceInGains,
  BASELINE_ITEMS,
  FINAL_ITEMS,
  MIN_ITEMS,
  TARGET_COUNT,
} from "@/lib/pilot";

const math = subjects.filter((s) => s.slug.startsWith("riyaziyyat"));
const GRADES = [1, 2, 3, 4];
const now = new Date().toISOString();
const M = (rows: Record<string, [number, number]>): MasteryMap =>
  new Map(Object.entries(rows).map(([id, [mastery, attempts]]) => [id, { mastery, attempts, lastSeen: now }]));

describe("pilot dizaynı məzmuna uyğundur", () => {
  it("hər prioritet bacarıqda material çatır (3 + 3 + ≥6)", () => {
    // Bu test SƏNƏDİ qoruyur: məzmun dəyişib material azalsa, pilot dizaynı
    // etibarsızlaşır və bunu dərhal bilməliyik.
    const bad: string[] = [];
    for (const g of GRADES)
      for (const id of PILOT_SKILLS[g]) if (!isEligible(math, id, g)) bad.push(`${g}:${id}`);
    expect(bad).toEqual([]);
  });

  it("sərhəddə olan bacarıqlar əsas analizdən çıxarılır", () => {
    for (const g of GRADES)
      for (const id of primarySkills(g)) expect(LIMITED_ITEM_SKILLS.has(id)).toBe(false);
    // 3-cü sinifdə üç sərhəd bacarığı var → əsas dəst 6 olmalıdır
    expect(primarySkills(3).length).toBe(PILOT_SKILLS[3].length - 3);
  });
});

describe("B / F / P hovuzları", () => {
  it("kəsişmir və ölçüləri düzgündür", () => {
    for (const g of GRADES)
      for (const id of PILOT_SKILLS[g]) {
        const p = skillPools(math, id, g);
        expect(p.B).toHaveLength(BASELINE_ITEMS);
        expect(p.F).toHaveLength(FINAL_ITEMS);
        expect(p.P.length).toBeGreaterThanOrEqual(MIN_ITEMS - BASELINE_ITEMS - FINAL_ITEMS);
        const ids = [...p.B, ...p.F, ...p.P].map((t) => t.id);
        expect(new Set(ids).size, `${g}:${id}`).toBe(ids.length);
      }
  });

  it("deterministikdir — təkrar çağırışda eyni bölgü", () => {
    const a = skillPools(math, "arith.mul.tables", 3);
    const b = skillPools(math, "arith.mul.tables", 3);
    expect(a.F.map((t) => t.id)).toEqual(b.F.map((t) => t.id));
  });

  it("poolOf hovuzu düzgün tapır", () => {
    const p = skillPools(math, "arith.mul.tables", 3);
    expect(poolOf(math, "arith.mul.tables", 3, p.B[0].id)).toBe("B");
    expect(poolOf(math, "arith.mul.tables", 3, p.F[0].id)).toBe("F");
    expect(poolOf(math, "arith.mul.tables", 3, p.P[0].id)).toBe("P");
  });
});

describe("İNVARİANT: final tapşırığı məşqə düşmür", () => {
  for (const g of GRADES) {
    it(`${g}-ci sinif — adaptiv dəstdə F elementi yoxdur`, () => {
      const skills = PILOT_SKILLS[g];
      const guard = makeFinalPoolGuard(math, skills, g);
      const finalIds = new Set(skills.flatMap((id) => skillPools(math, id, g).F.map((t) => t.id)));
      const set = buildAdaptiveSet(math, skills.slice(0, TARGET_COUNT), 30, { maxGrade: g, exclude: guard });
      expect(set.length).toBeGreaterThan(0);
      for (const t of set) expect(finalIds.has(t.id), `${t.id} final hovuzundadır`).toBe(false);
    });

    it(`${g}-ci sinif — diaqnostikada F elementi yoxdur`, () => {
      const skills = PILOT_SKILLS[g];
      const guard = makeFinalPoolGuard(math, skills, g);
      const finalIds = new Set(skills.flatMap((id) => skillPools(math, id, g).F.map((t) => t.id)));
      const set = buildDiagnosticSet(math, skills, 3, { maxGrade: g, limit: 40, exclude: guard });
      for (const t of set) expect(finalIds.has(t.id)).toBe(false);
    });
  }
});

describe("hədəf seçimi", () => {
  const weakAll = M(Object.fromEntries(PILOT_SKILLS[2].map((id) => [id, [40, 6] as [number, number]])));

  it("eyni şagird üçün həmişə eyni bölgü", () => {
    const a = assignPilotSkills(math, weakAll, PILOT_SKILLS[2], 2, "student-abc");
    const b = assignPilotSkills(math, weakAll, PILOT_SKILLS[2], 2, "student-abc");
    expect(a).toEqual(b);
  });

  it("fərqli şagirdlər fərqli bölgü alır", () => {
    const a = assignPilotSkills(math, weakAll, PILOT_SKILLS[2], 2, "student-abc");
    const b = assignPilotSkills(math, weakAll, PILOT_SKILLS[2], 2, "student-xyz");
    expect(a.target).not.toEqual(b.target);
  });

  it("hədəf və müqayisə kəsişmir, hədəf sayı sabitdir", () => {
    const a = assignPilotSkills(math, weakAll, PILOT_SKILLS[2], 2, "s1");
    expect(a.target).toHaveLength(TARGET_COUNT);
    expect(a.target.filter((x) => a.comparison.includes(x))).toEqual([]);
  });

  it("yalnız ZƏİF bacarıqlar namizəddir", () => {
    const m = M({ "arith.mul.tables": [40, 6], "arith.div.tables": [95, 20] });
    const a = assignPilotSkills(math, m, PILOT_SKILLS[2], 2, "s1");
    expect([...a.target, ...a.comparison]).toEqual(["arith.mul.tables"]);
  });

  it("materialı çatmayan bacarıq namizəd olmur", () => {
    // 1-ci sinifdə number.place_value 10 tapşırıqdır — dizayndan çıxarılıb.
    const m = M({ "number.place_value": [30, 8] });
    const a = assignPilotSkills(math, m, ["number.place_value"], 1, "s1");
    expect([...a.target, ...a.comparison]).toEqual([]);
  });

  it("seededShuffle elementləri itirmir", () => {
    const src = ["a", "b", "c", "d", "e"];
    expect([...seededShuffle(src, "x")].sort()).toEqual([...src].sort());
  });
});

describe("əsas göstərici — qazanclar fərqi", () => {
  const input = {
    baseline: new Map([["s1", 40], ["s2", 50], ["s3", 45], ["s4", 55]]),
    final: new Map([["s1", 70], ["s2", 74], ["s3", 55], ["s4", 61]]),
  };

  it("orta qazanc doğru hesablanır", () => {
    expect(meanGain(input, ["s1", "s2"])).toBe(27); // (30 + 24) / 2
  });

  it("ölçülməyən bacarıq atılır, sıfır sayılmır", () => {
    expect(meanGain(input, ["s1", "yoxdur"])).toBe(30);
  });

  it("heç bir bacarıq ölçülməyibsə null (sıfır DEYİL)", () => {
    expect(meanGain(input, ["yoxdur"])).toBeNull();
  });

  it("qazanclar fərqi = hədəf qazancı − müqayisə qazancı", () => {
    const d = differenceInGains(input, { target: ["s1", "s2"], comparison: ["s3", "s4"] });
    expect(d).toBe(27 - 8); // 27 − ((10 + 6) / 2)
  });

  it("bir dəst boşdursa şagird əsas analizdən çıxır", () => {
    expect(differenceInGains(input, { target: ["s1"], comparison: [] })).toBeNull();
  });
});
