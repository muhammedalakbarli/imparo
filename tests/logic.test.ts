import { describe, it, expect } from "vitest";
import { subjects } from "@/lib/content";
import { subjectMeta } from "@/lib/subjectMeta";
import {
  formatDuration,
  accuracy,
  hasActivity,
  renderReportEmail,
  reportLinks,
  type ReportData,
} from "@/lib/parentReport";
import { gradeTask } from "@/lib/grading";
import { levelFromXp } from "@/lib/levels";
import { weekKey } from "@/lib/leaderboard";
import { monthlyBadgeTier, monthKey } from "@/lib/monthly";
import { todaysQuests, questValue, isQuestDone } from "@/lib/quests";
import {
  scheduleCorrect,
  scheduleWrong,
  upsertWrong,
  applyCorrect,
  dueItems,
  migrateFromMistakes,
  INTERVALS_DAYS,
  MAX_BOX,
  type SrsItem,
} from "@/lib/srs";
import type {
  MultipleChoiceTask,
  FillBlankTask,
  NumericTask,
} from "@/lib/types";

// ── grading ──
describe("gradeTask", () => {
  const mc: MultipleChoiceTask = {
    id: "t", type: "multiple_choice", prompt: "?", xp: 10,
    options: ["a", "b", "c"], correctIndex: 1,
  };
  it("çoxseçimli: düz indeks", () => {
    expect(gradeTask(mc, 1)).toEqual({ correct: true, earnedXp: 10 });
    expect(gradeTask(mc, 0)).toEqual({ correct: false, earnedXp: 0 });
  });

  const fb: FillBlankTask = {
    id: "t", type: "fill_blank", prompt: "?", xp: 10, accepted: ["Saymaq", "say"],
  };
  it("boşluq: böyük/kiçik hərf və boşluqdan asılı deyil", () => {
    expect(gradeTask(fb, "saymaq").correct).toBe(true);
    expect(gradeTask(fb, "  SAYMAQ  ").correct).toBe(true);
    expect(gradeTask(fb, "yox").correct).toBe(false);
  });

  const num: NumericTask = { id: "t", type: "numeric", prompt: "?", xp: 10, answer: 1000 };
  it("rəqəm: vergül/nöqtə və dəqiq cavab", () => {
    expect(gradeTask(num, "1000").correct).toBe(true);
    expect(gradeTask(num, "1000,0").correct).toBe(true);
    expect(gradeTask(num, "999").correct).toBe(false);
  });
  it("rəqəm: tolerans", () => {
    const t: NumericTask = { ...num, answer: 3.14, tolerance: 0.01 };
    expect(gradeTask(t, "3.15").correct).toBe(true);
    expect(gradeTask(t, "3.2").correct).toBe(false);
  });
});

// ── levels ──
describe("levelFromXp", () => {
  it("kumulyativ sərhədlər: L1=0, L2=100, L3=300, L5=1000", () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(299).level).toBe(2);
    expect(levelFromXp(300).level).toBe(3);
    expect(levelFromXp(1000).level).toBe(5);
  });
  it("mənfi/pozuq XP təhlükəsiz", () => {
    expect(levelFromXp(-50).level).toBe(1);
    expect(levelFromXp(NaN).level).toBe(1);
  });
  it("progress 0..1 arasında", () => {
    const info = levelFromXp(150); // L2, xpInLevel=50, xpForNext=200
    expect(info.level).toBe(2);
    expect(info.xpForNext).toBe(200);
    expect(info.progress).toBeCloseTo(0.25, 5);
  });
});

// ── weekKey ──
describe("weekKey", () => {
  it("ISO həftə formatı YYYY-Www", () => {
    expect(weekKey(new Date("2026-07-20"))).toMatch(/^\d{4}-W\d{2}$/);
  });
  it("eyni həftədəki günlər eyni açar", () => {
    const a = weekKey(new Date("2026-07-20")); // bazar ertəsi
    const b = weekKey(new Date("2026-07-24")); // cümə
    expect(a).toBe(b);
  });
});

// ── monthly ──
describe("monthlyBadgeTier", () => {
  it("pillələr 0/1/2/3", () => {
    expect(monthlyBadgeTier(0)).toBe(0);
    expect(monthlyBadgeTier(49)).toBe(0);
    expect(monthlyBadgeTier(50)).toBe(1);
    expect(monthlyBadgeTier(200)).toBe(2);
    expect(monthlyBadgeTier(500)).toBe(3);
    expect(monthlyBadgeTier(9999)).toBe(3);
  });
  it("monthKey formatı YYYY-MM", () => {
    expect(monthKey(new Date("2026-07-20"))).toMatch(/^\d{4}-\d{2}$/);
  });
});

// ── quests ──
describe("todaysQuests", () => {
  it("hər gün 3 quest, deterministik", () => {
    const q1 = todaysQuests("2026-07-20");
    const q2 = todaysQuests("2026-07-20");
    expect(q1).toHaveLength(3);
    expect(q1.map((q) => q.id)).toEqual(q2.map((q) => q.id));
  });
  it("questValue və isQuestDone", () => {
    const state = { date: "2026-07-20", xp: 25, lessons: 1, correct: 3, claimed: [], chestOpened: false };
    expect(questValue(state, "xp")).toBe(25);
    const q = { id: "xp20", kind: "xp" as const, goal: 20, rewardXp: 10, labelKey: "quest.xp" };
    expect(isQuestDone(state, q)).toBe(true);
    expect(isQuestDone({ ...state, xp: 10 }, q)).toBe(false);
  });
});

// ── SRS (aralıqlı təkrar) ──
describe("srs", () => {
  const DAY = 86_400_000;
  const now = 1_700_000_000_000;

  it("səhv → box 0, dərhal due", () => {
    expect(scheduleWrong("t1", now)).toEqual({ id: "t1", box: 0, dueAt: now });
  });

  it("düz cavab qutunu irəli aparır və dueAt-i gələcəyə qoyur", () => {
    const item: SrsItem = { id: "t1", box: 0, dueAt: now };
    const next = scheduleCorrect(item, now);
    expect(next.box).toBe(1);
    expect(next.dueAt).toBe(now + INTERVALS_DAYS[1] * DAY);
    // ardıcıl düz cavablar qutunu artırır
    expect(scheduleCorrect(next, now).box).toBe(2);
  });

  it("box MAX_BOX-dan yuxarı qalxmır", () => {
    const maxed: SrsItem = { id: "t1", box: MAX_BOX, dueAt: now };
    expect(scheduleCorrect(maxed, now).box).toBe(MAX_BOX);
  });

  it("upsertWrong mövcud item-i sıfırlayır (dublikat yaratmır)", () => {
    const items: SrsItem[] = [{ id: "t1", box: 3, dueAt: now + 10 * DAY }];
    const out = upsertWrong(items, "t1", now);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ id: "t1", box: 0, dueAt: now });
  });

  it("applyCorrect MAX_BOX-da item-i mənimsənilmiş kimi çıxarır", () => {
    const items: SrsItem[] = [{ id: "t1", box: MAX_BOX, dueAt: now }];
    expect(applyCorrect(items, "t1", now)).toHaveLength(0);
  });

  it("dueItems yalnız vaxtı çatanları, erkəndən sıralı qaytarır", () => {
    const items: SrsItem[] = [
      { id: "gec", box: 2, dueAt: now + DAY },
      { id: "due2", box: 0, dueAt: now - 100 },
      { id: "due1", box: 0, dueAt: now - 200 },
    ];
    expect(dueItems(items, now).map((i) => i.id)).toEqual(["due1", "due2"]);
  });

  it("migrateFromMistakes köhnə siyahını due itemlərə çevirir", () => {
    const out = migrateFromMistakes(["a", "b"], now);
    expect(out).toEqual([
      { id: "a", box: 0, dueAt: now },
      { id: "b", box: 0, dueAt: now },
    ]);
  });
});

// ── lib/subjectMeta sinxronluğu ──────────────────────────────────────────────
// subjectMeta lib/content-dən avtomatik yaradılır və Worker paketini kiçik
// saxlamaq üçün var. Məzmun dəyişib skript işlədilməsə, sitemap və fənn
// səhifələrinin başlıqları köhnə qalacaqdı — bu test onu tutur.
describe("subjectMeta", () => {
  it("lib/content ilə eynidir (dəyişibsə: npx tsx scripts/gen-subject-meta.ts)", () => {
    const expected = subjects.map((s) => ({
      slug: s.slug,
      name: s.name,
      grade: s.grade,
      units: s.units.length,
      lessons: s.units.reduce((n, u) => n + u.lessons.length, 0),
    }));
    expect(subjectMeta).toEqual(expected);
  });
});

// ── Valideyn hesabatı ────────────────────────────────────────────────────────
describe("parentReport", () => {
  const base: ReportData = {
    from: "2026-08-16T20:00:00.000Z",
    to: "2026-08-23T20:00:00.000Z",
    child: "Məhəmməd",
    grade: 5,
    streak: 4,
    seconds: 8040,
    tasks: 84,
    correct: 63,
    activeDays: 5,
    lessons: 17,
    subjects: [{ name: "Riyaziyyat", pct: 72, tasks: 50 }],
    improved: { subject: "Riyaziyyat", delta: 8 },
    weakest: { unit: "Kəsrlər", pct: 41 },
  };

  it("müddəti azərbaycanca yuvarlaqlaşdırır", () => {
    expect(formatDuration(0)).toBe("0 dəqiqə");
    expect(formatDuration(90)).toBe("2 dəqiqə"); // 1.5 dəq → yuvarlaqlaşır
    expect(formatDuration(3600)).toBe("1 saat"); // tam saatda "0 dəqiqə" yazılmır
    expect(formatDuration(8040)).toBe("2 saat 14 dəqiqə");
  });

  it("doğruluq faizini hesablayır, sıfır bölməyə düşmür", () => {
    expect(accuracy(base)).toBe(75);
    expect(accuracy({ ...base, tasks: 0, correct: 0 })).toBe(0);
  });

  it("fəaliyyəti dərsə VƏ tapşırığa görə ölçür", () => {
    expect(hasActivity(base)).toBe(true);
    expect(hasActivity({ ...base, tasks: 0, correct: 0, lessons: 3 })).toBe(true);
    expect(hasActivity({ ...base, tasks: 0, correct: 0, lessons: 0 })).toBe(false);
  });

  it("məktubda uşağın adını HTML-ə qaçırır (XSS)", () => {
    const evil = { ...base, child: '<img src=x onerror="alert(1)">' };
    const mail = renderReportEmail(evil, { viewUrl: "https://x/v", unsubUrl: "https://x/u" });
    expect(mail.html).not.toContain("<img src=x");
    expect(mail.html).toContain("&lt;img src=x");
  });

  it("fəaliyyət olmayanda da məktub qurulur və imtina linki qalır", () => {
    const quiet = { ...base, tasks: 0, correct: 0, lessons: 0, seconds: 0, subjects: [] };
    const mail = renderReportEmail(quiet, { viewUrl: "https://x/v", unsubUrl: "https://x/u" });
    expect(mail.html).toContain("məşq etmədi");
    expect(mail.html).toContain("https://x/u");
    expect(mail.text).toContain("https://x/u");
  });

  it("hesabat linklərini tokenlərdən qurur", () => {
    const l = reportLinks("VVV", "UUU");
    expect(l.viewUrl).toContain("/hesabat/VVV");
    expect(l.unsubUrl).toContain("token=UUU");
    // İki token AYRIDIR: hesabat linki paylaşılsa da imtina edilə bilməməlidir.
    expect(l.viewUrl).not.toContain("UUU");
  });
});
