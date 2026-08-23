"use client";

// Tapşırıq tipini alıb uyğun giriş sahəsini göstərir.
// Çoxseçimli: böyük 3D "tile"-lar; reveal=true olduqda düz/səhv rəngi ilə canlanır.
// Dil öyrənmə tipləri: listening (dinlə-seç), word_order (cümlə quran).

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { Task } from "@/lib/types";
import type { UserAnswer } from "@/lib/grading";
import { playSelect } from "@/lib/sound";
import { speakEnglish, preloadEnglish, spokenTextsOf } from "@/lib/tts";

interface Props {
  task: Task;
  value: UserAnswer | null;
  onChange: (value: UserAnswer) => void;
  disabled: boolean;
  reveal?: boolean; // yoxlanıldıqdan sonra düz/səhv göstər
}

export default function TaskInput({ task, value, onChange, disabled, reveal }: Props) {
  // Səsləndiriləcək mətnləri tapşırıq ekrana gələn kimi ÖNCƏDƏN yüklə.
  // Əvvəl audio yalnız klikdən sonra yüklənirdi və səs 0.3–0.7 saniyə gecikirdi —
  // şagird üçün düymə ilə səs arasındakı əlaqə itirdi. Bax lib/tts.ts.
  useEffect(() => {
    preloadEnglish(spokenTextsOf(task));
  }, [task]);

  // ── Çoxseçimli ─────────────────────────────────────────────
  if (task.type === "multiple_choice") {
    return (
      <ChoiceGrid
        options={task.options}
        correctIndex={task.correctIndex}
        value={typeof value === "number" ? value : null}
        onChange={onChange}
        disabled={disabled}
        reveal={!!reveal}
        speakOptions={task.speakOptions}
      />
    );
  }

  // ── Dinləmə (dinlə və seç) ─────────────────────────────────
  if (task.type === "listening") {
    return (
      <div>
        <button
          type="button"
          onClick={() => speakEnglish(task.audioText)}
          className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-brand px-5 py-5 text-lg font-extrabold text-white shadow-[0_4px_0_0_rgba(0,0,0,0.15)] active:scale-[0.98]"
        >
          <Volume2 size={24} /> Dinlə
        </button>
        <ChoiceGrid
          options={task.options}
          correctIndex={task.correctIndex}
          value={typeof value === "number" ? value : null}
          onChange={onChange}
          disabled={disabled}
          reveal={!!reveal}
        />
      </div>
    );
  }

  // ── Cümlə quran (word_order) ───────────────────────────────
  if (task.type === "word_order") {
    return (
      <WordOrderInput
        key={task.id}
        words={task.words}
        translation={task.translation}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  // ── Mətn cavabı (fill_blank / numeric) ─────────────────────
  return (
    <input
      type="text"
      inputMode={task.type === "numeric" ? "decimal" : "text"}
      value={value === null ? "" : String(value)}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Cavabını yaz..."
      className={`w-full rounded-2xl border-2 bg-panel px-5 py-4 text-lg font-bold text-fg
        shadow-[0_4px_0_0_var(--color-line)] placeholder:font-medium placeholder:text-muted
        focus:outline-none disabled:opacity-90 ${
          reveal ? "border-line" : "border-line focus:border-brand"
        }`}
    />
  );
}

// Çoxseçimli variant şəbəkəsi (multiple_choice + listening ortaq istifadə edir).
// Sıra qorunur (correctIndex sabit mövqedir).
// speakOptions=true → variant İngilis sözdür, seçiləndə avtomatik səslənir.
function ChoiceGrid({
  options,
  correctIndex,
  value,
  onChange,
  disabled,
  reveal,
  speakOptions,
}: {
  options: string[];
  correctIndex: number;
  value: number | null;
  onChange: (value: UserAnswer) => void;
  disabled: boolean;
  reveal: boolean;
  speakOptions?: boolean;
}) {
  return (
    <div className="grid gap-3">
      {options.map((option, i) => {
        const selected = value === i;
        const isCorrect = reveal && i === correctIndex;
        const isWrongPick = reveal && selected && i !== correctIndex;

        let state = "";
        if (isCorrect) state = "tile-correct";
        else if (isWrongPick) state = "tile-wrong";
        else if (reveal) state = "opacity-60";
        else if (selected) state = "tile-selected";

        return (
          <motion.button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => {
              playSelect();
              if (speakOptions) speakEnglish(option);
              onChange(i);
            }}
            whileTap={disabled ? undefined : { scale: 0.98 }}
            animate={
              isCorrect
                ? { scale: [1, 1.03, 1] }
                : isWrongPick
                  ? { x: [0, -9, 9, -6, 6, 0] }
                  : { scale: 1, x: 0 }
            }
            transition={{ duration: isWrongPick ? 0.42 : 0.32 }}
            className={`tile flex items-center gap-3 px-5 py-4 text-left text-lg font-bold text-fg ${state} ${
              disabled ? "cursor-default" : "cursor-pointer"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-extrabold ${
                isCorrect
                  ? "border-emerald-500 text-emerald-600"
                  : isWrongPick
                    ? "border-red-400 text-red-500"
                    : selected && !reveal
                      ? "border-brand text-brand"
                      : "border-line text-muted"
              }`}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1">{option}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// Cümlə quran: söz bankından sözləri seçib cavab sətrini düz.
function WordOrderInput({
  words,
  translation,
  disabled,
  onChange,
}: {
  words: string[];
  translation?: string;
  disabled: boolean;
  onChange: (value: UserAnswer) => void;
}) {
  // Söz bankı: hər sözə sabit açar (təkrar sözlər üçün) + bir dəfə qarışıq sıra.
  // Lazy state initializer yalnız mount-da işləyir; komponent hər tapşırıqda
  // key={task.id} ilə remount olur, ona görə hər sualda təzə qarışıq alınır.
  const [bank] = useState(() => {
    const a = words.map((w, i) => ({ w, key: i }));
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  });
  const [picked, setPicked] = useState<number[]>([]); // seçilmiş açarlar (sıra ilə)

  // Seçim dəyişəndə valideynə cavabı bildir (yalnız tam olanda qeyri-boş).
  useEffect(() => {
    const complete = picked.length === words.length;
    const sentence = picked.map((k) => bank.find((b) => b.key === k)!.w).join(" ");
    onChange(complete ? sentence : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  const available = bank.filter((b) => !picked.includes(b.key));

  return (
    <div>
      {translation && (
        <p className="mb-3 text-sm text-muted">
          Tərcümə: <span className="font-semibold text-fg">{translation}</span>
        </p>
      )}

      {/* Cavab sətri */}
      <div className="mb-4 flex min-h-14 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-panel/50 p-3">
        {picked.length === 0 && (
          <span className="text-sm text-muted">Sözləri sıra ilə seç…</span>
        )}
        {picked.map((k) => {
          const word = bank.find((b) => b.key === k)!.w;
          return (
            <button
              key={k}
              type="button"
              disabled={disabled}
              onClick={() => setPicked((p) => p.filter((x) => x !== k))}
              className="rounded-xl bg-brand px-3 py-2 font-bold text-white active:scale-95"
            >
              {word}
            </button>
          );
        })}
      </div>

      {/* Söz bankı */}
      <div className="flex flex-wrap gap-2">
        {available.map((b) => (
          <button
            key={b.key}
            type="button"
            disabled={disabled}
            onClick={() => {
              playSelect();
              setPicked((p) => [...p, b.key]);
            }}
            className="tile px-3 py-2 font-bold text-fg active:scale-95"
          >
            {b.w}
          </button>
        ))}
      </div>
    </div>
  );
}
