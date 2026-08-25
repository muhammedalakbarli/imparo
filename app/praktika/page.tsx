"use client";

// Praktika Mərkəzi: Səhvlər · Qarışıq · Sürət raundu · Bölmə üzrə.
// İstənilən tapşırıq dəstini PracticeRunner ilə həll etdirir (dərsi tamamlamır).

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Shuffle, Timer, ChevronRight, Check, Target, Stethoscope } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { loadProgress, type ProgressState } from "@/lib/progress";
import { useContent } from "@/components/ContentProvider";
import { subjectsForGrade, userGrade } from "@/lib/grade";
import {
  fetchMastery,
  targetSkills,
  buildAdaptiveSet,
  diagnosticSkills,
  buildDiagnosticSet,
  type MasteryMap,
} from "@/lib/mastery";
import { getSkill, SKILLS } from "@/lib/skills";
import { loadDueTaskIds, markCorrect, addWrong } from "@/lib/srs";
import { refillHearts } from "@/lib/hearts";
import { flushAttempts } from "@/lib/attempts";
// DİQQƏT: "@/lib/content"-dən YOX — o, 25 fənn faylını (~500 ms CPU) bundle-a çəkir.
import { isPassageTask } from "@/lib/content/helpers";
import { isDailyDone, markDailyDone } from "@/lib/daily";
import { useT, hasKey } from "@/lib/i18n";
import type { Task } from "@/lib/types";
import { PageSkeleton } from "@/components/Skeleton";
import PracticeRunner from "@/components/lesson/PracticeRunner";
import Mascot from "@/components/Mascot";

const shuffle = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5);
const sample = <T,>(a: T[], n: number): T[] => shuffle(a).slice(0, n);

type Session = { tasks: Task[]; title: string; timed?: boolean; daily?: boolean; silent?: boolean };

export default function PracticePage() {
  const { user, ready } = useAuthUser();
  const { subjects, getTaskById } = useContent();
  const [state, setState] = useState<ProgressState | null>(null);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [activeSlug, setActiveSlug] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [dailyDone, setDailyDone] = useState(false);
  const [mastery, setMastery] = useState<MasteryMap>(new Map());
  const t = useT();

  // Yalnız istifadəçinin sinfinin fənləri (əks halda "Riyaziyyat" hər sinif üçün təkrarlanır).
  const shown = useMemo(() => subjectsForGrade(subjects, user), [subjects, user]);

  useEffect(() => {
    if (user) loadProgress(user.id).then(setState);
  }, [user]);
  useEffect(() => {
    loadDueTaskIds().then(setMistakes);
  }, []);
  // Bacarıq üzrə mənimsəmə (migration 0047) — adaptiv məşqin əsasıdır.
  useEffect(() => {
    if (user) fetchMastery().then(setMastery);
  }, [user]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) setDailyDone(isDailyDone(user.user_metadata));
  }, [user]);

  // activeSlug-u istifadəçinin sinfinin fənlərinə uyğunlaşdır.
  useEffect(() => {
    if (shown.length && !shown.some((s) => s.slug === activeSlug)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSlug(shown[0].slug);
    }
  }, [shown, activeSlug]);

  const completedTasks = useMemo(() => {
    const done = state?.completedLessons ?? [];
    return shown
      .flatMap((s) =>
        s.units.flatMap((u) =>
          u.lessons
            .filter((l) => done.includes(l.id))
            .flatMap((l) => [...l.tasks, ...(l.bonusTasks ?? [])]),
        ),
      )
      .filter((t) => !isPassageTask(t)); // mətnə bağlı reading suallarını praktikaya salma
  }, [state, shown]);

  // Adaptiv dəst: zəif bacarıqlar (prereq-i də zəifdirsə — onun KÖKÜ) üzrə
  // tapşırıqlar. Sinif həddi qoyulur ki, şagirdə hələ keçmədiyi mövzu düşməsin.
  const targets = useMemo(() => targetSkills(mastery), [mastery]);
  const adaptiveTasks = useMemo(
    () =>
      buildAdaptiveSet(subjects, targets, 10, {
        maxGrade: userGrade(user),
        exclude: isPassageTask,
      }),
    [subjects, targets, user],
  );

  // Diaqnostika: bacarıqları ƏHATƏ etmək üçün — hər bacarıqdan 2 sual, 20 hədd.
  const diagnosticTasks = useMemo(
    () =>
      buildDiagnosticSet(subjects, diagnosticSkills(mastery, SKILLS, userGrade(user)), 2, {
        maxGrade: userGrade(user),
        limit: 20,
        exclude: isPassageTask,
      }),
    [subjects, mastery, user],
  );

  const mistakeTasks = useMemo(
    () => mistakes.map(getTaskById).filter((t): t is Task => !!t && !isPassageTask(t)),
    [mistakes, getTaskById],
  );

  if (!ready || !state) return <PageSkeleton />;

  if (session) {
    return (
      <div className="min-h-screen bg-ink">
        <main className="mx-auto w-full max-w-xl px-4 py-8">
          <PracticeRunner
            tasks={session.tasks}
            title={session.title}
            timed={session.timed}
            silent={session.silent}
            onExit={() => {
              setSession(null);
              loadDueTaskIds().then(setMistakes);
              // ƏVVƏL buferi serverə göndər, SONRA mənimsəməni oxu — əks halda
              // yeni cəhdlər hələ bazada olmur və hədəflər köhnə qalır.
              flushAttempts()
                .then(() => fetchMastery())
                .then(setMastery)
                .catch(() => {});
            }}
            onCorrect={(id) => markCorrect(id)}
            onWrong={(id) => addWrong(id)}
            onFinish={() => {
              // Praktika bitəndə canları tam bərpa et (məşq mükafatı).
              refillHearts().catch(() => {});
              if (session.daily) {
                markDailyDone();
                setDailyDone(true);
              }
            }}
          />
        </main>
      </div>
    );
  }

  const active = shown.find((s) => s.slug === activeSlug) ?? shown[0];
  const speedPool = completedTasks.filter((t) => t.type === "multiple_choice");
  // Gündəlik hovuzun ehtiyatı da yalnız istifadəçinin sinfindən olsun.
  const gradeAllTasks = shown
    .flatMap((s) => s.units.flatMap((u) => u.lessons.flatMap((l) => [...l.tasks, ...(l.bonusTasks ?? [])])))
    .filter((t) => !isPassageTask(t));
  const dailyPool = completedTasks.length >= 5 ? completedTasks : gradeAllTasks;

  function startDaily() {
    setSession({ tasks: sample(dailyPool, 5), title: t("practice.daily"), daily: true });
  }

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold text-fg">{t("practice.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("practice.subtitle")}</p>

        {/* Gündəlik challenge */}
        <div className="mt-6 flex items-center gap-4 rounded-3xl bg-brand p-5 text-white">
          {/* Ağ dairə — narıncı Zefi narıncı kartla qarışmasın */}
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm">
            <Mascot size={56} mood={dailyDone ? "celebrate" : "happy"} disk={false} />
          </span>
          <div className="flex-1">
            <div className="text-lg font-extrabold">{t("practice.daily")}</div>
            <div className="text-sm text-white/85">
              {dailyDone ? t("practice.dailyDone") : t("practice.dailyDesc")}
            </div>
          </div>
          {dailyDone ? (
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <Check size={24} strokeWidth={3} />
            </span>
          ) : (
            <button
              type="button"
              onClick={startDaily}
              className="rounded-2xl bg-white px-5 py-2.5 font-extrabold uppercase tracking-wide text-brand btn-pop [--pop:#c9c2f5] hover:bg-white/90"
            >
              {t("dash.start")}
            </button>
          )}
        </div>

        {/* Rejim kartları */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ModeCard
            Icon={AlertCircle}
            tint="text-orange-500"
            title={t("practice.mistakes")}
            desc={
              mistakeTasks.length > 0
                ? `${mistakeTasks.length} ${t("practice.tasks")}`
                : t("practice.noMistakes")
            }
            disabled={mistakeTasks.length === 0}
            onClick={() =>
              setSession({ tasks: shuffle(mistakeTasks), title: t("practice.mistakes") })
            }
          />
          <ModeCard
            Icon={Target}
            tint="text-rose-500"
            title={t("practice.adaptive")}
            desc={
              targets.length
                ? (getSkill(targets[0])?.title ?? t("practice.adaptiveDesc"))
                : t("practice.adaptiveNone")
            }
            disabled={adaptiveTasks.length === 0}
            onClick={() =>
              setSession({ tasks: adaptiveTasks, title: t("practice.adaptive") })
            }
          />
          <ModeCard
            Icon={Shuffle}
            tint="text-brand"
            title={t("practice.mixed")}
            desc={t("practice.mixedDesc")}
            disabled={completedTasks.length === 0}
            onClick={() =>
              setSession({ tasks: sample(completedTasks, 10), title: t("practice.mixed") })
            }
          />
          <ModeCard
            Icon={Stethoscope}
            tint="text-sky-500"
            title={t("practice.diagnostic")}
            desc={t("practice.diagnosticDesc")}
            disabled={diagnosticTasks.length === 0}
            onClick={() =>
              setSession({
                tasks: diagnosticTasks,
                title: t("practice.diagnostic"),
                silent: true,
              })
            }
          />
          <ModeCard
            Icon={Timer}
            tint="text-emerald-500"
            title={t("practice.speed")}
            desc={t("practice.speedDesc")}
            disabled={speedPool.length === 0}
            onClick={() =>
              setSession({ tasks: speedPool, title: t("practice.speed"), timed: true })
            }
          />
        </div>

        {/* Bölmə üzrə praktika */}
        <h2 className="mt-8 text-lg font-bold text-fg">{t("practice.byUnit")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {shown.map((s) => {
            const on = s.slug === activeSlug;
            return (
              <button
                key={s.slug}
                onClick={() => setActiveSlug(s.slug)}
                className={`rounded-2xl px-4 py-2 text-sm font-extrabold uppercase tracking-wide transition ${
                  on
                    ? "bg-brand text-white btn-pop"
                    : "border-2 border-line bg-panel text-muted hover:bg-panel-2"
                }`}
              >
                {t(`subject.${s.slug}`)}
              </button>
            );
          })}
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-panel">
          {(active?.units ?? []).map((u) => {
            const unitTasks = u.lessons.flatMap((l) => [
              ...l.tasks,
              ...(l.bonusTasks ?? []),
            ]);
            // İ18n açarı varsa tərcümə, yoxsa DB başlığı (admin paneldən yaradılan
            // bölmələr üçün xam "unit.<id>" göstərilməsin).
            const unitName = hasKey(`unit.${u.id}`) ? t(`unit.${u.id}`) : u.title;
            return (
              <button
                key={u.id}
                onClick={() => setSession({ tasks: sample(unitTasks, 10), title: unitName })}
                className="flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left transition last:border-b-0 hover:bg-panel-2"
              >
                <span className="flex-1 font-bold text-fg">{unitName}</span>
                <span className="text-xs text-muted">
                  {unitTasks.length} {t("practice.tasks")}
                </span>
                <ChevronRight size={18} className="text-muted" />
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function ModeCard({
  Icon,
  tint,
  title,
  desc,
  disabled,
  onClick,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tint: string;
  title: string;
  desc: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-start gap-4 rounded-2xl border border-line bg-panel p-5 text-left transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-panel-2 ${tint}`}>
        <Icon size={24} />
      </span>
      <div>
        <div className="font-extrabold text-fg">{title}</div>
        <div className="mt-0.5 text-sm text-muted">{desc}</div>
      </div>
    </button>
  );
}
