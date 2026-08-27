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
import { Gift } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Başlıq */}
        <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-brand to-brand-dark p-5 text-white shadow-lg">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm">
            <Mascot size={56} mood={doneCount === list.length ? "celebrate" : "happy"} disk={false} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold">{t("quest.title")}</h1>
            <p className="text-sm text-white/85">
              {doneCount}/{list.length}
            </p>
          </div>
        </div>

        {/* Gündəlik tapşırıqlar */}
        <div className="mt-5 space-y-4">
          {list.map((q) => {
            const val = questValue(quests, q.kind);
            const done = isQuestDone(quests, q);
            const label = t(q.labelKey).replace("{n}", String(q.goal));
            return (
              <div key={q.id} className="rounded-2xl border border-line bg-panel p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className={done ? "font-bold text-emerald-600" : "font-semibold text-fg"}>
                    {label}
                  </span>
                  <span className="text-xs font-bold text-accent">+{q.rewardXp} XP</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-panel-2">
                    <div
                      className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : "bg-brand"}`}
                      style={{ width: `${Math.min((val / q.goal) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-xs text-muted">
                    {Math.min(val, q.goal)}/{q.goal}
                  </span>
                </div>
              </div>
            );
          })}

          {chestAvailable(quests) && (
            <button
              type="button"
              onClick={() => setChestOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl border-2 border-accent/40 bg-accent/10 px-4 py-3 text-left transition hover:bg-accent/15"
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
