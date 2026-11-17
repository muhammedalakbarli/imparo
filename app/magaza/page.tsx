"use client";

// Mağaza (Shop) — zümrüdləri xərclə: canları doldur, seriya qoruyucu al.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gem, Heart, Shield, Crown, ChevronRight, Target, BookOpenCheck, Gift, type LucideIcon } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { loadGems, spendGems, SHOP_PRICES } from "@/lib/gems";
import { refillHearts, loadHearts, MAX_HEARTS } from "@/lib/hearts";
import { grantStreakFreeze, loadProgress } from "@/lib/progress";
import { loadPlus } from "@/lib/plus";
import { track } from "@/lib/analytics";
import { useT } from "@/lib/i18n";
import { PageSkeleton } from "@/components/Skeleton";

type Flash = { id: string; kind: "ok" | "no" | "full" } | null;

export default function ShopPage() {
  const { user, ready } = useAuthUser();
  const [gems, setGems] = useState<number | null>(null);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [freezes, setFreezes] = useState(0);
  const [plus, setPlus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);
  const t = useT();

  useEffect(() => {
    if (!user) return;
    loadGems().then(setGems).catch(() => setGems(0));
    loadHearts().then(setHearts).catch(() => {});
    loadProgress(user.id).then((p) => setFreezes(p.streakFreezes)).catch(() => {});
    loadPlus().then(setPlus).catch(() => {});
  }, [user]);

  if (!ready || !user || gems === null) return <PageSkeleton />;

  async function buy(id: "refillHearts" | "streakFreeze", price: number) {
    if (busy) return;
    // Canlar artıq doludursa boş yerə xərcləmə.
    if (id === "refillHearts" && hearts >= MAX_HEARTS) {
      setFlash({ id, kind: "full" });
      return;
    }
    if ((gems ?? 0) < price) {
      setFlash({ id, kind: "no" });
      return;
    }
    setBusy(true);
    try {
      const left = await spendGems(price);
      if (left < 0) {
        setFlash({ id, kind: "no" });
        return;
      }
      setGems(left);
      if (id === "refillHearts") setHearts(await refillHearts());
      else {
        await grantStreakFreeze();
        setFreezes((n) => n + 1);
      }
      track("shop_purchase", { item: id, price });
      setFlash({ id, kind: "ok" });
    } finally {
      setBusy(false);
    }
  }

  const heartsFull = hearts >= MAX_HEARTS;
  const items = [
    {
      id: "refillHearts" as const,
      Icon: Heart,
      tint: "from-red-400 to-red-600",
      title: t("shop.refillHearts"),
      desc: t("shop.refillHeartsDesc"),
      price: SHOP_PRICES.refillHearts,
    },
    {
      id: "streakFreeze" as const,
      Icon: Shield,
      tint: "from-sky-400 to-sky-600",
      title: t("shop.buyFreeze"),
      desc: t("shop.buyFreezeDesc"),
      price: SHOP_PRICES.streakFreeze,
    },
  ];

  // Real zümrüd mənbələri (bax 0042 complete_lesson + lib/quests.ts openChest).
  // Liqa yeri zümrüd VERMİR — ona görə burada yazılmır.
  const earn: { Icon: LucideIcon; tile: string; label: string; reward: string; href: string }[] = [
    { Icon: Target, tile: "bg-violet-500/12 text-violet-600 dark:text-violet-300", label: t("shop.earnQuests"), reward: "20–50", href: "/gorevler" },
    { Icon: BookOpenCheck, tile: "bg-brand/12 text-brand", label: t("shop.earnLessons"), reward: "+5", href: "/dashboard" },
    { Icon: Gift, tile: "bg-amber-400/15 text-amber-600 dark:text-amber-300", label: t("shop.earnUnitChest"), reward: "+20", href: "/dashboard" },
  ];

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Başlıq + balans — Mağazanın menyu rəngi (zümrüd) */}
        <div className="flex items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white shadow-[0_5px_0_0_#0f766e]">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold">{t("shop.title")}</h1>
            <p className="text-sm text-white/85">{t("shop.subtitle")}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
            <span className="flex items-center gap-1.5 rounded-2xl bg-white/20 px-3 py-1.5 text-lg font-extrabold">
              <Gem size={19} fill="currentColor" strokeWidth={0} />
              {gems}
            </span>
            <span className="flex items-center gap-1.5 rounded-2xl bg-white/20 px-3 py-1.5 text-sm font-extrabold">
              <Heart size={16} fill="currentColor" strokeWidth={0} className="text-red-200" />
              {plus ? "∞" : `${hearts}/${MAX_HEARTS}`}
            </span>
          </div>
        </div>

        {/* Imparo Plus promo */}
        <Link
          href="/plus"
          className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-400/15 to-brand/10 p-4 transition hover:border-amber-400/70"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-brand text-white shadow-sm">
            <Crown size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold text-brand">Imparo Plus</span>
            <span className="block text-xs text-muted">Limitsiz can, 2× zümrüd, valideyn hesabatı</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-muted" />
        </Link>

        {/* Məhsullar */}
        <div className="mt-5 space-y-3">
          {items.map((it) => {
            const f = flash?.id === it.id ? flash.kind : null;
            const affordable = (gems ?? 0) >= it.price;
            const full = it.id === "refillHearts" && heartsFull;
            return (
              <div key={it.id} className={`flex items-center gap-4 p-4 ${CARD}`}>
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${it.tint} text-white shadow-sm`}
                >
                  <it.Icon size={24} fill="currentColor" strokeWidth={0} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-fg">{it.title}</span>
                    {it.id === "streakFreeze" && (
                      <span className="rounded-full bg-sky-500/12 px-2 py-0.5 text-[11px] font-extrabold text-sky-600 dark:text-sky-300">
                        {t("shop.freezeActive").replace("{n}", String(freezes))}
                      </span>
                    )}
                  </div>
                  {/* Canların hazırkı vəziyyəti — 5 ürək (dolu / boş) */}
                  {it.id === "refillHearts" && !plus && (
                    <div className="mt-1 flex gap-0.5" aria-label={`${hearts}/${MAX_HEARTS}`}>
                      {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                        <Heart
                          key={i}
                          size={15}
                          strokeWidth={i < hearts ? 0 : 2}
                          fill={i < hearts ? "currentColor" : "none"}
                          className={i < hearts ? "text-red-500" : "text-line"}
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-0.5 text-sm text-muted">
                    {f === "ok"
                      ? t("shop.owned")
                      : f === "no"
                        ? t("shop.notEnough")
                        : f === "full"
                          ? t("shop.full")
                          : it.desc}
                  </div>
                </div>
                {full ? (
                  <span className="flex shrink-0 items-center rounded-2xl border-2 border-line bg-panel-2 px-3.5 py-2.5 text-sm font-extrabold text-muted">
                    {t("shop.fullBtn")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => buy(it.id, it.price)}
                    disabled={busy}
                    className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-extrabold btn-pop disabled:opacity-50 ${
                      affordable
                        ? "bg-brand text-white hover:bg-brand-dark"
                        : "border-2 border-line bg-panel-2 text-muted [--pop:var(--color-line)]"
                    }`}
                  >
                    <Gem size={15} fill="currentColor" strokeWidth={0} />
                    {it.price}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Zümrüd necə qazanılır? — yalnız real mənbələr */}
        <div className={`mt-5 p-5 ${CARD}`}>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-fg">
            <Gem size={18} fill="currentColor" strokeWidth={0} className="text-emerald-500" />
            {t("shop.earnTitle")}
          </h2>
          <div className="mt-3 space-y-2">
            {earn.map((e) => (
              <Link
                key={e.label}
                href={e.href}
                className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-3 py-2.5 transition hover:bg-panel-2"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${e.tile}`}>
                  <e.Icon size={20} strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-bold text-fg">{e.label}</span>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                  <Gem size={12} fill="currentColor" strokeWidth={0} />
                  {e.reward}
                </span>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

const CARD = "rounded-2xl border-2 border-line bg-card shadow-[0_4px_0_0_var(--color-line)]";
