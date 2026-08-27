"use client";

// Liqa — Duolingo üslubu kohort yarışı: eyni pillədə 15 nəfər həftəlik XP ilə yarışır;
// top 5 növbəti liqaya keçir (yüksəliş zonası), kohort böyükdürsə alt 5 düşür (enmə zonası).

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, ChevronUp, ChevronDown, Lock, Clock } from "lucide-react";
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
        <div className="flex items-center gap-4 rounded-3xl bg-brand p-5 text-white">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm">
            <Mascot size={54} mood="celebrate" disk={false} />
          </span>
          <div className="flex-1">
            <div className="text-lg font-extrabold">{t(tierKey(myTier))}</div>
            <div className="text-sm text-white/85">{t("league.compete")}</div>
          </div>
          <Trophy size={30} className="text-accent-soft" />
        </div>

        {/* Həftəlik geri sayım — liqa nə vaxt sıfırlanır */}
        <LeagueTimer t={t} />

        {/* İştirak etmirsənsə (bu həftə XP yoxdur) — liqanın üstünə "cover":
            cədvəl göstərilmir, yalnız dərs et çağırışı. */}
        {!iAmIn ? (
          <div className="mt-4 rounded-3xl border-2 border-brand/30 bg-brand/5 p-8 text-center">
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
          <div className="mt-4 rounded-2xl border border-line bg-panel p-8 text-center text-muted">
            {t("league.empty")}
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-panel">
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
    <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-line bg-panel py-2.5 text-sm">
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
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const c =
    color === "emerald"
      ? "text-emerald-600 border-emerald-500/40"
      : "text-red-500 border-red-400/40";
  return (
    <div className={`flex items-center gap-2 border-y-2 border-dashed px-4 py-1.5 ${c}`}>
      <Icon size={16} />
      <span className="text-[11px] font-extrabold uppercase tracking-wide">{label}</span>
    </div>
  );
}

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
  // Zona rəngi: yüksəliş = yaşıl, qalan = ağ, enmə = qırmızı.
  const zoneBg =
    tint === "promo"
      ? "bg-emerald-500/15"
      : tint === "demo"
        ? "bg-red-500/15"
        : "bg-panel";
  const meRing = row.isMe ? "ring-2 ring-inset ring-brand/60" : "";
  const cls = `flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0 transition ${zoneBg} ${meRing}`;
  // Hər sətir profilə keçir; botlar da username daşıyır (findBot ilə açılır).
  const href = row.isMe ? "/profil" : `/u/${row.username || row.userId}`;

  const inner = (
    <>
      <span className="flex w-8 shrink-0 justify-center">
        {rank <= 3 ? (
          <RankBadge rank={rank as 1 | 2 | 3} size={34} />
        ) : (
          <span className="text-sm font-bold text-muted">{rank}</span>
        )}
      </span>
      <Avatar config={row.avatar} seed={row.username || row.name} size={36} />
      <span className="flex-1 truncate font-bold text-fg">
        {row.name}
        {row.isMe && (
          <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-bold text-brand">
            {t("league.you")}
          </span>
        )}
      </span>
      <span className="shrink-0 font-extrabold text-accent">{row.weeklyXp} XP</span>
    </>
  );

  return href ? (
    <Link href={href} className={`${cls} hover:brightness-95`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
