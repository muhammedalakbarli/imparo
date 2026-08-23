"use client";

// Dərsin uçdan-uca axını: 15 əsas tapşırıq → bonus təklifi → 5 bonus → nəticə.
// Gamification: dərs içi combo (ard-arda düzgün → bonus XP), səs effektləri,
// dərs sonu bayramı (konfetti + XP count-up + statistika + level-up).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart } from "lucide-react";
import type { Lesson, Task } from "@/lib/types";
import ResultSheet from "@/components/lesson/ResultSheet";
import { gradeTask, type UserAnswer } from "@/lib/grading";
import { completeLesson, loadProgress } from "@/lib/progress";
import { loadHearts, loseHeart, MAX_HEARTS } from "@/lib/hearts";
import { loadPlus } from "@/lib/plus";
import { addWrong as addMistake, markCorrect as removeMistake } from "@/lib/srs";
import { recordAttempt, flushAttempts } from "@/lib/attempts";
import { addGuestLesson } from "@/lib/guest";
import RewardChain from "@/components/onboarding/RewardChain";
import { bumpQuest, bumpQuests } from "@/lib/quests";
import { addWeeklyXp } from "@/lib/leaderboard";
import { addMonthlyXp } from "@/lib/monthly";
import { touchFriendStreaks } from "@/lib/friends";
import { track } from "@/lib/analytics";
import { levelFromXp } from "@/lib/levels";
import { playCorrect, playWrong, playComplete, playLevelUp, playCombo, playStreak } from "@/lib/sound";
import { vibrateCorrect, vibrateWrong, vibrateCelebrate } from "@/lib/haptics";
import { useCountUp } from "@/lib/useCountUp";
import { useT } from "@/lib/i18n";
import TaskInput from "@/components/tasks/TaskInput";
import { preloadEnglish, spokenTextsOf } from "@/lib/tts";
import QuitDialog from "@/components/lesson/QuitDialog";
import TaskFigure from "@/components/TaskFigure";
import Mascot from "@/components/Mascot";
import Confetti from "@/components/Confetti";

interface Props {
  slug: string;
  lesson: Lesson;
  userId: string;
  /** Onboarding-də hesabsız oynanan dərs (Duolingo modeli: əvvəl sına, sonra qeydiyyat).
   *  Bu rejimdə heç bir server yazısı getmir — nəticə qonaq anbarında saxlanılır və
   *  hesab yaradılanda köçürülür (bax lib/guest.ts). */
  guest?: boolean;
}

type Phase = "main" | "bonusPrompt" | "bonus" | "retry" | "done";

// Duolingo-vari XP: hər düzgün cavab az XP verir (dərs ≈ 30-40 XP, əvvəl ~230).
// Tapşırığın öz `xp` dəyəri artıq cəmi müəyyən etmir — sabit formul istifadə olunur.
const XP_PER_CORRECT = 2; // hər düzgün cavab
const COMBO_STEP = 5; // hər 5 ard-arda düzgün → bonus
const COMBO_BONUS = 1; // bonus XP

export default function LessonRunner({ slug, lesson, userId, guest = false }: Props) {
  const t = useT();
  const router = useRouter();
  const mainTasks = lesson.tasks;
  const bonusTasks = lesson.bonusTasks ?? [];

  const [phase, setPhase] = useState<Phase>("main");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<UserAnswer | null>(null);
  const [checked, setChecked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [combo, setCombo] = useState(0);
  const [quitOpen, setQuitOpen] = useState(false);
  const [bestCombo, setBestCombo] = useState(0);
  const [comboBonus, setComboBonus] = useState(0); // bu addımda verilən combo bonusu
  const [startXp, setStartXp] = useState<number | null>(guest ? 0 : null);
  // Səhv cavablandırılan tapşırıqlar — bölmə sonunda düz cavablanana qədər təkrarlanır.
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [retryQueue, setRetryQueue] = useState<Task[]>([]);
  const [retryTotal, setRetryTotal] = useState(0);
  // Təkrar bitəndən sonra hara keçək: bonus təklifi, yoxsa dərsi bitir.
  const [afterRetry, setAfterRetry] = useState<"bonus" | "finish">("finish");
  // Canlar (hearts) — səhv cavab 1 can aparır; 0 olanda mülayim xəbərdarlıq.
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [heartsOut, setHeartsOut] = useState(false);
  // Imparo Plus: limitsiz can + 2× zümrüd.
  const [plus, setPlus] = useState(false);
  // Onboarding: statistikadan sonra mükafat zənciri (bal → seriya → sandıq → profil).
  const [rewards, setRewards] = useState(false);
  // Cəhd jurnalı (migration 0044): sual göründüyü an + eyni tapşırığa neçənci cəhd.
  const shownAtRef = useRef<number>(Date.now());
  const attemptNoRef = useRef<Record<string, number>>({});

  // Level-up aşkarı üçün dərsə başlamazdan əvvəlki XP.
  useEffect(() => {
    if (guest) return;
    loadProgress(userId).then((p) => setStartXp(p.totalXp)).catch(() => setStartXp(0));
  }, [userId, guest]);
  // Cari can sayını yüklə (zaman əsaslı bərpa serverdə tətbiq olunur).
  useEffect(() => {
    if (guest) return; // qonaqda canlar lokal MAX_HEARTS-dan başlayır
    loadHearts().then(setHearts).catch(() => {});
  }, [userId, guest]);
  // Plus statusu (limitsiz can / 2× zümrüd).
  useEffect(() => {
    if (guest) return; // qonaq Plus ola bilməz
    loadPlus().then(setPlus).catch(() => {});
  }, [userId, guest]);

  // Analitika: dərs başlandı (funnel — signup→onboarding→dərs).
  useEffect(() => {
    track("lesson_started", { lessonId: lesson.id, subject: slug });
  }, [lesson.id, slug]);

  // Səhifədən çıxanda buferdə qalanı göndər. Dərs YARIMÇIQ atılsa da data qalır —
  // şagirdin məhz harada qırıldığı ən dəyərli siqnallardan biridir.
  useEffect(() => () => void flushAttempts(), []);

  const inBonus = phase === "bonus";
  const inRetry = phase === "retry";
  const list: Task[] = inRetry ? retryQueue : inBonus ? bonusTasks : mainTasks;
  const task = inRetry ? retryQueue[0] : list[index];
  const total = list.length;
  const progressPct = inRetry
    ? retryTotal
      ? Math.round(((retryTotal - retryQueue.length) / retryTotal) * 100)
      : 0
    : total
      ? Math.round((index / total) * 100)
      : 0;

  // İRƏLİ-YÜKLƏMƏ: növbəti 2 tapşırığın İngilis audiosunu indidən gətir.
  // TaskInput cari tapşırığı onsuz da önyükləyir, amma o, tapşırıq EKRANA
  // GƏLƏNDƏ başlayır — şagird dərhal "Dinlə"yə basarsa audio hələ hazır
  // olmaya bilər. İki tapşırıq irəli getmək bu boşluğu bağlayır.
  //
  // Bütün dərs qəsdən yüklənmir: 20 tapşırıq × 4 variant ≈ 640 KB olardı və
  // mobil şəbəkədə onlarla paralel sorğu deməkdir.
  useEffect(() => {
    const ahead = list.slice(index + 1, index + 3).flatMap(spokenTextsOf);
    if (ahead.length) preloadEnglish(ahead);
  }, [list, index]);

  function handleCheck() {
    if (answer === null || answer === "") return;
    const result = gradeTask(task, answer);
    setChecked(true);
    setLastCorrect(result.correct);

    // Xam cəhdi jurnala yaz (bax lib/attempts.ts + migration 0044). Bufer üzərindən
    // işlədiyi üçün sinxrondur — dərsin axıcılığına heç bir təsiri yoxdur.
    const attemptNo = (attemptNoRef.current[task.id] ?? 0) + 1;
    attemptNoRef.current[task.id] = attemptNo;
    if (!guest) recordAttempt({
      task_id: task.id,
      lesson_id: lesson.id,
      correct: result.correct,
      chosen: chosenAnswerText(task, answer),
      ms_taken: Date.now() - shownAtRef.current,
      attempt_no: attemptNo,
      is_review: inRetry,
    });

    // Təkrar mərhələsi — XP/combo/statistika dəyişmir, yalnız düz cavab tələb olunur.
    if (inRetry) {
      if (result.correct) {
        if (!guest) removeMistake(task.id);
        playCorrect();
        vibrateCorrect();
      } else {
        if (!guest) addMistake(task.id);
        playWrong();
        vibrateWrong();
      }
      return;
    }

    setAnswered((a) => a + 1);
    if (result.correct) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setBestCombo((b) => Math.max(b, nextCombo));
      const bonus = nextCombo % COMBO_STEP === 0 ? COMBO_BONUS : 0;
      setComboBonus(bonus);
      setEarnedXp((x) => x + XP_PER_CORRECT + bonus);
      setCorrectCount((c) => c + 1);
      if (!guest) removeMistake(task.id);
      bumpQuest("correct", 1);
      playCorrect();
      if (nextCombo >= 2) playCombo(nextCombo);
      vibrateCorrect();
    } else {
      setCombo(0);
      setComboBonus(0);
      if (!guest) addMistake(task.id);
      // Bölmə sonunda təkrar üçün səhv tapşırığı yadda saxla (təkrarsız).
      setWrongIds((w) => (w.includes(task.id) ? w : [...w, task.id]));
      // Plus: limitsiz can (can aparılmır). Əks halda bir can apar.
      if (!plus) {
        if (guest) {
          setHearts((h) => {
            const n = Math.max(0, h - 1);
            if (n <= 0) setHeartsOut(true);
            return n;
          });
        } else {
          loseHeart()
            .then((h) => {
              setHearts(h);
              if (h <= 0) setHeartsOut(true);
            })
            .catch(() => {});
        }
      }
      playWrong();
      vibrateWrong();
    }
  }

  // Enter → "Yoxla" (bütün sual tipləri). Yalnız cavab mərhələsində;
  // preventDefault fokuslu düymənin ikinci dəfə işləməsini bağlayır.
  const onEnterRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    onEnterRef.current = (e) => {
      if (phase !== "main" && phase !== "bonus" && phase !== "retry") return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("[data-feedback]")) return;
      e.preventDefault();
      if (checked) advance();
      else handleCheck();
    };
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Enter") onEnterRef.current(e);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  if (total === 0) {
    return <div className="py-12 text-center text-muted">{t("run.noTasks")}</div>;
  }

  function finishLesson(finalXp: number) {
    // XP+zümrüd artıq serverdə (complete_lesson RPC) həqiqi tapşırıq sayından hesablanır —
    // client heç bir məbləğ göndərmir, idempotentdir (bax lib/progress.ts, migration 0037).
    if (guest) {
      // Qonaq: mükafat serverdə hesablanmır — onboarding üçün lokal qeyd kifayətdir.
      addGuestLesson(lesson.id, finalXp, 5);
    } else {
      completeLesson(lesson.id)
        .then(() => touchFriendStreaks())
        .catch(() => {});
      bumpQuests({ xp: finalXp, lessons: 1 });
      addWeeklyXp(finalXp);
      addMonthlyXp(finalXp);
    }
    const up =
      startXp !== null &&
      levelFromXp(startXp).level < levelFromXp(startXp + finalXp).level;
    if (up) playLevelUp();
    else playComplete();
    track("lesson_completed", {
      lessonId: lesson.id,
      subject: slug,
      xp: finalXp,
      correct: correctCount,
      answered,
      bestCombo,
      leveledUp: up,
    });
    void flushAttempts(); // dərsin bütün cəhdlərini serverə yaz
    setPhase("done");
  }

  function advance() {
    setAnswer(null);
    setChecked(false);
    setComboBonus(0);
    shownAtRef.current = Date.now(); // növbəti sualın düşünmə taymeri

    // Təkrar mərhələsi: düz cavab → növbatiyə keç; səhv → sona at (düz olana qədər dövr et).
    if (inRetry) {
      const [head, ...rest] = retryQueue;
      const next = lastCorrect ? rest : [...rest, head];
      if (next.length === 0) {
        // Bu mərhələnin səhvləri həll olundu → sıfırla, sonra bonus/bitirə keç.
        setWrongIds([]);
        if (afterRetry === "bonus") goToBonusPrompt();
        else finishLesson(earnedXp);
        return;
      }
      setRetryQueue(next);
      return;
    }

    if (index + 1 < total) {
      setIndex((i) => i + 1);
      return;
    }

    // Əsas suallar bitdi: ƏVVƏL səhvlərin təkrarı, SONRA bonus təklifi / bitir.
    if (!inBonus) {
      if (wrongIds.length > 0) {
        startRetry(wrongIds, bonusTasks.length > 0 ? "bonus" : "finish");
      } else if (bonusTasks.length > 0) {
        goToBonusPrompt();
      } else {
        finishLesson(earnedXp);
      }
      return;
    }

    // Bonus suallar bitdi: bonusdakı səhvləri təkrarlat, sonra bitir.
    if (wrongIds.length > 0) startRetry(wrongIds, "finish");
    else finishLesson(earnedXp);
  }

  // Verilən id-lərdəki səhv tapşırıqları təkrar növbəsinə al; boşdursa hədəfə keç.
  function startRetry(ids: string[], target: "bonus" | "finish") {
    const all = [...mainTasks, ...bonusTasks];
    const retry = ids
      .map((id) => all.find((tk) => tk.id === id))
      .filter((tk): tk is Task => !!tk);
    if (retry.length === 0) {
      if (target === "bonus") goToBonusPrompt();
      else finishLesson(earnedXp);
      return;
    }
    setRetryQueue(retry);
    setRetryTotal(retry.length);
    setAfterRetry(target);
    setAnswer(null);
    setChecked(false);
    shownAtRef.current = Date.now();
    setPhase("retry");
  }

  function goToBonusPrompt() {
    setPhase("bonusPrompt");
    setIndex(0);
    setAnswer(null);
    setChecked(false);
  }

  function startBonus() {
    setPhase("bonus");
    setIndex(0);
    setAnswer(null);
    setChecked(false);
  }

  // ── Bonus təklifi ──
  if (phase === "bonusPrompt") {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="flex justify-center">
          <Mascot size={92} mood="celebrate" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-fg">{t("run.mainDone")}</h1>
        <p className="mt-2 text-muted">
          {t("run.earnedSoFar").replace("{n}", String(earnedXp))}
        </p>
        <p className="mt-4 text-muted">
          {t("run.bonusOffer").replace("{n}", String(bonusTasks.length))}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={startBonus}
            className="rounded-2xl bg-brand px-5 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
          >
            {t("run.startBonus")}
          </button>
          <button
            onClick={() => finishLesson(earnedXp)}
            className="rounded-2xl border-2 border-line px-5 py-3 font-bold text-fg btn-pop btn-pop-ghost hover:border-brand"
          >
            {t("run.finish")}
          </button>
        </div>
      </div>
    );
  }

  // ── Nəticə (bayram) ──
  if (phase === "done") {
    // Onboarding axını: statistika → mükafat zənciri → qeydiyyat.
    if (guest && rewards) {
      return (
        <RewardChain
          xp={earnedXp}
          onFinish={() => router.push("/signup?from=onboarding")}
          onSkip={() => router.push(`/subjects/${slug}?onboarding=1`)} // "Sonra" — qonaq kimi yolda davam
        />
      );
    }
    return (
      <DoneScreen
        slug={slug}
        earnedXp={earnedXp}
        accuracy={answered ? Math.round((correctCount / answered) * 100) : 0}
        bestCombo={bestCombo}
        leveledUp={
          startXp !== null &&
          levelFromXp(startXp).level < levelFromXp(startXp + earnedXp).level
        }
        newLevel={startXp !== null ? levelFromXp(startXp + earnedXp).level : 0}
        guest={guest}
        onGuestContinue={() => setRewards(true)}
      />
    );
  }

  // Son sualda: hələ təkrar/bonus varsa "Davam et", həqiqi son isə "Bitir".
  // (Səhvlərin təkrarı HƏMİŞƏ bitir/bonusdan əvvəl gəlir.)
  const willRetry = wrongIds.length > 0;
  const isLast = index + 1 >= total;

  // ── Tapşırıq (main və ya bonus) — immersiv tam-ekran ──
  const ctaText = inRetry
    ? t("run.next")
    : !isLast
      ? t("run.next")
      : inBonus
        ? willRetry
          ? t("run.continue")
          : t("run.finish")
        : willRetry || bonusTasks.length > 0
          ? t("run.continue")
          : t("run.finish");

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      {/* Dərsdən çıxış təsdiqi — yarımçıq dərs itir, ona görə soruşulur */}
      <AnimatePresence>
        {quitOpen && (
          <QuitDialog
            answered={answered}
            total={total}
            onStay={() => setQuitOpen(false)}
            onLeave={() => router.push(`/subjects/${slug}`)}
          />
        )}
      </AnimatePresence>

      {/* Cavab flaşı — bütün ekran qısa yaşıl/qırmızı parıltı */}
      <AnimatePresence>
        {checked && (
          <motion.div
            key={`flash-${answered}`}
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`pointer-events-none fixed inset-0 z-20 ${
              lastCorrect
                ? "bg-[radial-gradient(circle_at_50%_60%,rgba(16,185,129,0.35),transparent_70%)]"
                : "bg-[radial-gradient(circle_at_50%_60%,rgba(239,68,68,0.28),transparent_70%)]"
            }`}
          />
        )}
      </AnimatePresence>

      {/* Yuxarı bar: X + qalın progress + combo */}
      <div className="mx-auto flex w-full max-w-xl items-center gap-4 px-4 pt-5">
        <button
          type="button"
          onClick={() => {
            // Heç nə həll edilməyibsə itiriləsi bir şey yoxdur — birbaşa çıx.
            if (answered === 0) router.push(`/subjects/${slug}`);
            else setQuitOpen(true);
          }}
          aria-label={t("run.quitLeave")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-panel-2 hover:text-fg"
        >
          <X size={26} />
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-panel-2">
          <motion.div
            className={`h-full origin-left rounded-full ${inRetry ? "bg-orange-500" : inBonus ? "bg-accent" : "bg-brand"}`}
            initial={false}
            animate={{ scaleX: Math.max(progressPct / 100, 0.02) }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            style={{ width: "100%" }}
          />
        </div>
        <AnimatePresence>
          {combo >= 2 && !checked && !inRetry && (
            <motion.span
              key={combo}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [1.35, 1], opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="shrink-0 rounded-full bg-orange-500/15 px-2.5 py-1 text-sm font-extrabold text-orange-500"
            >
              🔥 {combo}
            </motion.span>
          )}
        </AnimatePresence>
        {/* Canlar */}
        <span
          className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-sm font-extrabold text-red-500"
          aria-label={`${hearts} can`}
        >
          <Heart size={16} fill="currentColor" strokeWidth={0} />
          {plus ? "∞" : hearts}
        </span>
      </div>

      {/* Canlar bitdi — mülayim xəbərdarlıq (bloklamır) */}
      <AnimatePresence>
        {heartsOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm rounded-3xl border border-line bg-panel p-6 text-center"
            >
              <div className="flex justify-center gap-1 text-red-500">
                {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                  <Heart key={i} size={22} className="opacity-30" fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <h2 className="mt-4 text-xl font-extrabold text-fg">{t("hearts.outTitle")}</h2>
              <p className="mt-2 text-sm text-muted">{t("hearts.outBody")}</p>
              <div className="mt-6 flex flex-col gap-2">
                {/* Qonaqda /praktika ÖLÜ LİNKDİR (giriş tələb edir) — ona görə
                    onboarding rejimində praktika təklifi göstərilmir. */}
                {!guest && (
                  <Link
                    href="/praktika"
                    className="rounded-2xl bg-brand px-5 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
                  >
                    {t("hearts.practice")}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setHeartsOut(false)}
                  className={
                    guest
                      ? "rounded-2xl bg-brand px-5 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
                      : "rounded-2xl border-2 border-line px-5 py-3 font-bold text-fg btn-pop btn-pop-ghost hover:border-brand"
                  }
                >
                  {t("hearts.continue")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sual sahəsi */}
      <div className="mx-auto w-full max-w-xl flex-1 px-4 pt-8 pb-44">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
          {inRetry ? (
            <>
              🔁 {t("run.retry")} {retryTotal - retryQueue.length + 1} / {retryTotal}
              <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-orange-500">
                {t("run.retry")}
              </span>
            </>
          ) : (
            <>
              {inBonus ? t("run.bonus") : t("run.task")} {index + 1} / {total}
              {inBonus && (
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-accent">
                  {t("run.bonus")}
                </span>
              )}
            </>
          )}
        </div>
        <h2 className="mt-3 text-2xl font-bold text-fg">{task.prompt}</h2>
        <TaskFigure figure={task.figure} />
        <div className="mt-7">
          <TaskInput
            task={task}
            value={answer}
            onChange={(v) => setAnswer(v)}
            disabled={checked}
            reveal={checked}
          />
        </div>
      </div>

      {/* Aşağı YOXLA çubuğu */}
      <AnimatePresence>
        {!checked && (
          <motion.div
            key="checkbar"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-panel"
          >
            <div className="mx-auto max-w-xl px-4 py-4">
              <button
                type="button"
                onClick={handleCheck}
                disabled={answer === null || answer === ""}
                className="w-full rounded-2xl bg-brand px-5 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("run.check")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nəticə lövhəsi */}
      <AnimatePresence>
        {checked && (
          <ResultSheet
            key="sheet"
            correct={lastCorrect}
            correctText={correctAnswerText(task)}
            comboBonus={comboBonus}
            ctaLabel={ctaText}
            taskId={task.id}
            onContinue={advance}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Şagirdin SEÇDİYİ cavabı mətn kimi qaytarır (jurnal üçün). Çoxseçimlidə indeks
// YOX, mətn saxlanılır: balance.ts variantları qarışdırdığı üçün eyni indeks
// re-seed-dən sonra tamam başqa cavabı göstərər və köhnə jurnal yalan danışar.
function chosenAnswerText(task: Task, answer: UserAnswer): string | null {
  if (task.type === "multiple_choice" || task.type === "listening") {
    return task.options[Number(answer)] ?? null;
  }
  return String(answer);
}

// Tapşırığın düzgün cavabını mətn kimi qaytarır (nəticə lövhəsi üçün).
function correctAnswerText(task: Task): string {
  if (task.type === "multiple_choice") return task.options[task.correctIndex];
  if (task.type === "numeric") return String(task.answer);
  if (task.type === "listening") return task.options[task.correctIndex];
  if (task.type === "word_order") return task.answer;
  return task.accepted[0] ?? "";
}

// ── Bayram ekranı ──
function DoneScreen({
  slug,
  earnedXp,
  accuracy,
  bestCombo,
  leveledUp,
  newLevel,
  guest = false,
  onGuestContinue,
}: {
  slug: string;
  earnedXp: number;
  accuracy: number;
  bestCombo: number;
  leveledUp: boolean;
  guest?: boolean;
  onGuestContinue?: () => void;
  newLevel: number;
}) {
  const t = useT();
  const xp = useCountUp(earnedXp, 900);
  const perfect = accuracy === 100;

  useEffect(() => {
    vibrateCelebrate();
    if (perfect) setTimeout(() => playStreak(), 550); // qüsursuz → əlavə parıltı səsi
  }, [perfect]);

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
          <Mascot size={110} mood="celebrate" />
        </motion.div>
      </motion.div>

      {perfect && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 14 }}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-amber-950 shadow-lg shadow-amber-500/30"
        >
          ✨ {t("cel.perfect")} ✨
        </motion.div>
      )}

      {leveledUp && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.25, 1], opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-accent"
        >
          ⭐ {t("cel.levelUp")} — {t("level.label")} {newLevel}
        </motion.div>
      )}

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-4 text-2xl font-bold text-fg"
      >
        {t("cel.done")}
      </motion.h1>

      <motion.div
        className="mt-6 grid grid-cols-3 gap-3"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } }}
      >
        <Stat value={`+${xp}`} label={t("cel.xp")} tone="text-accent" />
        <Stat value={`${accuracy}%`} label={t("cel.accuracy")} tone="text-emerald-500" />
        <Stat value={`🔥 ${bestCombo}`} label={t("cel.combo")} tone="text-orange-500" />
      </motion.div>

      {/* Onboarding: hesabsız oynanan ilk dərsdən sonra tərəqqini saxlamaq üçün
          profil təklif olunur (Duolingo modeli). Adi dərsdə isə yola qayıdırıq. */}
      {guest ? (
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={onGuestContinue}
            className="rounded-2xl bg-brand px-5 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
          >
            Davam et
          </button>
        </div>
      ) : (
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={`/subjects/${slug}`}
            className="rounded-2xl bg-brand px-5 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
          >
            {t("run.backToPath")}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-2xl border-2 border-line px-5 py-3 font-bold text-fg btn-pop btn-pop-ghost hover:border-brand"
          >
            {t("run.home")}
          </Link>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.8 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 18 } },
      }}
      className="rounded-2xl border border-line bg-panel px-3 py-4"
    >
      <div className={`text-xl font-extrabold ${tone}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-muted">{label}</div>
    </motion.div>
  );
}
