// Tapşırıq cavablarını yoxlayan tək mərkəzi funksiya.
// Hər yeni tapşırıq tipi bura bir case kimi əlavə olunur.

import type { Task } from "./types";

// İstifadəçinin cavabı: multiple_choice üçün seçilmiş indeks (number),
// fill_blank üçün mətn (string), numeric üçün mətn/rəqəm (string).
export type UserAnswer = number | string;

export interface GradeResult {
  correct: boolean;
  earnedXp: number;
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase("az").replace(/\s+/g, " ");
}

// Cümlə müqayisəsi — söz sırasını qoruyur, amma durğu işarələrini və hərf
// böyüklüyünü nəzərə almır (İngilis cümlə qurma məşqi üçün).
function normalizeSentence(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ");
}

export function gradeTask(task: Task, answer: UserAnswer): GradeResult {
  let correct = false;

  switch (task.type) {
    case "multiple_choice":
      correct = Number(answer) === task.correctIndex;
      break;

    case "fill_blank":
      correct = task.accepted.some(
        (a) => normalizeText(a) === normalizeText(String(answer))
      );
      break;

    case "numeric": {
      const num = parseFloat(String(answer).replace(",", "."));
      if (!Number.isNaN(num)) {
        const tolerance = task.tolerance ?? 0;
        correct = Math.abs(num - task.answer) <= tolerance;
      }
      break;
    }

    case "word_order":
      correct = normalizeSentence(String(answer)) === normalizeSentence(task.answer);
      break;

    case "listening":
      correct = Number(answer) === task.correctIndex;
      break;

    // Cavab formatı: hər sol element üçün seçilmiş sağ elementin ƏSL indeksi,
    // sol sıra ilə vergüllə ayrılmış — məs. "2,0,1".
    // `pairs` sırası düzgün cavab olduğuna görə doğru cavab "0,1,2,..."-dir.
    // Qismən doğru sayılmır: uşaq bütün cütləri tapmalıdır.
    case "match_pairs": {
      const picked = String(answer).split(",");
      correct =
        picked.length === task.pairs.length &&
        picked.every((v, i) => Number(v) === i);
      break;
    }
  }

  return { correct, earnedXp: correct ? task.xp : 0 };
}
