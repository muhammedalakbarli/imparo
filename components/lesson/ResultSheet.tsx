"use client";

// Duolingo imzalı "nəticə lövhəsi" — cavab yoxlananda aşağıdan qalxır.
// Düzgün → yaşıl "Əla!"; səhv → qırmızı "Düzgün cavab: …". Böyük Zefi + DAVAM ET.

import { motion } from "framer-motion";
import { Check, X, Lightbulb } from "lucide-react";
import Mascot from "@/components/Mascot";
import QuestionFeedback from "@/components/lesson/QuestionFeedback";
import { useT } from "@/lib/i18n";

// Nəticə lövhəsindəki kiçik konfeti (sabit mövqe/rəng — render başına stabil).
const CONF_COLORS = ["#ff9500", "#5b4bf5", "#22c55e", "#ff4d6d", "#f5c518", "#38bdf8"];
const CONFETTI = Array.from({ length: 10 }, (_, i) => ({
  left: i * 10 + 4,
  delay: (i % 5) * 0.05,
  color: CONF_COLORS[i % CONF_COLORS.length],
}));

interface Props {
  correct: boolean;
  correctText?: string; // səhv olduqda düzgün cavab
  /** Bu sualın cavabı NİYƏ belədir (task.explanation). Yoxdursa blok göstərilmir. */
  explanation?: string;
  comboBonus?: number;
  ctaLabel: string;
  taskId: string; // sualla bağlı rəy üçün
  onContinue: () => void;
}

export default function ResultSheet({
  correct,
  correctText,
  explanation,
  comboBonus = 0,
  ctaLabel,
  taskId,
  onContinue,
}: Props) {
  const t = useT();

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className={`fixed inset-x-0 bottom-0 z-40 border-t-2 ${
        correct
          ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10"
          : "border-red-400/40 bg-red-50 dark:bg-red-500/10"
      }`}
    >
      {/* Zefi lövhənin üstündən boylanır — böyük, ayrıca (ikonun yanında sıxışmır) */}
      <div className="pointer-events-none absolute -top-[68px] right-4 z-10 sm:right-8">
        <Mascot
          size={100}
          mood={correct ? (comboBonus > 0 ? "love" : "celebrate") : "sad"}
          animate={correct}
        />
      </div>
      <div className="mx-auto max-w-xl px-4 py-5">
       <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Kiçik uğuru qeyd et — düzgün cavabda konfeti yağır */}
        {correct && (
          <div aria-hidden className="pointer-events-none absolute -top-2 left-4 h-0 w-40 overflow-visible">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className="confetti-piece"
                style={{ left: `${c.left}%`, backgroundColor: c.color, animationDelay: `${c.delay}s` }}
              />
            ))}
          </div>
        )}
        <motion.div
          initial={{ scale: 0.5, rotate: correct ? -12 : 0 }}
          animate={
            correct ? { scale: 1, rotate: 0, y: [0, -10, 0] } : { scale: 1, x: [0, -6, 6, 0] }
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-center gap-3"
        >
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${correct ? "pop-in" : "shake-x"} ${
              correct ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {correct ? <Check size={26} strokeWidth={3.5} /> : <X size={26} strokeWidth={3.5} />}
          </span>
        </motion.div>

        <div className="flex-1">
          <div
            className={`font-display text-xl font-bold ${
              correct ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {correct ? t("cel.great") : t("cel.answerWas")}
          </div>
          {!correct && correctText && (
            <div className="mt-0.5 font-bold text-fg">{correctText}</div>
          )}
          {correct && comboBonus > 0 && (
            <div className="xp-pop mt-0.5 inline-block text-sm font-extrabold text-orange-500">
              🔥 +{comboBonus} XP combo!
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className={`w-full shrink-0 rounded-2xl px-8 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop sm:w-auto ${
            correct
              ? "bg-emerald-500 btn-pop-green hover:bg-emerald-600"
              : "bg-red-500 btn-pop-red hover:bg-red-600"
          }`}
        >
          {ctaLabel}
        </button>
       </div>

        {/* İzah — sualın cavabı niyə belədir. Tam enində, çünki mətn cümlədir;
            yuxarıdakı sətrə sıxışdırılsa düymə ilə dartışıb oxunmaz olur. */}
        {explanation && (
          <div
            className={`mt-3 flex gap-2.5 rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              correct
                ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                : "bg-red-500/10 text-red-900 dark:text-red-100"
            }`}
          >
            <Lightbulb size={17} className="mt-0.5 shrink-0 opacity-70" />
            <span>{explanation}</span>
          </div>
        )}

        <QuestionFeedback key={taskId} taskId={taskId} />
      </div>
    </motion.div>
  );
}
