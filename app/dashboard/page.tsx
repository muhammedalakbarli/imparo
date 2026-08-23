"use client";

// Öyrən səhifəsi: statistika zolağı + fənn tabları + öyrənmə yolu.
// (Holberton radar/qrafik və son tarixlər çıxarıldı.)

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flame, Shield, Heart, Gem, Gift, Trophy, ChevronRight, ChevronDown, Crown } from "lucide-react";
import { useContent } from "@/components/ContentProvider";
import { loadProgress, loadActiveDays, lessonState, type ProgressState } from "@/lib/progress";
import { getFriends } from "@/lib/friends";
import { loadHearts, MAX_HEARTS } from "@/lib/hearts";
import { loadPlus } from "@/lib/plus";
import StreakPopover from "@/components/StreakPopover";
import { useAuthUser } from "@/lib/useAuthUser";
import { userGrade, subjectsForGrade } from "@/lib/grade";
import { track } from "@/lib/analytics";
import { useT } from "@/lib/i18n";
import {
  syncQuestRewards,
  todaysQuests,
  questValue,
  isQuestDone,
  chestAvailable,
  openChest,
  loadQuestState,
  type QuestState,
} from "@/lib/quests";
import ChestModal from "@/components/ChestModal";
import RadialProgress from "@/components/RadialProgress";
import LearningPath, { type PathNode } from "@/components/LearningPath";
import { PageSkeleton } from "@/components/Skeleton";
import Mascot from "@/components/Mascot";
import type { Subject } from "@/lib/types";

export default function DashboardPage() {
  const { user, ready } = useAuthUser();
  const { subjects, loading: contentLoading } = useContent();
  // Yalnız istifadəçinin sinfinə (onboarding) uyğun fənlər.
  const grade = userGrade(user);
  const shown = useMemo(() => subjectsForGrade(subjects, user), [subjects, user]);
  const [state, setState] = useState<ProgressState | null>(null);
  const [activeSlug, setActiveSlug] = useState("");
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [friendStreaks, setFriendStreaks] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [plus, setPlus] = useState(false);
  const [quests, setQuests] = useState<QuestState | null>(null);
  const [chestOpen, setChestOpen] = useState(false);
  const t = useT();

  // Seriya pəncərəsi hover-də dərhal açılır — data əvvəlcədən yüklənməlidir,
  // yoxsa pəncərə boş həftə zolağı ilə görünür.
  useEffect(() => {
    if (!user) return;
    loadActiveDays(user.id).then(setActiveDays).catch(() => {});
    getFriends()
      .then((f) => setFriendStreaks(f.filter((x) => x.friendStreak > 0).length))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (user) loadProgress(user.id).then(setState);
  }, [user]);
  useEffect(() => {
    if (user) loadHearts().then(setHearts).catch(() => {});
  }, [user]);
  useEffect(() => {
    if (user) loadPlus().then(setPlus).catch(() => {});
  }, [user]);
  // Gündəlik quest mükafatını ver + cari halı yüklə (desktop sağ sütun üçün).
  useEffect(() => {
    if (!user) return;
    syncQuestRewards(user.id)
      .then((qs) => {
        setQuests(qs);
        return loadProgress(user.id);
      })
      .then(setState)
      .catch(() => {});
  }, [user]);

  // Aktiv fənn həmişə göstərilən (sinif üzrə) siyahının içindən; ilk yükləmədə birincisi.
  const active = shown.find((s) => s.slug === activeSlug) ?? shown[0];

  // activeSlug göstərilən siyahıda deyilsə (sinif dəyişəndə) ilk fənnə keç.
  useEffect(() => {
    if (shown.length && !shown.some((s) => s.slug === activeSlug)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSlug(shown[0].slug);
    }
  }, [shown, activeSlug]);

  const { nodes, currentLesson, scorePct } = useMemo(() => {
    const completed = state?.completedLessons ?? [];
    const lessons = active ? active.units.flatMap((u) => u.lessons) : [];
    const order = lessons.map((l) => l.id);
    const nodes: PathNode[] = (active?.units ?? []).flatMap((u) =>
      u.lessons.map((l, li) => ({
        id: l.id,
        title: l.title,
        kind: l.kind ?? "lesson",
        state: lessonState(order, l.id, completed),
        href: `/lessons/${l.id}`,
        unitTitle: li === 0 ? u.title : undefined,
      })),
    );
    const currentLesson = lessons.find((l) => !completed.includes(l.id)) ?? null;
    const doneCount = lessons.filter((l) => completed.includes(l.id)).length;
    const scorePct = lessons.length
      ? Math.round((doneCount / lessons.length) * 100)
      : 0;
    return { nodes, currentLesson, scorePct };
  }, [active, state]);

  // Məzmun DB-dən yüklənənə qədər gözlə — əks halda əvvəlcə koddakı (bəlkə köhnə)
  // struktur göstərilir, sonra DB-dəki ilə əvəzlənir → path "yanıb-sönür".
  if (!ready || !state || contentLoading) return <PageSkeleton />;

  // Bu sinif üçün hələ məzmun yoxdursa (məs. 7–8-ci sinif) — dostcasına mesaj.
  if (shown.length === 0 || !active) {
    return (
      <div className="min-h-screen bg-ink">
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <Mascot size={90} mood="happy" />
          <h1 className="mt-5 text-2xl font-bold text-fg">{t("dash.gradeSoonTitle")}</h1>
          <p className="mt-2 text-muted">
            {t("dash.gradeSoon").replace("{n}", String(grade))}
          </p>
          <Link
            href="/ayarlar"
            className="mt-6 inline-block rounded-2xl bg-brand px-6 py-3 font-extrabold text-white btn-pop"
          >
            {t("dash.changeGrade")}
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Üst zolaq — sol: fənn seçici · sağ: streak/zümrüd/can (Duolingo kimi) */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <SubjectSwitcher
            subjects={shown}
            activeSlug={active.slug}
            onSelect={setActiveSlug}
            t={t}
          />
          <div className="flex shrink-0 items-center gap-5 sm:gap-6">
            {/* Alovun uzerinde evvel mavi qalxan nisani vardi — cixarildi.
                Dondurucu sayi indi hover penceresinde gosterilir. */}
            <StreakPopover
              streakDays={state.streakDays}
              streakFreezes={state.streakFreezes}
              activeDays={activeDays}
              friendStreaks={friendStreaks}
            >
              <StatMini Icon={Flame} value={state.streakDays} color="text-orange-500" />
            </StreakPopover>
            <StatMini Icon={Gem} value={state.gems} color="text-emerald-500" />
            <StatMini Icon={Heart} value={hearts} display={plus ? "∞" : undefined} color="text-red-500" />
          </div>
        </div>

        {/* Mobil: tək sütun · Desktop: mərkəz yol + sağ sütun */}
        <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-6">
          <div className="min-w-0">
            {/* Bölmə başlığı (Duolingo banner üslubu) */}
            <div className="mt-4 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-brand to-brand-dark p-5 text-white shadow-lg">
              <RadialProgress value={scorePct} size={64} stroke={6} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-extrabold">{t(`subject.${active.slug}`)}</h2>
                <p className="truncate text-sm text-white/80">
                  {currentLesson ? `${t("dash.next")}: ${currentLesson.title}` : t("dash.allDone")}
                </p>
              </div>
              {currentLesson && (
                <Link
                  href={`/lessons/${currentLesson.id}`}
                  className="shrink-0 rounded-2xl bg-white px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-brand btn-pop [--pop:#c9c2f5] hover:bg-white/90"
                >
                  {t("dash.resume")}
                </Link>
              )}
            </div>

            {/* Öyrənmə yolu */}
            <div className="mt-4">
              <LearningPath nodes={nodes} />
            </div>
          </div>

          {/* ── Sağ sütun (YALNIZ desktop) — Plus + Liqa + Gündəlik tapşırıqlar ── */}
          <aside className="hidden space-y-4 lg:block lg:sticky lg:top-4">
            {/* Imparo Plus promo (Plus üzvüsə — aktiv nişanı) */}
            <div className="overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-400/15 to-brand/10 p-5">
              <div className="flex items-center gap-2 text-sm font-extrabold text-brand">
                <Crown size={18} /> Imparo Plus
              </div>
              {plus ? (
                <>
                  <p className="mt-1 text-xs text-muted">Aktivdir — limitsiz can, 2× zümrüd 👑</p>
                  <Link href="/plus" className="mt-3 block text-center text-sm font-bold text-brand hover:underline">
                    Ətraflı
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-1 text-xs text-muted">
                    Limitsiz can, 2× zümrüd, valideyn hesabatı və daha çoxu.
                  </p>
                  <Link
                    href="/plus"
                    className="mt-3 block rounded-xl bg-brand py-2.5 text-center text-sm font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
                  >
                    Əldə et
                  </Link>
                </>
              )}
            </div>

            <Link
              href="/liqa"
              className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-5 transition hover:bg-panel-2"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                <Trophy size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-fg">{t("nav.league")}</span>
                <span className="block text-xs text-muted">{t("dash.leagueHint")}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-muted" />
            </Link>

            {quests && (
              <div className="rounded-2xl border border-line bg-panel p-5">
                <div className="mb-3 text-sm font-extrabold text-fg">{t("quest.title")}</div>
                <div className="space-y-3">
                  {todaysQuests(quests.date).map((q) => {
                    const val = questValue(quests, q.kind);
                    const done = isQuestDone(quests, q);
                    const label = t(q.labelKey).replace("{n}", String(q.goal));
                    return (
                      <div key={q.id}>
                        <div className="flex items-center justify-between text-sm">
                          <span className={done ? "font-bold text-emerald-600" : "font-semibold text-fg"}>
                            {label}
                          </span>
                          <span className="text-xs text-muted">
                            {Math.min(val, q.goal)}/{q.goal}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-panel-2">
                          <div
                            className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : "bg-brand"}`}
                            style={{ width: `${Math.min((val / q.goal) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {chestAvailable(quests) && (
                    <button
                      type="button"
                      onClick={() => setChestOpen(true)}
                      className="mt-1 flex w-full items-center gap-3 rounded-2xl border-2 border-accent/40 bg-accent/10 px-4 py-3 text-left transition hover:bg-accent/15"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-accent text-white shadow-sm">
                        <Gift size={24} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-extrabold text-fg">{t("chest.readyShort")}</span>
                        <span className="block text-xs text-muted">{t("chest.open")} →</span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Footer — Duolingo üslubu, günlük görevlərin altında (yalnız desktop) */}
            <DashboardFooter />
          </aside>
        </div>

        {chestOpen && user && (
          <ChestModal
            onOpen={async () => {
              const reward = await openChest(user.id);
              track("chest_opened", { reward: reward.kind });
              await loadProgress(user.id).then(setState).catch(() => {});
              await loadHearts().then(setHearts).catch(() => {});
              await loadQuestState().then(setQuests).catch(() => {});
              return reward;
            }}
            onClose={() => setChestOpen(false)}
          />
        )}
      </main>
    </div>
  );
}

// Fənn seçici — cari fənn göstərilir; üstünə basanda aşağı bar açılır,
// fənlər yana-sürüşən şəkil(ikon)+ad kartları kimi düzülür (Duolingo dil seçici).
function SubjectSwitcher({
  subjects,
  activeSlug,
  onSelect,
  t,
}: {
  subjects: Subject[];
  activeSlug: string;
  onSelect: (slug: string) => void;
  t: (k: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const active = subjects.find((s) => s.slug === activeSlug) ?? subjects[0];
  if (!active) return null;

  return (
    <div className="relative">
      {/* Cari fənn — trigger */}
      {/* Trigger — yalnız fənnin şəkli (ikonu) + ox; ad açılan bardadır */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t(`subject.${active.slug}`)}
        className="flex items-center gap-1 rounded-2xl border-2 border-line bg-panel p-1.5 pr-2 transition hover:border-brand"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-xl font-bold text-white">
          {active.icon}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* kənara toxununca bağla */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          {/* Aşağı açılan bar — yana sürüşən fənlər */}
          <div className="absolute left-0 top-full z-20 mt-2 w-[calc(100vw-2rem)] max-w-[460px] rounded-2xl border border-line bg-panel p-4 shadow-xl sm:w-[360px]">
            {/* Mobil: sağa-sola sürüşən · Desktop: aşağı-yuxarı sürüşən siyahı */}
            <div className="flex gap-3 overflow-x-auto pb-1 lg:max-h-80 lg:flex-col lg:gap-1 lg:overflow-x-visible lg:overflow-y-auto lg:pb-0">
              {subjects.map((s) => {
                const on = s.slug === activeSlug;
                return (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => {
                      onSelect(s.slug);
                      setOpen(false);
                    }}
                    className="flex w-20 shrink-0 flex-col items-center gap-1.5 lg:w-full lg:flex-row lg:items-center lg:gap-3 lg:rounded-xl lg:px-2 lg:py-1.5 lg:transition lg:hover:bg-panel-2"
                  >
                    <span
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold transition lg:h-11 lg:w-11 lg:text-lg ${
                        on
                          ? "bg-brand text-white ring-2 ring-brand ring-offset-2 ring-offset-panel lg:ring-0 lg:ring-offset-0"
                          : "bg-brand/10 text-brand hover:bg-brand/20"
                      }`}
                    >
                      {s.icon}
                    </span>
                    <span
                      className={`text-center text-xs leading-tight lg:flex-1 lg:text-left lg:text-sm ${
                        on ? "font-bold text-fg" : "text-muted"
                      }`}
                    >
                      {t(`subject.${s.slug}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Üst stat zolağı üçün kompakt element (ikon + rəqəm) — Duolingo top-bar üslubu.
function StatMini({
  Icon,
  value,
  color,
  badge,
  onClick,
  display,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string; fill?: string; strokeWidth?: number }>;
  value: number;
  color: string;
  badge?: number;
  onClick?: () => void;
  display?: string;
}) {
  const inner = (
    <>
      <span className="relative">
        <Icon size={26} className={color} fill="currentColor" strokeWidth={0} />
        {badge != null && badge > 0 && (
          <span className="absolute -left-2 -top-2 flex items-center gap-0.5 rounded-full bg-sky-500 px-1 py-0.5 text-[9px] font-extrabold text-white shadow ring-2 ring-ink">
            <Shield size={9} strokeWidth={2.5} />
            {badge}
          </span>
        )}
      </span>
      <span className="text-lg font-extrabold text-fg">{display ?? value}</span>
    </>
  );
  const cls = "relative flex items-center gap-1.5";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} transition active:scale-95`}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

// Dashboard footer — Duolingo üslubu link zolağı (sağ rail sonunda, desktop).
function DashboardFooter() {
  const t = useT();
  const links: { label: string; href: string }[] = [
    { label: t("ft.about"), href: "/haqqimizda" },
    { label: t("ft.blog"), href: "/blog" },
    { label: t("ft.shop"), href: "/magaza" },
    { label: t("ft.efficacy"), href: "/semerelilik" },
    { label: t("ft.careers"), href: "/karyera" },
    { label: t("ft.partners"), href: "/partnyorlar" },
    { label: t("ft.investors"), href: "/investorlar" },
    { label: t("ft.terms"), href: "/sertler" },
    { label: t("ft.privacy"), href: "/mexfilik" },
  ];
  return (
    <footer className="px-1 pt-2">
      <nav className="flex flex-wrap gap-x-4 gap-y-1.5">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-[11px] font-bold uppercase tracking-wide text-muted transition hover:text-fg"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="mt-3 text-[11px] font-semibold text-muted">© {new Date().getFullYear()} Imparo · {t("ft.rights")}</p>
    </footer>
  );
}
