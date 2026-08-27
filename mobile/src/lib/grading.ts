// Tapşırıq cavab yoxlaması (webdən eyni port).
import type { Task } from "./types";

export type UserAnswer = number | string;
export interface GradeResult {
  correct: boolean;
  earnedXp: number;
}

function normalizeText(v: string): string {
  return v.trim().toLocaleLowerCase("az").replace(/\s+/g, " ");
}
function normalizeSentence(v: string): string {
  return v.trim().toLowerCase().replace(/[.,!?;:]/g, "").replace(/\s+/g, " ");
}

export function gradeTask(task: Task, answer: UserAnswer): GradeResult {
  let correct = false;
  switch (task.type) {
    case "multiple_choice":
      correct = Number(answer) === task.correctIndex;
      break;
    case "fill_blank":
      correct = task.accepted.some((a) => normalizeText(a) === normalizeText(String(answer)));
      break;
    case "numeric": {
      const num = parseFloat(String(answer).replace(",", "."));
      if (!Number.isNaN(num)) correct = Math.abs(num - task.answer) <= (task.tolerance ?? 0);
      break;
    }
    case "word_order":
      correct = normalizeSentence(String(answer)) === normalizeSentence(task.answer);
      break;
    case "listening":
      correct = Number(answer) === task.correctIndex;
      break;
  }
  return { correct, earnedXp: correct ? task.xp : 0 };
}
