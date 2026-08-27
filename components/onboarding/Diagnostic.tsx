"use client";

// Onboarding diaqnostik/yerləşdirmə testi — qısa (≤6 sual) yoxlama. Uşaq bir dərsin
// nümunə sualını düz cavablayırsa, həmin dərsi "bilir" sayılır və keçilir; səhv olanlar
// SRS təkrar planına düşür. Nəticə: erkən dərsləri təkrar keçmədən öz səviyyəsindən başlayır.

import { useRef, useState } from "react";
import type { Task } from "@/lib/types";
import { gradeTask, type UserAnswer } from "@/lib/grading";
import TaskInput from "@/components/tasks/TaskInput";
import Mascot from "@/components/Mascot";
import { playCorrect, playWrong } from "@/lib/sound";

export interface DiagnosticItem {
  task: Task;
  lessonId: string;
}
export interface DiagnosticResult {
  knownLessonIds: string[]; // düz cavablanmış (keçiləcək) dərslər
  wrongTaskIds: string[]; // səhv (SRS-ə əlavə olunacaq) tapşırıqlar
}

export default function Diagnostic({
  items,
  onFinish,
}: {
  items: DiagnosticItem[];
  onFinish: (r: DiagnosticResult) => void;
}) {
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<UserAnswer | null>(null);
  const [revealed, setRevealed] = useState(false);
  const knownRef = useRef<string[]>([]);
  const wrongRef = useRef<string[]>([]);

  const cur = items[i];
  const isLast = i === items.length - 1;
  const progress = Math.round(((i + (revealed ? 1 : 0)) / items.length) * 100);

  function check() {
    if (answer == null) return;
    const res = gradeTask(cur.task, answer);
    if (res.correct) {
      playCorrect();
      knownRef.current.push(cur.lessonId);
    } else {
      playWrong();
      wrongRef.current.push(cur.task.id);
    }
    setRevealed(true);
  }

  function next() {
    if (isLast) {
      onFinish({ knownLessonIds: knownRef.current, wrongTaskIds: wrongRef.current });
      return;
    }
    setI((n) => n + 1);
    setAnswer(null);
    setRevealed(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="mx-auto flex w-full max-w-xl items-center gap-4 px-5 py-5">
        <Mascot size={34} mood={revealed ? "celebrate" : "thinking"} />
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-bold text-muted">
          {i + 1}/{items.length}
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-8">
        <h1 className="mt-4 text-center text-xl font-extrabold text-fg sm:text-2xl">
          {cur.task.prompt}
        </h1>

        <div className="mt-8">
          <TaskInput
            key={cur.task.id}
            task={cur.task}
            value={answer}
            onChange={setAnswer}
            disabled={revealed}
            reveal={revealed}
          />
        </div>

        <div className="mt-auto pt-8">
          {!revealed ? (
            <button
              type="button"
              onClick={check}
              disabled={answer == null}
              className="w-full rounded-2xl bg-brand px-5 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Yoxla
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="w-full rounded-2xl bg-emerald-500 px-5 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop btn-pop-green hover:bg-emerald-600"
            >
              {isLast ? "Bitir" : "Növbəti"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
