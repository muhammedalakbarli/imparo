"use client";

// Kiçik siniflər (1–2) üçün rəqəm cavabı: klaviatura açılmır, ekranda böyük 3D düymələr.
//   • Cavab 0–10 arasıdırsa: 0…10 kartları — bir toxunuşla seçilir (1-ci sinif sayma).
//   • Daha böyükdürsə: rəqəm klaviaturası (1–9, 0, sil).
// Kartların sayı cavabdan asılı DEYİL (həmişə 0–10), ona görə cavabı ələ vermir.
// Kompüterdə fiziki klaviatura da işləyir.

import { useEffect } from "react";
import { Delete } from "lucide-react";
import { playSelect } from "@/lib/sound";

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  reveal?: boolean;
  correct: number;
}

const KEY =
  "flex h-16 items-center justify-center rounded-2xl border-2 text-3xl font-extrabold transition active:translate-y-[3px] disabled:active:translate-y-0";

export default function NumberPad({ value, onChange, disabled, reveal, correct }: Props) {
  const tiles = Number.isInteger(correct) && correct >= 0 && correct <= 10;
  const max = tiles ? 2 : 4;

  const press = (d: string) => {
    if (disabled) return;
    playSelect();
    if (tiles) return onChange(d);
    if (value.length >= max) return;
    onChange(value === "0" ? d : value + d);
  };
  const back = () => !disabled && onChange(value.slice(0, -1));

  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) {
        if (tiles) {
          // "1" sonra "0" → 10 (yalnız kartlar rejimində)
          onChange(value === "1" && e.key === "0" ? "10" : e.key);
        } else if (value.length < max) onChange(value === "0" ? e.key : value + e.key);
      } else if (e.key === "Backspace") onChange(value.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, tiles, value, max, onChange]);

  const isRight = reveal && Number(value) === correct;
  const shown = (
    <div
      className={`mx-auto mb-5 flex h-20 w-36 items-center justify-center rounded-3xl border-[3px] text-5xl font-extrabold ${
        reveal
          ? isRight
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
            : "border-red-500 bg-red-500/10 text-red-500"
          : value
            ? "border-brand bg-card text-fg"
            : "border-dashed border-line bg-card text-muted"
      }`}
      aria-live="polite"
    >
      {value || "?"}
    </div>
  );

  if (tiles) {
    return (
      <div>
        {shown}
        <div className="mx-auto grid max-w-sm grid-cols-4 gap-2.5">
          {Array.from({ length: 11 }, (_, n) => String(n)).map((d) => {
            const on = value === d;
            return (
              <button
                key={d}
                type="button"
                disabled={disabled}
                onClick={() => press(d)}
                className={`${KEY} ${
                  on
                    ? "border-brand bg-brand text-white shadow-[0_4px_0_0_var(--color-brand-dark)]"
                    : "border-line bg-card text-fg shadow-[0_4px_0_0_var(--color-line)] hover:border-brand/50"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {shown}
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-2.5">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => press(d)}
            className={`${KEY} border-line bg-card text-fg shadow-[0_4px_0_0_var(--color-line)] hover:border-brand/50`}
          >
            {d}
          </button>
        ))}
        <span />
        <button
          type="button"
          disabled={disabled}
          onClick={() => press("0")}
          className={`${KEY} border-line bg-card text-fg shadow-[0_4px_0_0_var(--color-line)] hover:border-brand/50`}
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={back}
          aria-label="Sil"
          className={`${KEY} border-line bg-panel-2 text-muted shadow-[0_4px_0_0_var(--color-line)]`}
        >
          <Delete size={26} />
        </button>
      </div>
    </div>
  );
}
