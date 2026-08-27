"use client";

// Dashboard-dakı alov ikonunun üzərinə gələndə açılan seriya pəncərəsi (Duolingo üslubu).
// Toxunma cihazlarında hover yoxdur — ona görə klik də açır/bağlayır.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Shield, Users, Crown } from "lucide-react";
import { WEEKDAYS, thisWeek, SOCIETY_AT } from "@/lib/streak";

export default function StreakPopover({
  streakDays,
  streakFreezes,
  activeDays,
  friendStreaks,
  children,
}: {
  streakDays: number;
  streakFreezes: number;
  activeDays: string[];
  friendStreaks: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const week = thisWeek(activeDays);
  const inSociety = streakDays >= SOCIETY_AT;
  const doneToday = week.some((d) => d.today && d.active);

  // Kənara klik → bağla (toxunma cihazlarında hover ilə bağlanmır).
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div
      ref={box}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div onClick={() => setOpen((o) => !o)}>{children}</div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 top-full z-50 mt-3 w-80 -translate-x-1/2 overflow-hidden rounded-2xl border-2 border-line bg-panel shadow-2xl"
          >
            {/* Başlıq */}
            <div className="px-5 pt-5">
              {inSociety && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">
                  <Crown size={11} strokeWidth={3} /> Seriya Cəmiyyəti
                </span>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Flame size={28} className="text-orange-500" fill="currentColor" strokeWidth={0} />
                <span className="text-2xl font-extrabold text-fg">{streakDays} günlük seriya</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {doneToday
                  ? "Bu günü tamamladın — sabah da davam et!"
                  : "Seriyanı uzatmaq üçün bu gün bir dərs et!"}
              </p>

              {/* Həftə zolağı */}
              <div className="mt-4 flex justify-between">
                {week.map((d, i) => (
                  <div key={d.key} className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-bold text-muted">{WEEKDAYS[i]}</span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        d.active
                          ? "bg-orange-500 text-white"
                          : d.today
                            ? "border-2 border-orange-500/50 text-muted"
                            : "bg-panel-2 text-muted"
                      }`}
                    >
                      {d.active ? <Flame size={14} fill="currentColor" strokeWidth={0} /> : "·"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-line" />

            <Row
              Icon={Users}
              tone="text-sky-500"
              title="Dost seriyaları"
              body={`${friendStreaks} aktiv dost seriyası`}
            />
            <Row
              Icon={Shield}
              tone="text-sky-500"
              title={`${streakFreezes} Əlavə Dondurucu`}
              body="Bir gün buraxsan seriyanı qoruyur."
            />

            <Link
              href="/streak"
              onClick={() => setOpen(false)}
              className="block border-t border-line px-5 py-3.5 text-center text-sm font-extrabold uppercase tracking-wide text-brand transition hover:bg-panel-2"
            >
              Daha çox
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({
  Icon,
  tone,
  title,
  body,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  tone: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <Icon size={20} className={`mt-0.5 shrink-0 ${tone}`} strokeWidth={2.5} />
      <span>
        <span className="block text-sm font-extrabold text-fg">{title}</span>
        <span className="block text-xs text-muted">{body}</span>
      </span>
    </div>
  );
}
