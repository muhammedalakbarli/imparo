"use client";

// Tam seriya səhifəsi — hover pəncərəsindəki "Daha çox" buraya gətirir.
// Bölmələr: başlıq → 3 aylıq təqvim → seriya məqsədi → Seriya Cəmiyyəti imtiyazları.

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Shield, Crown, Gift, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { loadProgress, loadActiveDays, type ProgressState } from "@/lib/progress";
import { getFriends } from "@/lib/friends";
import { PageSkeleton } from "@/components/Skeleton";
import { WEEKDAYS, MONTHS, dayKey, monthGrid, nextMilestone, SOCIETY_AT } from "@/lib/streak";

export default function StreakPage() {
  const { user, ready } = useAuthUser();
  const [state, setState] = useState<ProgressState | null>(null);
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [friendStreaks, setFriendStreaks] = useState(0);
  // Təqvimdə cari aydan neçə ay sürüşmüşük (0 = bu ay, -1 = keçən, +1 = gələn).
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadProgress(user.id).then(setState);
    loadActiveDays(user.id).then(setActiveDays);
    getFriends()
      .then((f) => setFriendStreaks(f.filter((x) => x.friendStreak > 0).length))
      .catch(() => {});
  }, [user]);

  if (!ready || !state) return <PageSkeleton />;

  const days = state.streakDays;
  const inSociety = days >= SOCIETY_AT;
  const { from, to } = nextMilestone(days);
  const pct = Math.min(100, Math.round(((days - from) / Math.max(1, to - from)) * 100));
  const active = new Set(activeDays);
  const doneToday = active.has(dayKey(new Date()));

  // Təqvimdə göstərilən tək ay — oxlarla irəli/geri sürüşür.
  const now = new Date();
  const shown = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = shown.getFullYear();
  const month = shown.getMonth();

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ChevronLeft size={16} /> Öyrənmə yolun
        </Link>

        {/* ── Başlıq ── */}
        <section className="mt-4 rounded-3xl border-2 border-line bg-panel p-6 text-center">
          {inSociety && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
              <Crown size={12} strokeWidth={3} /> Seriya Cəmiyyəti
            </span>
          )}
          <div className="mt-3 flex items-center justify-center gap-3">
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
            >
              <Flame size={52} className="text-orange-500" fill="currentColor" strokeWidth={0} />
            </motion.span>
            <span className="text-5xl font-extrabold text-fg">{days}</span>
          </div>
          <p className="mt-1 text-lg font-extrabold text-fg">günlük seriya</p>
          <p className="mt-2 text-sm text-muted">
            {doneToday
              ? "Bu günü tamamladın — sabah da davam et!"
              : "Seriyanı uzatmaq üçün bu gün bir dərs et!"}
          </p>
        </section>

        {/* ── Təqvim (tək ay + oxlarla naviqasiya) ── */}
        <section className="mt-5 rounded-3xl border-2 border-line bg-panel p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonthOffset((o) => o - 1)}
              aria-label="Əvvəlki ay"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-panel-2 hover:text-fg"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <h2 className="text-lg font-extrabold text-fg">
              {MONTHS[month]} {year}
            </h2>
            <button
              type="button"
              onClick={() => setMonthOffset((o) => o + 1)}
              aria-label="Növbəti ay"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-panel-2 hover:text-fg"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w, i) => (
              <span key={i} className="py-1 text-[11px] font-bold text-muted">
                {w}
              </span>
            ))}
            {monthGrid(year, month).map(({ date, inMonth }, i) => {
              const on = inMonth && active.has(dayKey(date));
              const isToday = dayKey(date) === dayKey(now);
              return (
                <span
                  key={i}
                  className={`flex aspect-square items-center justify-center rounded-lg text-xs font-bold ${
                    !inMonth
                      ? "text-muted/30"
                      : on
                        ? "bg-orange-500 text-white"
                        : isToday
                          ? "border-2 border-orange-500/50 text-fg"
                          : "bg-panel-2 text-muted"
                  }`}
                >
                  {on ? <Flame size={13} fill="currentColor" strokeWidth={0} /> : date.getDate()}
                </span>
              );
            })}
          </div>

          {monthOffset !== 0 && (
            <button
              type="button"
              onClick={() => setMonthOffset(0)}
              className="mt-4 w-full rounded-xl py-2 text-sm font-extrabold text-brand transition hover:bg-panel-2"
            >
              Bu aya qayıt
            </button>
          )}
        </section>

        {/* ── Seriya məqsədi ── */}
        <section className="mt-5 rounded-3xl border-2 border-line bg-panel p-6">
          <h2 className="text-lg font-extrabold text-fg">Seriya məqsədi</h2>
          <div className="mt-4 h-4 overflow-hidden rounded-full bg-panel-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
            />
          </div>
          <div className="mt-2 flex justify-between text-sm font-extrabold text-muted">
            <span>{from}</span>
            <span className="text-orange-500">{days}</span>
            <span>{to}</span>
          </div>
          <p className="mt-3 text-sm text-muted">
            Növbəti mərhələyə <span className="font-extrabold text-fg">{to - days} gün</span> qalıb.
          </p>
        </section>

        {/* ── Seriya Cəmiyyəti imtiyazları ── */}
        <section className="mt-5 rounded-3xl border-2 border-line bg-panel p-6">
          <h2 className="text-lg font-extrabold text-fg">Seriya Cəmiyyəti</h2>
          <div className="mt-4 space-y-3">
            <Perk
              Icon={Gift}
              tone="text-amber-500"
              title="Mərhələ sandığı"
              body={
                inSociety
                  ? `${SOCIETY_AT} günlük seriyaya çatdığın üçün təbriklər!`
                  : `${SOCIETY_AT} günlük seriyaya çatanda açılır.`
              }
              status={inSociety ? "Alınıb" : "Bağlı"}
              on={inSociety}
            />
            <Perk
              Icon={Shield}
              tone="text-sky-500"
              title={`${state.streakFreezes} Əlavə Dondurucu`}
              body="Bir gün buraxsan seriyanı qoruyur."
              status={state.streakFreezes > 0 ? "Aktiv" : "Yoxdur"}
              on={state.streakFreezes > 0}
            />
            <Perk
              Icon={Crown}
              tone="text-orange-500"
              title="VIP status"
              body="Liqada və profilində seriya statusun görünür."
              status={inSociety ? "Aktivdir" : "Bağlı"}
              on={inSociety}
            />
          </div>
          {friendStreaks > 0 && (
            <p className="mt-4 text-sm text-muted">
              <span className="font-extrabold text-fg">{friendStreaks}</span> aktiv dost seriyan var.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

function Perk({
  Icon,
  tone,
  title,
  body,
  status,
  on,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  tone: string;
  title: string;
  body: string;
  status: string;
  on: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border-2 p-4 ${on ? "border-line bg-panel-2" : "border-line opacity-60"}`}>
      <Icon size={24} className={`mt-0.5 shrink-0 ${tone}`} strokeWidth={2.5} />
      <span className="flex-1">
        <span className="block font-extrabold text-fg">{title}</span>
        <span className="block text-sm text-muted">{body}</span>
      </span>
      <span className={`shrink-0 text-xs font-extrabold uppercase ${on ? "text-emerald-500" : "text-muted"}`}>
        {status}
      </span>
    </div>
  );
}
