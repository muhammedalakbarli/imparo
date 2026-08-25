import { describe, it, expect } from "vitest";
import { subjects } from "@/lib/content";
import { SKILLS } from "@/lib/skills";
import {
  diagnosticSkills,
  buildDiagnosticSet,
  targetSkills,
  isWeak,
  tasksForSkill,
  buildAdaptiveSet,
  knowledgeMap,
  WEAK_BELOW,
  MIN_ATTEMPTS,
  type MasteryMap,
} from "@/lib/mastery";

const now = new Date().toISOString();
const M = (rows: Record<string, [number, number]>): MasteryMap =>
  new Map(Object.entries(rows).map(([id, [mastery, attempts]]) => [id, { mastery, attempts, lastSeen: now }]));

describe("zəiflik hökmü", () => {
  it("az cəhddə zəif elan etmir", () => {
    expect(isWeak(M({ "arith.mul.tables": [20, MIN_ATTEMPTS - 1] }), "arith.mul.tables")).toBe(false);
  });
  it("kifayət cəhd + aşağı bal = zəif", () => {
    expect(isWeak(M({ "arith.mul.tables": [WEAK_BELOW - 1, MIN_ATTEMPTS] }), "arith.mul.tables")).toBe(true);
  });
});

describe("geriyə addım (hədəf seçimi)", () => {
  it("prereq də zəifdirsə, məşq PREREQ-dən başlayır", () => {
    // Qalıqlı bölmə zəif, onun kökü olan cədvəl üzrə bölmə də zəif.
    const m = M({ "arith.div.remainder": [40, 6], "arith.div.tables": [35, 8] });
    expect(targetSkills(m)).toContain("arith.div.tables");
    expect(targetSkills(m)).not.toContain("arith.div.remainder");
  });

  it("prereq güclüdürsə, bacarığın özü hədəfdir", () => {
    const m = M({ "arith.div.remainder": [40, 6], "arith.div.tables": [95, 20] });
    expect(targetSkills(m)).toEqual(["arith.div.remainder"]);
  });

  it("zəncir boyu ən dərin zəif kökə enir", () => {
    const m = M({
      "arith.div.multi_digit": [30, 5],
      "arith.div.tables": [40, 5],
      "arith.mul.tables": [25, 9],
    });
    expect(targetSkills(m)[0]).toBe("arith.mul.tables");
  });

  it("güclü bacarıqlar hədəf olmur", () => {
    expect(targetSkills(M({ "arith.add.carry": [92, 30] }))).toEqual([]);
  });
});

describe("tapşırıq seçimi", () => {
  it("bacarığı daşıyan tapşırıqlar tapılır", () => {
    expect(tasksForSkill(subjects, "arith.div.tables").length).toBeGreaterThan(10);
  });

  it("aşağı sinif əvvəl gəlir (asandan başla)", () => {
    // arith.mul.tables 2-ci sinifdən başlayır; seçim 2-ci sinif tapşırığı verməlidir.
    const t = tasksForSkill(subjects, "arith.mul.tables")[0];
    expect(t.id.startsWith("ry2-")).toBe(true);
  });

  it("sinif həddi gözlənilir", () => {
    for (const t of tasksForSkill(subjects, "arith.mul.tables", 2)) expect(t.id.startsWith("ry2-")).toBe(true);
  });

  it("dəstdə təkrar tapşırıq olmur", () => {
    const set = buildAdaptiveSet(subjects, ["arith.mul.tables", "arith.div.tables"], 10);
    expect(set.length).toBe(10);
    expect(new Set(set.map((t) => t.id)).size).toBe(10);
  });

  it("hədəf yoxdursa dəst boşdur", () => {
    expect(buildAdaptiveSet(subjects, [], 10)).toEqual([]);
  });
});

describe("bilik xəritəsi", () => {
  it("sınanmamış bacarıq göstərilmir (0% yanlış təəssürat yaradar)", () => {
    const map = knowledgeMap(M({ "arith.add.carry": [80, 10] }), SKILLS);
    expect([...map.values()].flat().map((r) => r.id)).toEqual(["arith.add.carry"]);
  });
  it("qrup daxilində ən zəif yuxarıda olur", () => {
    const map = knowledgeMap(M({ "arith.add.carry": [80, 10], "arith.sub.borrow": [40, 10] }), SKILLS);
    const list = map.get("Toplama və çıxma")!;
    expect(list[0].id).toBe("arith.sub.borrow");
  });
});

describe("diaqnostika", () => {
  it("sınanmamış bacarıqlar əvvəl ölçülür", () => {
    // arith.add.carry sınanıb, arith.sub.borrow yox → əvvəl sub.borrow gəlməlidir.
    const order = diagnosticSkills(M({ "arith.add.carry": [80, 10] }), SKILLS, 4);
    expect(order.indexOf("arith.sub.borrow")).toBeLessThan(order.indexOf("arith.add.carry"));
  });

  it("şagirdin sinfindən yuxarı bacarıq ölçülmür", () => {
    const ids = diagnosticSkills(new Map(), SKILLS, 2);
    for (const id of ids) expect(SKILLS.find((s) => s.id === id)!.grade).toBeLessThanOrEqual(2);
  });

  it("hədd aşılmır və təkrar sual olmur", () => {
    const set = buildDiagnosticSet(subjects, diagnosticSkills(new Map(), SKILLS, 4), 2, { limit: 20 });
    expect(set.length).toBe(20);
    expect(new Set(set.map((t) => t.id)).size).toBe(20);
  });

  it("tapşırığı olan hər bacarıqdan sual düşür", () => {
    const ids = diagnosticSkills(new Map(), SKILLS, 4)
      .filter((id) => tasksForSkill(subjects, id, 4).length > 0)
      .slice(0, 3);
    const set = buildDiagnosticSet(subjects, ids, 2, { maxGrade: 4 });
    for (const id of ids) expect(set.filter((t) => t.skills?.includes(id)).length).toBeGreaterThanOrEqual(1);
  });

  it("qrafda ölü düyün yoxdur — hər bacarığı ölçən tapşırıq var", () => {
    // Bu test real xəta tutdu: `arith.div.concept` prereq zəncirinin kökü idi,
    // amma heç bir tapşırıq onu ölçmürdü — "geriyə addım" ora çata bilmirdi.
    // Aşağıdakıların məzmunu 5-ci sinifdədir və hələ etiketlənməyib; 5-ci sinif
    // etiketlənəndə bu siyahı boşalmalıdır.
    const NOT_YET_TAGGED = new Set(["number.divisors", "geom.volume"]);
    const empty = SKILLS.filter(
      (s) => !NOT_YET_TAGGED.has(s.id) && tasksForSkill(subjects, s.id).length === 0,
    ).map((s) => s.id);
    expect(empty).toEqual([]);
  });
});
