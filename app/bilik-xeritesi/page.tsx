"use client";

// Bilik Xəritəsi — şagirdin hansı BACARIĞI nə qədər mənimsədiyi.
//
// Niyə dərs siyahısı deyil: dərs "Kəsrlər 67%" deyir, bu isə "ortaq məxrəc 41%"
// deyir. Fərq mühümdür — şagird nəyi məşq edəcəyini dəqiq görür.
//
// Sınanmamış bacarıq GÖSTƏRİLMİR: "0%" şagirdə bilmədiyi kimi görünür, halbuki
// sadəcə hələ qarşısına çıxmayıb.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Target, ChevronRight } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { userGrade } from "@/lib/grade";
import { SKILLS } from "@/lib/skills";
import { fetchMastery, knowledgeMap, isWeak, type MasteryMap, type MapRow } from "@/lib/mastery";
import { useT } from "@/lib/i18n";
import { PageSkeleton } from "@/components/Skeleton";
import Mascot from "@/components/Mascot";

// Mənimsəməyə görə rəng — göz bir baxışda zəifi tapsın.
function tone(m: number): { bar: string; text: string } {
  if (m >= 85) return { bar: "bg-emerald-500", text: "text-emerald-600" };
  if (m >= 70) return { bar: "bg-lime-500", text: "text-lime-600" };
  if (m >= 55) return { bar: "bg-amber-500", text: "text-amber-600" };
  return { bar: "bg-rose-500", text: "text-rose-600" };
}

export default function KnowledgeMapPage() {
  const { user, ready } = useAuthUser();
  const [mastery, setMastery] = useState<MasteryMap | null>(null);
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (user) fetchMastery().then(setMastery);
  }, [user]);

  const groups = useMemo<Map<string, MapRow[]>>(
    () => (mastery ? knowledgeMap(mastery, SKILLS, userGrade(user)) : new Map()),
    [mastery, user],
  );

  const weakest = useMemo(() => {
    if (!mastery) return null;
    const rows = [...groups.values()].flat().filter((r) => isWeak(mastery, r.id));
    return rows.length ? rows.sort((a, b) => a.stat!.mastery - b.stat!.mastery)[0] : null;
  }, [groups, mastery]);

  if (!ready || !user || !mastery) return <PageSkeleton />;

  const empty = groups.size === 0;

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold text-fg">{t("map.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("map.subtitle")}</p>

        {empty ? (
          <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl border border-line bg-panel p-8 text-center">
            <Mascot size={72} mood="happy" />
            <p className="max-w-sm text-sm text-muted">{t("map.empty")}</p>
          </div>
        ) : (
          <>
            {/* Ən zəif bacarıq — birbaşa məşqə keçid */}
            {weakest && (
              <button
                type="button"
                onClick={() => router.push("/praktika")}
                className="mt-6 flex w-full items-center gap-4 rounded-3xl bg-rose-500 p-5 text-left text-white transition hover:bg-rose-600"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                  <Target size={22} />
                </span>
                <span className="flex-1">
                  <span className="block text-xs font-bold uppercase tracking-wide text-white/80">
                    {t("map.weakest")}
                  </span>
                  <span className="block text-lg font-extrabold">{weakest.title}</span>
                  <span className="block text-sm text-white/85">{t("map.practise")}</span>
                </span>
                <ChevronRight size={20} className="shrink-0 text-white/80" />
              </button>
            )}

            {[...groups.entries()].map(([group, rows]) => (
              <section key={group} className="mt-6">
                <h2 className="text-xs font-bold uppercase tracking-wide text-muted">{group}</h2>
                <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-panel">
                  {rows.map((r) => {
                    const m = r.stat!.mastery;
                    const c = tone(m);
                    return (
                      <div key={r.id} className="border-b border-line px-4 py-3 last:border-b-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm font-bold text-fg">{r.title}</span>
                          <span className={`text-sm font-extrabold tabular-nums ${c.text}`}>{m}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel-2">
                          <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${m}%` }} />
                        </div>
                        <div className="mt-1 text-xs text-muted">
                          {r.stat!.attempts} {t("map.attempts")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
