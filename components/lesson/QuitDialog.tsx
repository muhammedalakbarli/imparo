"use client";

// Dərsdən çıxış təsdiqi (Duolingo "Wait, don't go!" pəncərəsi).
//
// Niyə lazımdır: `user_progress` yalnız dərs BİTƏNDƏ yazılır — yarımçıq çıxan
// şagird həll etdiyi bütün tapşırıqları itirir. Əvvəl X düyməsi adi link idi,
// yəni səhv toxunuş 10 tapşırıqlıq işi bir anda silirdi, xəbərdarlıq olmadan.
//
// Heç nə həll edilməyibsə dialoq GÖSTƏRİLMİR (bax LessonRunner) — itiriləsi
// bir şey yoxdursa təsdiq soruşmaq sadəcə maneədir.

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Mascot from "@/components/Mascot";
import { useT } from "@/lib/i18n";

export default function QuitDialog({
  answered,
  total,
  onStay,
  onLeave,
}: {
  /** Həll edilmiş tapşırıq sayı — itkini konkretləşdirir. */
  answered: number;
  total: number;
  onStay: () => void;
  onLeave: () => void;
}) {
  const t = useT();
  const stayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Escape = qalmaq. Təsadüfi çıxış riskini artırmamaq üçün Escape ÇIXMIR.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onStay();
      }
    };
    document.addEventListener("keydown", onKey);

    // Fokus təhlükəsiz düymədə başlasın: Enter basan şagird dərsi bitirməsin.
    stayRef.current?.focus();

    // Dialoq açıqkən arxa fon sürüşməsin.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onStay]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quit-title"
    >
      {/* Fon — kliklə bağlanır (qalmaq tərəfinə), Duolingo da belədir */}
      <button
        type="button"
        aria-label={t("run.quitStay")}
        onClick={onStay}
        className="absolute inset-0 cursor-default bg-ink/70 backdrop-blur-sm"
      />

      <motion.div
        className="relative w-full max-w-sm rounded-3xl border border-line bg-panel p-7 text-center shadow-2xl"
        initial={{ scale: 0.9, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 8 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
      >
        <div className="flex justify-center">
          <Mascot size={112} mood="sad" />
        </div>

        <h2 id="quit-title" className="mt-4 text-2xl font-extrabold text-fg">
          {t("run.quitTitle")}
        </h2>
        {/* Hələ cavab yoxdursa "irəliləyişin itəcək" demək YALAN olardı — ayrı mətn. */}
        <p className="mt-2 leading-relaxed text-muted">
          {answered > 0 ? t("run.quitBody") : t("run.quitBodyStart")}
        </p>

        {/* İtki konkret görünsün: "Həll edilib 3 / 15". Sıfırda göstərilmir. */}
        {answered > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-panel-2 px-4 py-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              {t("run.quitProgress")}
            </span>
            <span className="tabular text-base font-extrabold text-brand">
              {answered} / {total}
            </span>
          </div>
        )}

        <button
          ref={stayRef}
          type="button"
          onClick={onStay}
          className="btn-pop mt-6 w-full rounded-2xl bg-brand px-6 py-4 text-base font-extrabold uppercase tracking-wide text-white hover:bg-brand-dark"
        >
          {t("run.quitStay")}
        </button>
        <button
          type="button"
          onClick={onLeave}
          className="mt-3 w-full rounded-2xl px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-muted transition-colors hover:text-red-500"
        >
          {t("run.quitLeave")}
        </button>
      </motion.div>
    </motion.div>
  );
}
