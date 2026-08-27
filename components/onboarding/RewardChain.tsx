"use client";

// Onboarding-də ilk dərsdən SONRAKI mükafat zənciri (Duolingo modeli).
// Ardıcıllıq: bal açılışı → balın izahı → seriya 0→1 → seriya məqsədi →
// gündəlik tapşırıqlar → sandıq → profil təklifi.
//
// Niyə belə uzundur: hər ekran bir oyun mexanikasını TANITDIR (bal, seriya, tapşırıq,
// zümrüd) — şagird hesab yaratmazdan əvvəl sistemin nə vəd etdiyini görür. Bu, qeydiyyat
// təklifinin niyə məhz sonda gəldiyinin səbəbidir.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Target, Gem, CheckCircle2 } from "lucide-react";
import Mascot from "@/components/Mascot";
import Confetti from "@/components/Confetti";
import { setGuest } from "@/lib/guest";
import { playComplete, playLevelUp, playStreak } from "@/lib/sound";
import { vibrateCelebrate } from "@/lib/haptics";

type Step = "score" | "scoreWhy" | "streak" | "streakGoal" | "quests" | "chest" | "profile";
const ORDER: Step[] = ["score", "scoreWhy", "streak", "streakGoal", "quests", "chest", "profile"];

// Seriya məqsədləri — uzun məqsəd daha güclü vəd (Duolingo-nun eyni çərçivəsi).
const GOALS = [
  { days: 7, label: "Yaxşı", boost: "2×" },
  { days: 14, label: "Əla", boost: "3×" },
  { days: 30, label: "Möhtəşəm", boost: "5×" },
  { days: 50, label: "Dayanılmaz", boost: "7×" },
];

export default function RewardChain({
  xp,
  onFinish,
  onSkip,
}: {
  xp: number;
  onFinish: () => void;
  onSkip: () => void;
}) {
  const [i, setI] = useState(0);
  const [goal, setGoal] = useState<number | null>(null);
  const step = ORDER[i];

  function next() {
    if (step === "streakGoal" && goal == null) return;
    if (i < ORDER.length - 1) setI((s) => s + 1);
    else onFinish();
  }

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-10">
        {/* AnimatePresence `mode="wait"` İŞLƏDİLMİR: ekranların içindəki sonsuz
            (repeat: Infinity) animasiyalar çıxış animasiyasının bitməsinə mane olur və
            zəncir görüntüdə DONUR — vəziyyət irəliləyir, amma köhnə ekran qalır.
            Açar dəyişəndə React onsuz da yenidən quraşdırır və giriş animasiyası oynayır. */}
        <div className="flex flex-1 flex-col">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-1 flex-col items-center justify-center text-center"
          >
            {step === "score" && <ScoreUnlock xp={xp} />}
            {step === "scoreWhy" && <ScoreWhy />}
            {step === "streak" && <StreakUp />}
            {step === "streakGoal" && <StreakGoal value={goal} onPick={setGoal} />}
            {step === "quests" && <Quests />}
            {step === "chest" && <Chest />}
            {step === "profile" && <ProfilePrompt />}
          </motion.div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={next}
            disabled={step === "streakGoal" && goal == null}
            className="w-full rounded-2xl bg-brand px-5 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === "profile" ? "Profil yarat" : "Davam et"}
          </button>
          {step === "profile" && (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-2xl px-5 py-2 font-bold text-muted transition hover:text-fg"
            >
              Sonra
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

// ── 1) Bal açıldı ─────────────────────────────────────────────────────────────
function ScoreUnlock({ xp }: { xp: number }) {
  useEffect(() => {
    playLevelUp();
  }, []);
  return (
    <>
      <Confetti />
      <motion.div
        initial={{ scale: 0.5, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-accent text-5xl font-extrabold text-white shadow-xl"
      >
        {xp}
      </motion.div>
      <h1 className="mt-7 text-2xl font-extrabold text-fg">Imparo balını açdın!</h1>
      <p className="mt-2 text-muted">İlk dərsin sənə {xp} XP qazandırdı.</p>
    </>
  );
}

// ── 2) Bal nə deməkdir ────────────────────────────────────────────────────────
function ScoreWhy() {
  return (
    <>
      <Mascot size={130} mood="thinking" />
      <h1 className="mt-6 text-2xl font-extrabold text-fg">Balın nəyi göstərir?</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Bal yalnız keçdiyin dərslərin sayı deyil — mövzuları nə qədər möhkəm bildiyini
        ölçür. Dərslər irəlilədikcə bal da real biliyinlə birlikdə artır.
      </p>
    </>
  );
}

// ── 3) Seriya 0 → 1 ───────────────────────────────────────────────────────────
function StreakUp() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      setN(1);
      playStreak();
      vibrateCelebrate();
    }, 450);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      <motion.div
        animate={n ? { scale: [1, 1.25, 1] } : {}}
        transition={{ duration: 0.5 }}
        className="relative flex h-36 w-36 items-center justify-center"
      >
        <motion.span
          animate={n ? { opacity: [0.3, 0.8, 0.3], scale: [1, 1.15, 1] } : { opacity: 0.2 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 rounded-full bg-orange-500/25 blur-2xl"
        />
        <Flame
          size={96}
          className={n ? "text-orange-500" : "text-muted/40"}
          fill="currentColor"
          strokeWidth={1.5}
        />
      </motion.div>
      <motion.div
        key={n}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mt-2 text-6xl font-extrabold text-orange-500"
      >
        {n}
      </motion.div>
      <h1 className="mt-4 text-2xl font-extrabold text-fg">
        {n ? "1 günlük seriya!" : "Seriya başlayır..."}
      </h1>
      <p className="mt-2 text-muted">
        Amma sabah məşq etməsən seriya sıfırlanacaq. Diqqətli ol!
      </p>
    </>
  );
}

// ── 4) Seriya məqsədi ─────────────────────────────────────────────────────────
function StreakGoal({ value, onPick }: { value: number | null; onPick: (n: number) => void }) {
  return (
    <div className="w-full">
      <Target size={56} className="mx-auto text-brand" strokeWidth={2.5} />
      <h1 className="mt-5 text-2xl font-extrabold text-fg">Seriya məqsədi seçək!</h1>
      <div className="mt-6 flex flex-col gap-3">
        {GOALS.map((g) => {
          const on = value === g.days;
          return (
            <button
              key={g.days}
              type="button"
              onClick={() => {
                onPick(g.days);
                setGuest({ streakGoal: g.days });
              }}
              className={`btn-pop flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition ${
                on
                  ? "border-brand bg-brand/10 [--pop:var(--color-brand)]"
                  : "border-line bg-panel btn-pop-ghost hover:border-brand"
              }`}
            >
              <span>
                <span className="block text-lg font-extrabold text-fg">{g.days} günlük seriya</span>
                <span className="block text-sm text-muted">{g.label}</span>
              </span>
              <span className={`text-sm font-extrabold ${on ? "text-brand" : "text-muted"}`}>
                {g.boost}
              </span>
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {value && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 text-sm font-bold text-brand"
          >
            Kursu bitirmə ehtimalın {GOALS.find((g) => g.days === value)?.boost} artır!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 5) Gündəlik tapşırıqlar ───────────────────────────────────────────────────
function Quests() {
  useEffect(() => {
    playComplete();
  }, []);
  return (
    <>
      <Confetti />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
      >
        <CheckCircle2 size={92} className="text-emerald-500" strokeWidth={2.5} />
      </motion.div>
      <h1 className="mt-6 text-2xl font-extrabold text-fg">Gündəlik tapşırıqlar tamam!</h1>
      <div className="mt-5 w-full rounded-2xl border-2 border-line bg-panel px-5 py-4 text-left">
        <div className="flex items-center justify-between">
          <span className="font-bold text-fg">1 dərs bitir</span>
          <span className="font-extrabold text-accent">+10 XP</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-panel-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="h-full rounded-full bg-emerald-500"
          />
        </div>
      </div>
      <p className="mt-4 text-muted">İlk günündə bir tapşırıq var idi — onu bitirdin.</p>
    </>
  );
}

// ── 6) Sandıq ─────────────────────────────────────────────────────────────────
function Chest() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setOpen(true);
      playLevelUp();
      vibrateCelebrate();
    }, 500);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      {open && <Confetti />}
      <motion.div
        animate={open ? { rotate: [0, -8, 8, -4, 0], scale: [1, 1.15, 1] } : { rotate: [0, -3, 3, 0] }}
        transition={open ? { duration: 0.6 } : { repeat: Infinity, duration: 1.2 }}
        className="text-7xl"
        aria-hidden
      >
        {open ? "🎉" : "🎁"}
      </motion.div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center gap-2 text-4xl font-extrabold text-emerald-500"
          >
            <Gem size={36} strokeWidth={2.5} /> 5
          </motion.div>
        )}
      </AnimatePresence>
      <h1 className="mt-4 text-2xl font-extrabold text-fg">5 zümrüd qazandın!</h1>
      <p className="mt-2 text-muted">Gündəlik hədəfinə çatdığın üçün — afərin!</p>
    </>
  );
}

// ── 7) Profil təklifi ─────────────────────────────────────────────────────────
function ProfilePrompt() {
  return (
    <>
      <Mascot size={140} mood="wave" />
      <h1 className="mt-6 text-2xl font-extrabold text-fg">Profil yaratmaq vaxtıdır!</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Tərəqqini, seriyanı və zümrüdlərini saxlamaq üçün pulsuz profil yarat — hər şey
        olduğu yerdən davam edəcək.
      </p>
    </>
  );
}
