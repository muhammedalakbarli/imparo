"use client";

// Onboarding ekranlarının ortaq hissələri — Zefi dialoqu, sual ekranı, davam düyməsi.
// Duolingo modeli: Zefi əvvəl mərkəzdə salamlaşır, sual mərhələsində isə sol küncə
// çəkilir və şagirdin diqqəti suala keçir.

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import Mascot, { type MascotMood } from "@/components/Mascot";

/** Zefi + danışıq balonu — dialoq ekranları üçün (mərkəzdə, böyük). */
export function ZefiSay({
  text,
  mood = "wave",
  children,
}: {
  text: ReactNode;
  mood?: MascotMood;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
      <div className="flex items-end gap-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
        >
          <Mascot size={150} mood={mood} />
        </motion.div>
        <motion.div
          initial={{ x: -12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="relative mb-6 max-w-xs rounded-3xl border-2 border-line bg-panel px-5 py-4 text-lg font-bold text-fg"
        >
          {text}
          {/* Balonun quyruğu — Zefi tərəfə */}
          <span className="absolute -left-2 bottom-5 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-panel" />
        </motion.div>
      </div>
      {children}
    </div>
  );
}

/** Sual ekranı — Zefi sol yuxarı küncdə kiçik, sual və variantlar altda. */
export function QuestionScreen({
  question,
  children,
}: {
  question: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-4 flex items-start gap-3">
        <Mascot size={72} mood="thinking" />
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex-1 text-xl font-extrabold text-fg sm:text-2xl"
        >
          {question}
        </motion.h1>
      </div>
      <div className="mt-7 flex flex-col gap-3">{children}</div>
    </div>
  );
}

/** Seçim düyməsi — sual ekranlarında istifadə olunur. */
export function ChoiceButton({
  label,
  note,
  selected,
  onClick,
}: {
  label: string;
  note?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-pop flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition ${
        selected
          ? "border-brand bg-brand/10 [--pop:var(--color-brand)]"
          : "border-line bg-panel btn-pop-ghost hover:border-brand"
      }`}
    >
      <span className="text-lg font-bold text-fg">{label}</span>
      {note && (
        <span className={`text-sm font-semibold ${selected ? "text-brand" : "text-muted"}`}>
          {note}
        </span>
      )}
    </button>
  );
}

/** Səhifənin altındakı sabit "Davam et" zolağı. */
export function ContinueBar({
  onClick,
  disabled,
  label = "Davam et",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="mt-auto pt-8">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full rounded-2xl bg-brand px-5 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {label}
      </button>
    </div>
  );
}
