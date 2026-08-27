import { describe, it, expect } from "vitest";
import { gradeTask } from "@/lib/grading";
import type { MatchPairsTask } from "@/lib/types";

const task: MatchPairsTask = {
  id: "t1",
  type: "match_pairs",
  prompt: "Rəqəmi şəkillə birləşdir",
  xp: 10,
  pairs: [
    { left: "1", right: "🍎" },
    { left: "2", right: "🍎🍎" },
    { left: "3", right: "🍎🍎🍎" },
  ],
};

describe("match_pairs qiymətləndirmə", () => {
  it("hər sol öz cütünə bağlananda doğrudur", () => {
    expect(gradeTask(task, "0,1,2").correct).toBe(true);
  });

  it("bir cüt səhv olsa bütöv cavab səhvdir — qismən doğru sayılmır", () => {
    expect(gradeTask(task, "0,2,1").correct).toBe(false);
  });

  it("natamam cavab doğru sayılmır", () => {
    expect(gradeTask(task, "0,1").correct).toBe(false);
  });

  it("doğru cavabda tam XP verilir, səhvdə sıfır", () => {
    expect(gradeTask(task, "0,1,2").earnedXp).toBe(10);
    expect(gradeTask(task, "1,0,2").earnedXp).toBe(0);
  });

  it("boş cavab doğru sayılmır", () => {
    expect(gradeTask(task, "").correct).toBe(false);
  });
});
