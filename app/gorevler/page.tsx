"use client";

// Görevlər (Quests) — gündəlik tapşırıqlar + mükafat sandığı.
// Dashboard-dakı quest məntiqini təkrar istifadə edir (ayrıca səhifə).

import { useEffect, useState } from "react";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  todaysQuests,
  questValue,
  isQuestDone,
  syncQuestRewards,
  loadQuestState,
  chestAvailable,
  openChest,
  type QuestState,
} from "@/lib/quests";
import { track } from "@/lib/analytics";
import { useT } from "@/lib/i18n";
import { PageSkeleton } from "@/components/Skeleton";
import Mascot from "@/components/Mascot";
import ChestModal from "@/components/ChestModal";
import RadialProgress from "@/components/RadialProgress";
import OrderBadge from "@/components/OrderBadge";
import { loadMonthly, monthlyBadgeTier, MONTHLY_TIERS } from "@/lib/monthly";
import { Gift, Target, Zap, CircleCheck, Check, Lock, CalendarDays } from "lucide-react";

export default function QuestsPage() {
  const { user, ready } = useAuthUser();
  const [quests, setQuests] = useState<QuestState | null>(null);
  const [chestOpen, setChestOpen] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!user) return;
    syncQuestRewards(user.id)
      .then(setQuests)
      .catch(() => loadQuestState().then(setQuests).catch(() => {}));
  }, [user]);

  if (!ready || !user || !quests) return <PageSkeleton />;

  const list = todaysQuests(quests.date);
  const doneCount = list.filter((q) => isQuestDone(quests, q)).length;
  const allDone = doneCount === list.length;
  const canOpen = chestAvailable(quests);

  // Aylıq nişan: cari ayın XP-si və növbəti pilləyə qalan.
  const monthly = loadMonthly(user.user_metadata);
  const monthTier = monthlyBadgeTier(monthly.xp);
  const nextGoal = MONTHLY_TIERS.find((g) => monthly.xp < g) ?? null;
  const prevGoal = monthTier > 0 ? MONTHLY_TIERS[monthTier - 1] : 0;
  const monthPct = nextGoal === null ? 100 : ((monthly.xp - prevGoal) / (nextGoal - prevGoal)) * 100;

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Başlıq — Hədəflərin menyu rəngi (bənövşəyi) + tamamlanma halqası */}
        <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-violet-500 to-purple-600 p-5 text-white shadow-[0_5px_0_0_#6b21a8]">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm">
            <Mascot size={56} mood={allDone ? "celebrate" : "happy"} disk={false} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold">{t("quest.title")}</h1>
            <p className="text-sm text-white/85">
              {allDone ? t("quest.allDone") : `${doneCount}/${list.length}`}
            </p>
          </div>
          <RadialProgress value={(doneCount / list.length) * 100} size={64} stroke={7} onColor />
        </div>

        {/* Gündəlik hədəflər */}
        <div className="mt-5 space-y-3">
          {list.map((q) => {
            const val = questValue(quests, q.kind);
            const done = isQuestDone(quests, q);
            const label = t(q.labelKey).replace("{n}", String(q.goal));
            const k = QUEST_KIND[q.kind] ?? QUEST_KIND.xp;
            return (
              <div key={q.id} className={`flex items-center gap-3.5 p-4 ${CARD}`}>
                <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${k.tile}`}>
                  <k.Icon size={24} strokeWidth={2.5} />
                  {done && (
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-card">
                      <Check size={12} strokeWidth={3.5} />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className={`truncate ${done ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-semibold text-fg"}`}>
                      {label}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-muted">
                      {Math.min(val, q.goal)}/{q.goal}
                    </span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-panel-2">
                    <div
                      className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : "bg-violet-500"}`}
                      style={{ width: `${Math.min((val / q.goal) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                {/* Mükafat — real olanı: hədəf XP verir. */}
                <span
                  className={`flex shrink-0 items-center gap-0.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${
                    done ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : "bg-amber-400/15 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {done ? <Check size={13} strokeWidth={3} /> : <Zap size={13} fill="currentColor" strokeWidth={0} />}+{q.rewardXp} XP
                </span>
              </div>
            );
          })}
        </div>

        {/* Gündəlik sandıq — həmişə görünür: kilidli · hazır · açılıb */}
        {canOpen ? (
          <div className="mt-4 flex items-center gap-4 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-300/25 to-orange-400/15 p-4 shadow-[0_4px_0_0_#f59e0b]">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-accent text-white shadow-sm">
              <Gift size={30} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-fg">{t("chest.readyShort")}</div>
              <div className="text-xs text-muted">{t("chest.title")}</div>
            </div>
            <button
              type="button"
              onClick={() => setChestOpen(true)}
              className="shrink-0 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white btn-pop [--pop:#b45309] hover:bg-amber-600"
            >
              {t("quest.chestOpenCta")}
            </button>
          </div>
        ) : quests.chestOpened ? (
          <div className={`mt-4 flex items-center gap-4 p-4 ${CARD}`}>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600">
              <Gift size={28} />
            </span>
            <div className="min-w-0 flex-1 text-sm font-bold text-fg">{t("quest.chestDone")}</div>
          </div>
        ) : (
          <div className={`mt-4 flex items-center gap-4 p-4 ${CARD}`}>
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-accent text-white shadow-sm">
              <Gift size={28} />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-card text-muted ring-2 ring-line">
                <Lock size={12} strokeWidth={2.8} />
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-fg">{t("quest.chestLocked")}</div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-panel-2">
                  <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(doneCount / list.length) * 100}%` }} />
                </div>
                <span className="shrink-0 text-xs font-extrabold text-muted">{doneCount}/{list.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Aylıq nişan hədəfi */}
        <div className={`mt-4 flex items-center gap-4 p-4 ${CARD}`}>
          <OrderBadge Icon={CalendarDays} tier={monthTier} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-fg">{t("profile.monthly")}</span>
              <span className="shrink-0 rounded-full bg-panel-2 px-2 py-0.5 text-[11px] font-extrabold text-muted">{monthTier}/3</span>
            </div>
            <div className="mt-0.5 text-xs font-semibold text-muted">
              {t("quest.monthlyXp").replace("{n}", String(monthly.xp))}
              {" · "}
              {nextGoal === null
                ? t("quest.monthlyMax")
                : t("quest.monthlyNext").replace("{n}", String(nextGoal - monthly.xp))}
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-panel-2">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, monthPct))}%` }} />
            </div>
          </div>
        </div>
      </main>

      {chestOpen && user && (
        <ChestModal
          onOpen={async () => {
            const reward = await openChest(user.id);
            track("chest_opened", { reward: reward.kind });
            await loadQuestState().then(setQuests).catch(() => {});
            return reward;
          }}
          onClose={() => setChestOpen(false)}
        />
      )}
    </div>
  );
}

const CARD = "rounded-2xl border-2 border-line bg-card shadow-[0_4px_0_0_var(--color-line)]";

// /dashboard sağ panelindəki ilə eyni: növə görə ikon + rəngli plitə.
const QUEST_KIND: Record<string, { Icon: typeof Target; tile: string }> = {
  lessons: { Icon: Target, tile: "bg-violet-500/12 text-violet-600 dark:text-violet-300" },
  xp: { Icon: Zap, tile: "bg-amber-400/18 text-amber-600 dark:text-amber-300" },
  correct: { Icon: CircleCheck, tile: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
};
