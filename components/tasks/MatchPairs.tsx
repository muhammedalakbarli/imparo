"use client";

// Cütləri tap — sol elementə toxun, sonra sağdakı qarşılığına toxun.
//
// NİYƏ SÜRÜKLƏMƏ YOX, İKİ TOXUNUŞ: sürükləmə mobil brauzerdə səhifənin
// sürüşməsi ilə toqquşur və kiçik barmaq üçün dəqiqlik tələb edir. İki toxunuş
// 6 yaşlı üçün də səhvsiz işləyir və klaviatura ilə də əlçatandır.
//
// Tapşırıq dəyişəndə vəziyyət effektlə sıfırlanmır — çağıran tərəf `key={task.id}`
// verir və React komponenti yenidən qurur. Bu, React-in tövsiyə etdiyi üsuldur:
// effektlə sıfırlama bir kadr köhnə cavabı göstərir.
//
// Sağ sütun QARIŞDIRILIR, amma qarışdırma tapşırıq id-sindən çıxarılan sabit
// toxumla aparılır: eyni tapşırıq hər açılışda eyni görünür. Təsadüfi olsaydı
// səhv edən uşaq təkrar cəhddə tamam başqa mənzərə görərdi.

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { MatchPairsTask } from "@/lib/types";
import { playSelect } from "@/lib/sound";

/** Sabit qarışdırma — mulberry32 (lib/content/balance.ts-dəki yanaşma ilə eyni). */
function shuffledIndexes(n: number, seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h |= 0;
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export default function MatchPairs({
  task,
  onChange,
  disabled,
  reveal,
}: {
  task: MatchPairsTask;
  onChange: (value: string) => void;
  disabled: boolean;
  reveal?: boolean;
}) {
  const n = task.pairs.length;
  const order = useMemo(() => shuffledIndexes(n, task.id), [n, task.id]);

  // matched[solIndeks] = seçilmiş sağ elementin ƏSL indeksi (yoxdursa -1)
  const [matched, setMatched] = useState<number[]>(() => Array(n).fill(-1));
  const [activeLeft, setActiveLeft] = useState<number | null>(null);

  // Bütün cütlər seçiləndə cavabı yuxarı ötür: sol sıra ilə əsl sağ indekslər.
  useEffect(() => {
    if (matched.every((m) => m >= 0)) onChange(matched.join(","));
  }, [matched, onChange]);

  function pickLeft(i: number) {
    if (disabled) return;
    playSelect();
    setActiveLeft(activeLeft === i ? null : i);
  }

  function pickRight(realIndex: number) {
    if (disabled || activeLeft === null) return;
    playSelect();
    setMatched((prev) => {
      const next = [...prev];
      // Eyni sağ element başqa sola bağlanıbsa oradan qopar — bir sağ element
      // yalnız bir cütə aid ola bilər.
      const owner = next.indexOf(realIndex);
      if (owner >= 0) next[owner] = -1;
      next[activeLeft] = realIndex;
      return next;
    });
    setActiveLeft(null);
  }

  const usedRight = new Set(matched.filter((m) => m >= 0));

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Sol sütun */}
      <div className="flex flex-col gap-2">
        {task.pairs.map((p, i) => {
          const picked = matched[i] >= 0;
          const isRight = reveal && matched[i] === i;
          const isWrong = reveal && picked && matched[i] !== i;
          return (
            <motion.button
              key={`l${i}`}
              type="button"
              whileTap={{ scale: disabled ? 1 : 0.97 }}
              onClick={() => pickLeft(i)}
              disabled={disabled}
              aria-pressed={activeLeft === i}
              className={`tile flex items-center justify-between gap-2 px-4 py-3 text-left text-lg font-bold transition ${
                isRight
                  ? "border-green-500 bg-green-500/10 text-fg"
                  : isWrong
                    ? "border-red-500 bg-red-500/10 text-fg"
                    : activeLeft === i
                      ? "tile-selected"
                      : "text-fg"
              }`}
            >
              <span>{p.left}</span>
              {picked && !reveal && <Check size={18} className="shrink-0 text-brand" />}
            </motion.button>
          );
        })}
      </div>

      {/* Sağ sütun — qarışdırılmış */}
      <div className="flex flex-col gap-2">
        {order.map((real) => {
          const used = usedRight.has(real);
          return (
            <motion.button
              key={`r${real}`}
              type="button"
              whileTap={{ scale: disabled || activeLeft === null ? 1 : 0.97 }}
              onClick={() => pickRight(real)}
              disabled={disabled || activeLeft === null}
              className={`tile px-4 py-3 text-left text-lg font-bold transition ${
                used ? "opacity-45" : "text-fg"
              } ${activeLeft === null && !disabled ? "cursor-default" : ""}`}
            >
              {task.pairs[real].right}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
