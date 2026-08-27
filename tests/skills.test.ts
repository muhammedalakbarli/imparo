import { describe, it, expect } from "vitest";
import { subjects } from "@/lib/content";
import { SKILLS, getSkill, allPrereqs, validateGraph } from "@/lib/skills";

describe("bacarıq qrafı", () => {
  it("naməlum prereq və dövr yoxdur", () => {
    expect(validateGraph()).toEqual([]);
  });

  it("ID-lər təkrarlanmır", () => {
    const ids = SKILLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ID formatı sabitdir (kiçik latın, nöqtə ilə)", () => {
    for (const s of SKILLS) expect(s.id).toMatch(/^[a-z]+(\.[a-z_]+){1,2}$/);
  });

  it("prereq həmişə eyni və ya aşağı sinifdəndir", () => {
    // Şagird 4-cü sinif bacarığını 2-ci sinif bacarığından əvvəl öyrənə bilməz.
    for (const s of SKILLS)
      for (const p of s.prereqs) {
        const pre = getSkill(p)!;
        expect(pre.grade, `${s.id} (${s.grade}) ← ${p} (${pre.grade})`).toBeLessThanOrEqual(s.grade);
      }
  });
});

describe("tapşırıq etiketləri", () => {
  const tagged = subjects.flatMap((s) =>
    s.units.flatMap((u) =>
      u.lessons.flatMap((l) => [...l.tasks, ...(l.bonusTasks ?? [])].filter((t) => t.skills?.length)),
    ),
  );

  it("etiketlənmiş tapşırıq var", () => {
    expect(tagged.length).toBeGreaterThan(1000);
  });

  it("hər etiket qrafda mövcuddur", () => {
    // Bu test qrafdan bacarıq silinəndə və ya ID dəyişdiriləndə düşür — məhz buna görə var:
    // etiket qrafa bağlanmasa, həmin cəhdlər mastery hesabından səssizcə düşür.
    const bad = new Set<string>();
    for (const t of tagged) for (const id of t.skills!) if (!getSkill(id)) bad.add(id);
    expect([...bad]).toEqual([]);
  });

  it("etiketlər təkrarlanmır", () => {
    for (const t of tagged) expect(new Set(t.skills).size, t.id).toBe(t.skills!.length);
  });
});

describe("prereq zənciri", () => {
  it("çoxrəqəmli bölmə vurma cədvəlinə söykənir", () => {
    expect(allPrereqs("arith.div.multi_digit")).toContain("arith.mul.tables");
  });
});
