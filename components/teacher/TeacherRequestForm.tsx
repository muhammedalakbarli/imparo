"use client";

// Müəllimlik müraciəti forması — /muellim-ol və /mekteb/muellim qapısında eyni.
// Sərbəst mətn əvəzinə strukturlu sahələr: admin "bu kimdir?" sualına cavabı
// e-poçt məktubunda dərhal görür (məktəb, fənn, ünvanın təsdiqlənib-təsdiqlənmədiyi).

import { useState } from "react";
import { Send } from "lucide-react";
import { TEACHER_SUBJECTS, submitTeacherRequest } from "@/lib/teacher";
import { track } from "@/lib/analytics";

export default function TeacherRequestForm({ onDone }: { onDone: () => void }) {
  const [school, setSchool] = useState("");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const r = await submitTeacherRequest({ school, subject, note });
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? "Xəta baş verdi.");
      return;
    }
    track("teacher_request_sent", { subject });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <div>
        <label htmlFor="tr-school" className="text-sm font-bold text-fg">
          Məktəb
        </label>
        <input
          id="tr-school"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          placeholder="Məs: Bakı şəhəri 132 nömrəli məktəb"
          maxLength={120}
          autoComplete="organization"
          className="mt-1.5 w-full rounded-2xl border-2 border-line bg-ink px-4 py-3 text-fg outline-none focus:border-brand"
        />
      </div>

      <div>
        <span className="text-sm font-bold text-fg">Fənn</span>
        <div className="mt-1.5 flex flex-wrap gap-2" role="radiogroup" aria-label="Fənn">
          {TEACHER_SUBJECTS.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={subject === s}
              onClick={() => setSubject(s)}
              className={`rounded-2xl border-2 px-3.5 py-2 text-sm font-bold transition-colors ${
                subject === s ? "border-brand bg-brand/10 text-brand" : "border-line text-fg hover:border-brand/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="tr-note" className="text-sm font-bold text-fg">
          Qeyd <span className="font-normal text-muted">(istəyə bağlı)</span>
        </label>
        <textarea
          id="tr-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Məs: 5A və 5B siniflərində, təxminən 50 şagirdlə istifadə etmək istəyirəm"
          rows={2}
          maxLength={500}
          className="mt-1.5 w-full rounded-2xl border-2 border-line bg-ink px-4 py-3 text-fg outline-none focus:border-brand"
        />
      </div>

      {error && <p className="rounded-xl bg-red-500/10 px-3.5 py-2 text-sm font-semibold text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-50"
      >
        <Send size={18} /> {busy ? "Göndərilir…" : "Müraciəti göndər"}
      </button>
    </form>
  );
}
