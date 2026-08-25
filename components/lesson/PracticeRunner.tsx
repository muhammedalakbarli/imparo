"use client";

// Praktika runner — istənilən tapşırıq siyahısını həll etdirir (dərsi tamamlamır).
// review: adi (Yoxla → Növbəti) · timed: sürət raundu (60 san, tıkla-keç).

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { Task, MultipleChoiceTask } from "@/lib/types";
import { gradeTask, type UserAnswer } from "@/lib/grading";
import { recordAttempt, flushAttempts } from "@/lib/attempts";
import { playCorrect, playWrong, playComplete, playStreak } from "@/lib/sound";
import { vibrateCelebrate } from "@/lib/haptics";
import { useCountUp } from "@/lib/useCountUp";
import TaskInput from "@/components/tasks/TaskInput";
import { preloadEnglish, spokenTextsOf } from "@/lib/tts";
import TaskFigure from "@/components/TaskFigure";
import Mascot from "@/components/Mascot";
import Confetti from "@/components/Confetti";
import QuestionFeedback from "@/components/lesson/QuestionFeedback";

const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5);

// Praktikada tapşırıq dərsdən qopardılıb — cəhd jurnalında (`task_attempts`)
// lesson_id sütunu isə boş buraxıla bilmir. Sintetik dəyər qoyulur: analitikada
// praktika cəhdlərini dərs cəhdlərindən ayırd etmək də bununla mümkündür.
// (Sütunda FK yoxdur — bax migration 0044.)
const PRACTICE_LESSON = "practice";

function chosenText(task: Task, answer: UserAnswer): string | null {
  if (task.type === "multiple_choice" || task.type === "listening") return task.options[Number(answer)] ?? null;
  return String(answer);
}

interface Props {
  tasks: Task[];
  title: string;
  timed?: boolean;
  onExit: () => void;
  onCorrect?: (taskId: string) => void;
  onWrong?: (taskId: string) => void; // səhv cavab → zəif mövzu (SRS) qeydi
  onFinish?: () => void; // dəst bitəndə (nəticə ekranı) çağırılır
  // Diaqnostika rejimi: cavabdan sonra NƏ düzgün cavab, NƏ də izah göstərilmir —
  // dərhal növbəti suala keçilir. Səbəb: diaqnostikanın işi ÖLÇMƏKDİR. Cavabı
  // göstərsək, test öyrətməyə başlayır və sonrakı sualların (və pilotdakı
  // son testin) nəticəsi korlanır.
  silent?: boolean;
}

export default function PracticeRunner(props: Props) {
  return props.timed ? <SpeedRunner {...props} /> : <ReviewRunner {...props} />;
}

// ── Adi praktika ──────────────────────────────────────────────
function ReviewRunner({ tasks, onExit, onCorrect, onWrong, onFinish, silent }: Props) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<UserAnswer | null>(null);
  const [checked, setChecked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [done, setDone] = useState(false);
  // Cəhd jurnalı üçün: sual göründüyü an və eyni tapşırığa neçənci cəhd.
  const shownAtRef = useRef(Date.now());
  const attemptNoRef = useRef<Record<string, number>>({});

  const task = tasks[index];
  const total = tasks.length;

  useEffect(() => {
    shownAtRef.current = Date.now();
  }, [index]);

  // İrəli-yükləmə (LessonRunner ilə eyni səbəb): növbəti 2 tapşırığın
  // İngilis audiosu şagird ora çatmamış hazır olsun.
  useEffect(() => {
    const ahead = tasks.slice(index + 1, index + 3).flatMap(spokenTextsOf);
    if (ahead.length) preloadEnglish(ahead);
  }, [tasks, index]);

  function check() {
    if (answer === null || answer === "") return;
    const r = gradeTask(task, answer);
    // Xam cəhdi jurnala yaz — mənimsəmə (mastery) məhz bundan hesablanır.
    // BUNSUZ praktika və diaqnostika heç nə ölçmür.
    const attemptNo = (attemptNoRef.current[task.id] ?? 0) + 1;
    attemptNoRef.current[task.id] = attemptNo;
    recordAttempt({
      task_id: task.id,
      lesson_id: PRACTICE_LESSON,
      correct: r.correct,
      chosen: chosenText(task, answer),
      ms_taken: Date.now() - shownAtRef.current,
      attempt_no: attemptNo,
      is_review: !silent, // diaqnostika ilk ölçmədir, təkrar deyil
    });
    setChecked(!silent);
    setLastCorrect(r.correct);
    if (silent) {
      // Cavab yazılır (task_attempts → mastery), amma şagirdə göstərilmir.
      if (r.correct) {
        setCorrect((c) => c + 1);
        onCorrect?.(task.id);
      } else onWrong?.(task.id);
      advance();
      return;
    }
    if (r.correct) {
      setCorrect((c) => c + 1);
      const n = streak + 1;
      setStreak(n);
      setBestStreak((b) => Math.max(b, n));
      onCorrect?.(task.id);
      playCorrect();
    } else {
      setStreak(0);
      onWrong?.(task.id);
      playWrong();
    }
  }

  function advance() {
    setAnswer(null);
    setChecked(false);
    if (index + 1 < total) setIndex((i) => i + 1);
    else {
      setDone(true);
      playComplete();
      void flushAttempts();
      onFinish?.();
    }
  }

  function next() {
    advance();
  }

  function restart() {
    setIndex(0);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setAnswer(null);
    setChecked(false);
    setDone(false);
  }

  // Enter → "Yoxla" (bütün sual tipləri: seçim + yazı).
  // preventDefault fokuslu düymənin ikinci dəfə işləməsinin qarşısını alır;
  // rəy (textarea) daxilində Enter toxunulmaz qalır.
  const onEnterRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    onEnterRef.current = (e) => {
      if (done) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("[data-feedback]")) return; // rəy formunda Enter sərbəst
      e.preventDefault();
      if (checked) next();
      else check();
    };
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Enter") onEnterRef.current(e);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (done)
    return (
      <Result
        correct={correct}
        total={total}
        bestStreak={bestStreak}
        onExit={onExit}
        onRestart={restart}
      />
    );

  return (
    <div>
      <Header progress={(index / total) * 100} onExit={onExit} />

      <div className="mt-4 text-sm font-medium text-muted">
        Sual {index + 1} / {total}
      </div>
      <h2 className="mt-2 text-xl font-semibold text-fg">{task.prompt}</h2>
      <TaskFigure figure={task.figure} />

      <div className="mt-6">
        <TaskInput task={task} value={answer} onChange={setAnswer} disabled={checked} reveal={checked} />
      </div>

      <AnimatePresence>
        {checked && (
          <motion.div
            key="pfeedback"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className={`mt-5 flex items-center gap-3 rounded-xl px-4 py-3 font-medium ${
              lastCorrect ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/12 text-red-500"
            }`}
          >
            <motion.div
              animate={lastCorrect ? { y: [0, -12, 0] } : { x: [0, -7, 7, -5, 5, 0] }}
              transition={{ duration: lastCorrect ? 0.55 : 0.45 }}
            >
              <Mascot size={40} mood={lastCorrect ? "celebrate" : "sad"} animate={false} />
            </motion.div>
            <span>{lastCorrect ? "Doğru! Afərin." : "Səhv. Növbəti dəfə alınacaq!"}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {checked && <QuestionFeedback key={task.id} taskId={task.id} />}

      <div className="mt-6">
        {!checked ? (
          <button
            type="button"
            onClick={check}
            disabled={answer === null || answer === ""}
            className="w-full rounded-2xl bg-brand px-5 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Yoxla
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="w-full rounded-2xl bg-emerald-500 px-5 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop btn-pop-green hover:bg-emerald-600"
          >
            {index + 1 < total ? "Növbəti" : "Bitir"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sürət raundu ──────────────────────────────────────────────
function SpeedRunner({ tasks, onExit, onFinish }: Props) {
  const DURATION = 60;
  const mc = tasks.filter((t): t is MultipleChoiceTask => t.type === "multiple_choice");

  const [time, setTime] = useState(DURATION);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [order, setOrder] = useState<MultipleChoiceTask[]>(() => shuffle(mc));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const finishedRef = useRef(false);

  // Saniyəlik geri sayım — tək interval (0-da dayanır).
  useEffect(() => {
    const id = setInterval(() => setTime((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  // Vaxt bitəndə bir dəfə tamamla — finishedRef ikiqat finish-i qapadır.
  useEffect(() => {
    if (time > 0 || finishedRef.current) return;
    finishedRef.current = true;
    setDone(true);
    playComplete();
    onFinish?.();
  }, [time, onFinish]);

  const task = order[i];

  function pick(idx: number) {
    if (picked !== null || done) return;
    const r = gradeTask(task, idx);
    recordAttempt({
      task_id: task.id,
      lesson_id: PRACTICE_LESSON,
      correct: r.correct,
      chosen: chosenText(task, idx),
      is_review: true,
    });
    setPicked(idx);
    if (r.correct) {
      setCorrect((c) => c + 1);
      const n = streak + 1;
      setStreak(n);
      setBestStreak((b) => Math.max(b, n));
      playCorrect();
    } else {
      setStreak(0);
      playWrong();
    }
    setAnswered((a) => a + 1);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < order.length) setI(i + 1);
      else {
        setOrder(shuffle(mc));
        setI(0);
      }
    }, 450);
  }

  function restart() {
    finishedRef.current = false;
    setTime(DURATION);
    setCorrect(0);
    setAnswered(0);
    setStreak(0);
    setBestStreak(0);
    setOrder(shuffle(mc));
    setI(0);
    setPicked(null);
    setDone(false);
  }

  if (done)
    return (
      <Result
        correct={correct}
        total={answered}
        bestStreak={bestStreak}
        timed
        onExit={onExit}
        onRestart={restart}
      />
    );

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExit}
          aria-label="Çıx"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-panel-2 hover:text-fg"
        >
          <X size={24} />
        </button>
        <div className="flex-1 text-center text-2xl font-extrabold text-fg">{time}s</div>
        <div className="w-9 text-right text-sm font-bold text-brand">{correct}</div>
      </div>

      <h2 className="mt-8 text-center text-xl font-semibold text-fg">{task.prompt}</h2>
      <div className="mt-6 grid gap-3">
        {task.options.map((opt, idx) => {
          const isPicked = picked === idx;
          const correctIdx = task.correctIndex;
          let tone = "border-line bg-panel text-fg hover:border-brand";
          if (picked !== null) {
            if (idx === correctIdx) tone = "border-emerald-500 bg-emerald-500/10 text-emerald-700";
            else if (isPicked) tone = "border-brand bg-brand/10 text-brand-soft";
            else tone = "border-line bg-panel text-muted";
          }
          return (
            <button
              key={idx}
              type="button"
              onClick={() => pick(idx)}
              className={`rounded-2xl border-2 px-4 py-3.5 text-left text-lg font-semibold transition ${tone}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Ortaq başlıq (X + progress) ──
function Header({
  progress,
  onExit,
}: {
  progress: number;
  onExit: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onExit}
        aria-label="Çıx"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-panel-2 hover:text-fg"
      >
        <X size={24} />
      </button>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-panel-2">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ── Nəticə (Duolingo üslubu bayram ekranı) ──
function Result({
  correct,
  total,
  bestStreak,
  timed,
  onExit,
  onRestart,
}: {
  correct: number;
  total: number;
  bestStreak: number;
  timed?: boolean;
  onExit: () => void;
  onRestart: () => void;
}) {
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const perfect = total > 0 && accuracy === 100;
  const shownCorrect = useCountUp(correct, 800);
  const shownAcc = useCountUp(accuracy, 900);

  useEffect(() => {
    vibrateCelebrate();
    if (perfect) setTimeout(() => playStreak(), 550); // qüsursuz → əlavə parıltı səsi
  }, [perfect]);

  // Performansa görə başlıq + alt mesaj + maskot əhvalı.
  const tier =
    perfect
      ? { title: "Qüsursuz!", sub: "Bir dənə də səhv yoxdur 🏆", mood: "celebrate" as const }
      : accuracy >= 80
        ? { title: "Möhtəşəm!", sub: "Əla nəticə, davam et!", mood: "celebrate" as const }
        : accuracy >= 50
          ? { title: "Afərin!", sub: "Yaxşı gedir — bir az da məşq!", mood: "happy" as const }
          : { title: "Davam et!", sub: "Hər məşq səni gücləndirir 💪", mood: "happy" as const };

  return (
    <div className="mx-auto max-w-xl py-14 text-center">
      <Confetti />
      <motion.div
        className="flex justify-center"
        initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 12 }}
      >
        <motion.div animate={{ y: [0, -16, 0] }} transition={{ duration: 0.8, delay: 0.3 }}>
          <Mascot size={110} mood={tier.mood} />
        </motion.div>
      </motion.div>

      {perfect && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 14 }}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-amber-950 shadow-lg shadow-amber-500/30"
        >
          ✨ Qüsursuz ✨
        </motion.div>
      )}

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-4 text-2xl font-bold text-fg"
      >
        {timed ? "Vaxt bitdi!" : tier.title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-1 text-muted"
      >
        {tier.sub}
      </motion.p>

      <motion.div
        className="mt-6 grid grid-cols-3 gap-3"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } }}
      >
        <Stat value={`${shownCorrect}/${total}`} label="Düzgün" tone="text-brand-soft" />
        <Stat value={`${shownAcc}%`} label="Dəqiqlik" tone="text-emerald-500" />
        <Stat value={`🔥 ${bestStreak}`} label="Ən yaxşı seriya" tone="text-orange-500" />
      </motion.div>

      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-2xl bg-brand px-5 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
        >
          Yenidən
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-2xl border-2 border-line px-5 py-3 font-bold text-fg btn-pop btn-pop-ghost hover:border-brand"
        >
          Praktikaya qayıt
        </button>
      </div>
    </div>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.8 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring", stiffness: 320, damping: 18 },
        },
      }}
      className="rounded-2xl border border-line bg-panel px-3 py-4"
    >
      <div className={`text-xl font-extrabold ${tone}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-muted">{label}</div>
    </motion.div>
  );
}
