import { describe, it, expect } from "vitest";
import { publicName } from "@/lib/publicName";
import { botIdentity, SURNAME_INITIALS } from "@/lib/bots";
import { fillStats, niceFloor, SUBJECT_COUNT, EXTRA_SUBJECT_COUNT, LESSONS_SHOWN, LESSON_TOTAL, TASKS_SHOWN, TASK_TOTAL } from "@/lib/siteStats";

describe("uşaq məxfiliyi: başqalarına göstərilən ad", () => {
  it("tam ad → ad + soyadın ilk hərfi", () => {
    expect(publicName("Nilay Hüseynli")).toBe("Nilay H.");
    expect(publicName("  Aysel   məmmədova  ")).toBe("Aysel M.");
    expect(publicName("Elvin Rəşad oğlu Quliyev")).toBe("Elvin R.");
  });
  it("tək söz, boş və artıq qısaldılmış ad", () => {
    expect(publicName("Nigar")).toBe("Nigar");
    expect(publicName("")).toBe("İstifadəçi");
    expect(publicName(null)).toBe("İstifadəçi");
    expect(publicName("Nilay H.")).toBe("Nilay H."); // idempotent (trigger təkrar işləyə bilər)
  });
});

describe("bot pariteti", () => {
  it("botlar da 'Ad S.' formatındadır — real istifadəçidən ayırd edilmir", () => {
    for (let t = 0; t < 5; t++) {
      for (let i = 0; i < 15; i++) {
        const b = botIdentity(t, i, "2026-W47");
        expect(b.name).toMatch(/^\S+ \S\.$/);
        expect(SURNAME_INITIALS).toContain(b.name.split(" ")[1].charAt(0));
        expect(publicName(b.name)).toBe(b.name);
        expect(b.username).not.toContain("."); // istifadəçi adı soyad hərfini daşımır
      }
    }
  });
  it("deterministikdir — eyni həftə eyni bot", () => {
    expect(botIdentity(2, 3, "2026-W47")).toEqual(botIdentity(2, 3, "2026-W47"));
  });
});

describe("saytdakı rəqəmlər (tək mənbə)", () => {
  it("vitrin rəqəmi real saydan böyük deyil və yuvarlaqdır", () => {
    expect(LESSONS_SHOWN).toBeLessThanOrEqual(LESSON_TOTAL);
    expect(TASKS_SHOWN).toBeLessThanOrEqual(TASK_TOTAL);
    expect(niceFloor(666)).toBe(650);
    expect(niceFloor(12036)).toBe(10000);
    expect(niceFloor(7)).toBe(7);
  });
  it("mətnlərdəki yer tutucular dolur", () => {
    expect(fillStats("{subjects} fənn üzrə {lessons}+ dərs, +{extra}")).toBe(
      `${SUBJECT_COUNT} fənn üzrə ${LESSONS_SHOWN}+ dərs, +${EXTRA_SUBJECT_COUNT}`,
    );
    expect(SUBJECT_COUNT).toBeGreaterThan(0);
  });
});
