"use client";

// Sualla bağlı rəy düyməsi — cavab yoxlandıqdan sonra göstərilir.
// "Problem bildir" → kateqoriya seç + istəyə bağlı mesaj → task_feedback-ə göndər.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, Check } from "lucide-react";
import {
  submitTaskFeedback,
  FEEDBACK_LABELS,
  type FeedbackCategory,
} from "@/lib/feedback";

const CATEGORIES = Object.keys(FEEDBACK_LABELS) as FeedbackCategory[];

export default function QuestionFeedback({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!cat || sending) return;
    setSending(true);
    setError("");
    const res = await submitTaskFeedback(taskId, cat, message);
    setSending(false);
    if (!res.ok) {
      setError(res.error || "Göndərilmədi. Yenidən cəhd et.");
      return;
    }
    setSent(true);
  }

  // Göndərildi → sadə təşəkkür.
  if (sent) {
    return (
      <div
        data-feedback
        className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600"
      >
        <Check size={16} strokeWidth={3} /> Təşəkkürlər! Rəyin bizə çatdı.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        data-feedback
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-fg"
      >
        <Flag size={15} /> Bu sualla bağlı problem?
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        data-feedback
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 rounded-2xl border border-line bg-panel p-4"
      >
        <div className="text-sm font-bold text-fg">Problem nədir?</div>

        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition ${
                cat === c
                  ? "border-brand bg-brand/10 text-brand-soft"
                  : "border-line bg-panel-2 text-muted hover:border-brand"
              }`}
            >
              {FEEDBACK_LABELS[c]}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="İstəsən əlavə izah yaz (istəyə bağlı)…"
          rows={2}
          maxLength={500}
          className="mt-3 w-full resize-none rounded-xl border border-line bg-panel-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-brand"
        />

        {error && <div className="mt-2 text-sm font-medium text-red-500">{error}</div>}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={send}
            disabled={!cat || sending}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "Göndərilir…" : "Göndər"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-2 text-sm font-bold text-muted transition hover:text-fg"
          >
            Ləğv et
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
