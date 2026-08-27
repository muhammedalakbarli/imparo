"use client";

// Gündəlik sandıq — bütün gündəlik görevlər bitəndə açılan mükafat modalı.
// Bağlı sandıq → "Aç" → titrəmə/açılış animasiyası → bonus XP hədiyyəsi + konfetti.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, X, Gem, Heart, Shield } from "lucide-react";
import { useT } from "@/lib/i18n";
import Mascot from "@/components/Mascot";
import Confetti from "@/components/Confetti";
import { playLevelUp, playSelect } from "@/lib/sound";
import { vibrateCelebrate } from "@/lib/haptics";
import type { ChestReward } from "@/lib/quests";

interface Props {
  onOpen: () => Promise<ChestReward>; // sandığı açır, mükafatı qaytarır
  onClose: () => void;
  /** Başlıq/izah açarları — gündəlik sandıq (default) və ya bölmə sandığı. */
  titleKey?: string;
  subtitleKey?: string;
}

export default function ChestModal({
  onOpen,
  onClose,
  titleKey = "chest.title",
  subtitleKey = "chest.ready",
}: Props) {
  const t = useT();
  const [phase, setPhase] = useState<"closed" | "opened">("closed");
  const [reward, setReward] = useState<ChestReward | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleOpen() {
    if (busy) return;
    setBusy(true);
    playSelect();
    const r = await onOpen().catch(() => null);
    setReward(r);
    setPhase("opened");
    playLevelUp();
    vibrateCelebrate();
    setBusy(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {phase === "opened" && <Confetti />}
        <motion.div
          role="dialog"
          aria-label={t(titleKey)}
          className="relative w-full max-w-sm rounded-3xl border border-line bg-panel p-6 text-center shadow-xl"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-line/40"
          >
            <X size={18} />
          </button>

          {phase === "closed" ? (
            <>
              <div className="text-lg font-extrabold text-fg">{t(titleKey)}</div>
              <div className="mt-1 text-sm text-muted">{t(subtitleKey)}</div>
              <motion.div
                className="mx-auto my-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-300 to-accent text-white shadow-md"
                animate={{ rotate: [0, -4, 4, -3, 3, 0], scale: [1, 1.04, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                <Gift size={56} strokeWidth={2} />
              </motion.div>
              <button
                type="button"
                onClick={handleOpen}
                disabled={busy}
                className="w-full rounded-2xl bg-brand py-3 text-sm font-extrabold uppercase tracking-wide text-white btn-pop disabled:opacity-60"
              >
                {t("chest.open")}
              </button>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <Mascot size={84} mood="celebrate" />
              </div>
              <div className="mt-3 text-lg font-extrabold text-fg">{t("chest.reward")}</div>
              <motion.div
                className="my-4 flex items-center justify-center gap-2 text-3xl font-black"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 14 }}
              >
                {reward?.kind === "gems" && (
                  <span className="flex items-center gap-2 text-emerald-500">
                    <Gem size={34} fill="currentColor" strokeWidth={0} />+{reward.amount}
                  </span>
                )}
                {reward?.kind === "hearts" && (
                  <span className="flex items-center gap-2 text-red-500">
                    <Heart size={34} fill="currentColor" strokeWidth={0} />
                    <span className="text-2xl">{t("chest.wonHearts")}</span>
                  </span>
                )}
                {reward?.kind === "freeze" && (
                  <span className="flex items-center gap-2 text-sky-500">
                    <Shield size={34} fill="currentColor" strokeWidth={0} />
                    <span className="text-2xl">{t("chest.wonFreeze")}</span>
                  </span>
                )}
              </motion.div>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-brand py-3 text-sm font-extrabold uppercase tracking-wide text-white btn-pop"
              >
                {t("common.ok")}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
