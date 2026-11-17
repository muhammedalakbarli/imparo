"use client";

// Liqa — Duolingo üslubu kohort yarışı: eyni pillədə 15 nəfər həftəlik XP ilə yarışır;
// top 5 növbəti liqaya keçir (yüksəliş zonası), kohort böyükdürsə alt 5 düşür (enmə zonası).

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, Lock, Clock, Shield, Star } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  loadCohort,
  loadMyLeagueTier,
  maybeLeagueRollover,
  weekEndsAt,
  TIER_KEYS,
  PROMOTE,
  DEMOTE,
  type CohortRow,
} from "@/lib/leaderboard";
import { track } from "@/lib/analytics";
import { useT } from "@/lib/i18n";
import { PageSkeleton } from "@/components/Skeleton";
import Mascot from "@/components/Mascot";
import RankBadge from "@/components/RankBadge";
import Avatar from "@/components/Avatar";

export default function LeaguePage() {
  const { user, ready } = useAuthUser();
  const [rows, setRows] = useState<CohortRow[] | null>(null);
  const [myTier, setMyTier] = useState(0);
  const t = useT();

  useEffect(() => {
    // Əvvəl həftəlik rollover (idempotent), sonra kohort + öz tierim.
    maybeLeagueRollover()
      .then(() => Promise.all([loadCohort(), loadMyLeagueTier()]))
      .then(([cohort, tier]) => {
        setRows(cohort);
        setMyTier(tier);
        track("league_viewed", { tier, participating: cohort.some((r) => r.isMe) });
      });
  }, []);

  if (!ready || !user || !rows) return <PageSkeleton />;

  const iAmIn = rows.some((r) => r.isMe);
  const size = rows.length;
  const demoActive = size >= 12;

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Başlıq + pillə */}
        <div className="rounded-3xl bg-gradient-to-r from-amber-400 to-orange-500 p-5 text-white shadow-[0_5px_0_0_#c2410c]">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm">
              <Mascot size={54} mood="celebrate" disk={false} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-extrabold">{t(tierKey(myTier))}</div>
              <div className="text-sm text-white/85">{t("league.compete")}</div>
            </div>
          </div>
          <TierLadder current={myTier} t={t} />
        </div>

        {/* Həftəlik geri sayım — liqa nə vaxt sıfırlanır */}
        <LeagueTimer t={t} />

        {/* İştirak etmirsənsə (bu həftə XP yoxdur) — liqanın üstünə "cover":
            cədvəl göstərilmir, yalnız dərs et çağırışı. */}
        {!iAmIn ? (
          <div className={`mt-4 p-8 text-center ${CARD} rounded-3xl`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Lock size={30} />
            </div>
            <div className="mt-4 text-base font-bold text-fg">{t("league.needXp")}</div>
            <Link
              href="/dashboard"
              className="mt-5 inline-block rounded-2xl bg-brand px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white btn-pop"
            >
              {t("league.needXpCta")}
            </Link>
          </div>
        ) : size === 0 ? (
          <div className={`mt-4 p-8 text-center text-muted ${CARD}`}>
            {t("league.empty")}
          </div>
        ) : (
          <div className={`mt-4 overflow-hidden ${CARD}`}>
            {rows.map((r, i) => {
              const inPromo = i < PROMOTE;
              const inDemo = demoActive && i >= size - DEMOTE;
              return (
                <div key={r.userId}>
                  <Row
                    row={r}
                    rank={i + 1}
                    tint={inPromo ? "promo" : inDemo ? "demo" : "none"}
                    t={t}
                  />
                  {/* Yüksəliş xətti (promo zonasından sonra) */}
                  {i === PROMOTE - 1 && size > PROMOTE && (
                    <ZoneLine
                      label={t("league.promoZone")}
                      color="emerald"
                      Icon={ChevronUp}
                    />
                  )}
                  {/* Enmə xətti (enmə zonasından əvvəl) */}
                  {demoActive && i === size - DEMOTE - 1 && (
                    <ZoneLine
                      label={t("league.demoZone")}
                      color="red"
                      Icon={ChevronDown}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function tierKey(tier: number): string {
  return TIER_KEYS[Math.max(0, Math.min(TIER_KEYS.length - 1, tier))];
}

// Həftəlik liqanın bitməsinə qalan vaxt (növbəti B.E. 00:00 Asia/Baku).
function LeagueTimer({ t }: { t: (k: string) => string }) {
  const [left, setLeft] = useState(() => weekEndsAt().getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setLeft(weekEndsAt().getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const total = Math.max(0, left);
  const d = Math.floor(total / 86400000);
  const h = Math.floor((total % 86400000) / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  return (
    <div className="mx-auto mt-3 flex w-fit items-center justify-center gap-2 rounded-full border-2 border-line bg-card px-4 py-2 text-sm shadow-[0_3px_0_0_var(--color-line)]">
      <Clock size={16} className="text-brand" />
      <span className="font-semibold text-muted">{t("league.endsIn")}:</span>
      <span className="font-extrabold text-fg tabular-nums">
        {d}
        {t("league.dayShort")} {h}
        {t("league.hourShort")} {m}
        {t("league.minShort")}
      </span>
    </div>
  );
}

function ZoneLine({
  label,
  color,
  Icon,
}: {
  label: string;
  color: "emerald" | "red";
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}) {
  const c =
    color === "emerald"
      ? "bg-emerald-500/12 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
      : "bg-rose-500/12 text-rose-600 border-rose-500/30 dark:text-rose-300";
  return (
    <div className={`flex items-center justify-center gap-1.5 border-y px-4 py-1.5 ${c}`}>
      <Icon size={15} strokeWidth={3} />
      <span className="text-[11px] font-extrabold uppercase tracking-wider">{label}</span>
      <Icon size={15} strokeWidth={3} />
    </div>
  );
}

// İlk üç yerin zərif fonu (medal rəngində).
const PODIUM_BG: Record<number, string> = {
  1: "bg-amber-400/[0.10]",
  2: "bg-slate-400/[0.10]",
  3: "bg-orange-700/[0.08]",
};

function Row({
  row,
  rank,
  tint,
  t,
}: {
  row: CohortRow;
  rank: number;
  tint: "promo" | "demo" | "none";
  t: (k: string) => string;
}) {
  // Cədvəl ağ qalır; zona yalnız sol xətt + çox yüngül fonla göstərilir.
  const zone =
    tint === "promo"
      ? `border-l-4 border-l-emerald-500 ${PODIUM_BG[rank] ?? "bg-emerald-500/[0.05]"}`
      : tint === "demo"
        ? "border-l-4 border-l-rose-500 bg-rose-500/[0.05]"
        : "border-l-4 border-l-transparent";
  // Öz sətrin hansı zonada olursa olsun dərhal seçilsin.
  const me = row.isMe ? "!bg-brand/12 ring-2 ring-inset ring-brand" : "";
  const cls = `flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 transition ${zone} ${me}`;
  // Hər sətir profilə keçir; botlar da username daşıyır (findBot ilə açılır).
  const href = row.isMe ? "/profil" : `/u/${row.username || row.userId}`;

  const inner = (
    <>
      <span className="flex w-9 shrink-0 justify-center">
        {rank <= 3 ? (
          <RankBadge rank={rank as 1 | 2 | 3} size={36} />
        ) : (
          <span className="text-sm font-extrabold text-muted">{rank}</span>
        )}
      </span>
      <Avatar config={row.avatar} seed={row.username || row.name} size={38} />
      <span className="min-w-0 flex-1 truncate font-bold text-fg">
        {row.name}
        {row.isMe && (
          <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-extrabold text-white">
            {t("league.you")}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-extrabold text-amber-700 dark:text-amber-300">
        <Star size={12} fill="currentColor" strokeWidth={0} />
        {row.weeklyXp} XP
      </span>
    </>
  );

  return href ? (
    <Link href={href} className={`${cls} hover:brightness-[0.97]`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

// 5 liqa pilləsi: keçilənlər açıq, olduğun böyük və parlaq, sonrakılar kilidli.
const TIER_COLORS = ["#C77B3B", "#A8B3C4", "#F0A800", "#38BDF8", "#A78BFA"];

function TierLadder({ current, t }: { current: number; t: (k: string) => string }) {
  const cur = Math.max(0, Math.min(TIER_KEYS.length - 1, current));
  return (
    <div className="mt-4 flex items-end justify-between gap-1 rounded-2xl bg-white/15 px-3 py-2.5">
      {TIER_KEYS.map((key, i) => {
        const isCur = i === cur;
        const locked = i > cur;
        const size = isCur ? 40 : 26;
        return (
          <div key={key} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={t(key)}>
            <span
              className={`relative flex items-center justify-center rounded-full ${
                isCur ? "bg-white p-1.5 shadow-[0_0_0_4px_rgba(255,255,255,0.35)]" : ""
              }`}
            >
              <Shield
                size={size}
                strokeWidth={1.8}
                fill={locked ? "rgba(255,255,255,0.25)" : TIER_COLORS[i]}
                color={locked ? "rgba(255,255,255,0.55)" : isCur ? TIER_COLORS[i] : "#ffffff"}
              />
              {locked && (
                <Lock size={11} strokeWidth={3} className="absolute text-white/90" />
              )}
            </span>
            <span
              className={`max-w-full truncate text-[10px] font-extrabold uppercase tracking-wide ${
                isCur ? "text-white" : locked ? "text-white/60" : "text-white/85"
              }`}
            >
              {t(key).replace(" liqa", "").replace(" league", "").replace(" лига", "")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const CARD = "rounded-2xl border-2 border-line bg-card shadow-[0_4px_0_0_var(--color-line)]";
