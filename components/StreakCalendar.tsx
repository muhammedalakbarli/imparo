"use client";

// Streak təqvimi (Duolingo üslubu) — streak çipinə basılanda açılan modal.
// Ay üzrə şəbəkə: dərs tamamlanan günlər alov ilə işarələnir, bugün halqa ilə.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS_AZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];
// Həftə bazar ertəsindən başlayır (Duolingo kimi).
const WEEKDAYS_AZ = ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function dayKey(y: number, m0: number, d: number): string {
  return `${y}-${pad(m0 + 1)}-${pad(d)}`;
}
// Bugün (Asia/Baku) — "YYYY-MM-DD".
function bakuToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Baku" });
}

interface Props {
  streakDays: number;
  activeDays: string[]; // "YYYY-MM-DD" siyahısı
  onClose: () => void;
}

export default function StreakCalendar({ streakDays, activeDays, onClose }: Props) {
  const active = new Set(activeDays);
  const today = bakuToday();
  const [ty, tm] = [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1];
  const [view, setView] = useState({ y: ty, m: tm }); // baxılan ay

  const first = new Date(view.y, view.m, 1);
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // bazar ertəsi = 0
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Növbəti aya keçidi cari aydan o tərəfə bağla.
  const canNext = view.y < ty || (view.y === ty && view.m < tm);

  function shift(delta: number) {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-label="Streak təqvimi"
          className="w-full max-w-sm rounded-3xl border border-line bg-panel p-5 shadow-xl"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Başlıq */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <Flame size={32} className="text-orange-500" />
              <div className="leading-tight">
                <div className="text-2xl font-extrabold text-fg">{streakDays}</div>
                <div className="text-xs text-muted">günlük seriya</div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Bağla"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-line/40"
            >
              <X size={18} />
            </button>
          </div>

          {/* Ay naviqasiyası */}
          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              aria-label="Əvvəlki ay"
              onClick={() => shift(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-fg transition hover:bg-line/40"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-fg">
              {MONTHS_AZ[view.m]} {view.y}
            </span>
            <button
              type="button"
              aria-label="Növbəti ay"
              disabled={!canNext}
              onClick={() => canNext && shift(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-fg transition hover:bg-line/40 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Həftə başlıqları */}
          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS_AZ.map((w) => (
              <div key={w} className="text-[11px] font-semibold text-muted">
                {w}
              </div>
            ))}
          </div>

          {/* Günlər */}
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const key = dayKey(view.y, view.m, d);
              const isActive = active.has(key);
              const isToday = key === today;
              return (
                <div key={key} className="flex aspect-square items-center justify-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      isActive
                        ? "bg-orange-500 text-white"
                        : "text-fg"
                    } ${isToday ? "ring-2 ring-brand ring-offset-1 ring-offset-panel" : ""}`}
                  >
                    {isActive ? <Flame size={16} /> : d}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            Alovlu günlər — dərs tamamladığın günlərdir. Hər gün bir dərs et, seriyanı qoru! 🔥
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
