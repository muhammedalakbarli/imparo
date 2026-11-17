import { describe, it, expect } from "vitest";
import { fixNumeralSuffixes, suffixFor, lastSpokenWord, withSuffix, sequenceExplanation } from "@/lib/azNumeralSuffix";
import { sequenceHint, taskGrade, isYoungTask } from "@/lib/numberHints";
import { subjects } from "@/lib/content";

describe("ədədin oxunuşunun son sözü", () => {
  it("ahəng son DEYİLƏN sözə görədir", () => {
    expect(lastSpokenWord(6)).toBe("altı");
    expect(lastSpokenWord(16)).toBe("altı");
    expect(lastSpokenWord(40)).toBe("qırx");
    expect(lastSpokenWord(100)).toBe("yüz");
    expect(lastSpokenWord(110)).toBe("on");
    expect(lastSpokenWord(2000)).toBe("min");
    expect(lastSpokenWord(0)).toBe("sıfır");
  });
});

describe("şəkilçi ahəngi", () => {
  const abl: [number, string][] = [[0, "dan"], [1, "dən"], [2, "dən"], [3, "dən"], [4, "dən"], [5, "dən"], [6, "dan"], [7, "dən"], [8, "dən"], [9, "dan"], [10, "dan"], [20, "dən"], [30, "dan"], [40, "dan"], [50, "dən"], [60, "dan"], [70, "dən"], [80, "dən"], [90, "dan"], [100, "dən"], [1000, "dən"]];
  it.each(abl)("%i-%s", (n, s) => expect(suffixFor(n, "abl")).toBe(s));
  it("yönlük: saitlə bitəndə -ya/-yə", () => {
    expect(withSuffix(6, "dat")).toBe("6-ya");
    expect(withSuffix(2, "dat")).toBe("2-yə");
    expect(withSuffix(9, "dat")).toBe("9-a");
    expect(withSuffix(10, "dat")).toBe("10-a");
    expect(withSuffix(3, "dat")).toBe("3-ə");
  });
  it("təsirlik, yiyəlik, xəbərlik, sıra sayı", () => {
    expect(withSuffix(6, "acc")).toBe("6-nı");
    expect(withSuffix(3, "acc")).toBe("3-ü");
    expect(withSuffix(10, "acc")).toBe("10-u");
    expect(withSuffix(6, "gen")).toBe("6-nın");
    expect(withSuffix(4, "gen")).toBe("4-ün");
    expect(withSuffix(3, "pred")).toBe("3-dür");
    expect(withSuffix(36, "pred")).toBe("36-dır");
    expect(withSuffix(9, "ord")).toBe("9-cu");
    expect(withSuffix(2, "ord")).toBe("2-ci");
    expect(withSuffix(100, "ord")).toBe("100-cü");
    expect(withSuffix(40, "ord")).toBe("40-cı");
  });
});

describe("mətndə düzəliş", () => {
  it("səhvləri düzəldir, düzgünlərə toxunmur", () => {
    expect(fixNumeralSuffixes("6-dən sonra hansı ədəd gəlir?")).toBe("6-dan sonra hansı ədəd gəlir?");
    expect(fixNumeralSuffixes("10-dən 3 çıxırıq, 9-dən də")).toBe("10-dan 3 çıxırıq, 9-dan də");
    expect(fixNumeralSuffixes("1-dən 10-a sayma")).toBe("1-dən 10-a sayma");
    expect(fixNumeralSuffixes("5-ci sinif, 3-cü dərs")).toBe("5-ci sinif, 3-cü dərs");
    expect(fixNumeralSuffixes("4 ulduzdan 1-ni götürürük")).toBe("4 ulduzdan 1-i götürürük");
  });
  it("id-lərə, kəsrlərə və tanınmayan şəkilçilərə toxunmur", () => {
    expect(fixNumeralSuffixes("ry2-a ry6-dən")).toBe("ry2-a ry6-dən");
    expect(fixNumeralSuffixes("1/2-yə")).toBe("1/2-yə");
    expect(fixNumeralSuffixes("10-dək say")).toBe("10-dək say");
  });
  it("onluq kəsr və saat: son rəqəm qrupu oxunur", () => {
    expect(fixNumeralSuffixes("2,6-dən böyük")).toBe("2,6-dan böyük");
    expect(fixNumeralSuffixes("10:30-də")).toBe("10:30-da");
  });
  it("BÜTÜN məzmunda səhv şəkilçi qalmayıb", () => {
    const bad: string[] = [];
    const walk = (v: unknown) => {
      if (typeof v === "string") { if (fixNumeralSuffixes(v) !== v) bad.push(v); }
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (k !== "id" && k !== "slug") walk(x);
    };
    subjects.forEach(walk);
    expect(bad).toEqual([]);
  });
});

describe("sıra ilə izah (+ işarəsiz)", () => {
  it("sonra və əvvəl", () => {
    expect(sequenceExplanation("after", 6)).toBe("Sayarkən 6-dan sonra 7 gəlir: 5 → 6 → 7.");
    expect(sequenceExplanation("before", 10)).toBe("Sayarkən 9-dan sonra 10 gəlir: 8 → 9 → 10. Deməli 10-dan əvvəl 9 gəlir.");
    expect(sequenceExplanation("after", 0)).toBe("Sayarkən 0-dan sonra 1 gəlir: 0 → 1.");
    expect(sequenceExplanation("after", 6)).not.toMatch(/[+=]/);
  });
  it("1-ci sinifdə 'sonra/əvvəl' izahlarında + yoxdur", () => {
    const s = subjects.find((x) => x.slug === "riyaziyyat-1")!;
    for (const u of s.units) for (const l of u.lessons) for (const t of [...l.tasks, ...(l.bonusTasks ?? [])])
      if (/^\d+-(?:dan|dən) (?:sonra hansı ədəd gəlir|əvvəl (?:gələn ədəd hansıdır|hansı ədəd gəlir))\?$/.test(t.prompt))
        expect(t.explanation, t.id).not.toMatch(/[+=−]/);
  });
});

describe("ədəd qatarı ipucu — cavabı ələ vermir", () => {
  it("formalar", () => {
    expect(sequenceHint("6-dan sonra hansı ədəd gəlir?")).toEqual([5, 6, null]);
    expect(sequenceHint("8-dən əvvəl hansı ədəd gəlir?")).toEqual([null, 8, 9]);
    expect(sequenceHint("4 və 6-nın arasında hansı ədəd var?")).toEqual([4, null, 6]);
    expect(sequenceHint("6, 7, __, 9 — boş xanaya hansı ədəd gəlir?")).toEqual([6, 7, null, 9]);
    expect(sequenceHint("Neçə alma var?")).toBeNull();
  });
  it("1-ci sinif sayma dərsində cavab qatarda heç vaxt görünmür", () => {
    const l = subjects.find((x) => x.slug === "riyaziyyat-1")!.units[0].lessons[0];
    for (const t of l.tasks) {
      if (t.type !== "numeric") continue;
      const h = sequenceHint(t.prompt);
      if (h) expect(h, t.id).not.toContain(t.answer);
    }
  });
  it("sinif id-dən", () => {
    expect(taskGrade("ry1-sayma-l1-t1")).toBe(1);
    expect(isYoungTask("en2-x")).toBe(true);
    expect(isYoungTask("ry3-x")).toBe(false);
    expect(isYoungTask("ps-vocab-t1")).toBe(false);
  });
});

describe("sayma dərsi müxtəlifdir", () => {
  it("'sonra' sualları dərsin yarısından azdır, sayma/boşluq/arasında/əvvəl var", () => {
    const l = subjects.find((x) => x.slug === "riyaziyyat-1")!.units[0].lessons[0];
    const prompts = l.tasks.map((t) => t.prompt);
    expect(prompts.filter((p) => /sonra hansı ədəd/.test(p)).length).toBeLessThan(l.tasks.length / 2);
    expect(prompts.some((p) => /Neçə .* var\?/.test(p))).toBe(true);
    expect(prompts.some((p) => /__/.test(p))).toBe(true);
    expect(prompts.some((p) => /arasında/.test(p))).toBe(true);
    expect(prompts.some((p) => /əvvəl/.test(p))).toBe(true);
    expect(l.visual).toBe("count-1-10");
  });
});
