"use client";

// İctimai profil — /u/{username}. Giriş tələb etmir; get_public_profile ilə açıq məlumat.

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Star, Flame, Crown, UserPlus, Check, type LucideIcon } from "lucide-react";
import { getPublicProfile, loadProfileRow, memberDate, type PublicProfile } from "@/lib/profileApi";
import { followUser, unfollowUser } from "@/lib/follows";
import { isBotFollowed, toggleBotFollow } from "@/lib/botFollows";
import { useAuthUser } from "@/lib/useAuthUser";
import { levelFromXp } from "@/lib/levels";
import { computeAchievements, type AchievementKind } from "@/lib/achievements";
import { TIER_KEYS } from "@/lib/leaderboard";
import { useT } from "@/lib/i18n";
import { PageSkeleton } from "@/components/Skeleton";
import Avatar from "@/components/Avatar";
import OrderBadge from "@/components/OrderBadge";
import Logo from "@/components/Logo";

const ACH_ICON: Record<AchievementKind, LucideIcon> = {
  xp: Star,
  streak: Flame,
  lessons: Star,
  level: Crown,
};

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const uname = decodeURIComponent(username);
  const t = useT();
  const { user, ready } = useAuthUser();
  const [p, setP] = useState<PublicProfile | null | undefined>(undefined);
  const [myId, setMyId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPublicProfile(uname).then((pr) => {
      setP(pr);
      if (pr) {
        // Bot: izləmə vəziyyəti localStorage-da (DB sətri yoxdur), reload-dan sonra qalır.
        const botFollowed = pr.isBot ? isBotFollowed(pr.id) : false;
        setFollowing(pr.isBot ? botFollowed : pr.amFollowing);
        setFollowers(pr.followers + (botFollowed ? 1 : 0));
      }
    });
  }, [uname]);
  useEffect(() => {
    if (user) loadProfileRow().then((pr) => setMyId(pr?.id ?? null));
  }, [user]);

  if (p === undefined || !ready) return <PageSkeleton />;

  const isSelf = !!p && !!myId && p.id === myId;

  async function toggleFollow() {
    if (!p || busy) return;
    const next = !following;
    // Bot: DB yox — optimistik UI + localStorage (real profil kimi görünsün, revert etmə).
    if (p.isBot) {
      setFollowing(next);
      setFollowers((c) => c + (next ? 1 : -1));
      toggleBotFollow(p.id);
      return;
    }
    setBusy(true);
    setFollowing(next);
    setFollowers((c) => c + (next ? 1 : -1));
    const ok = next ? await followUser(p.id) : await unfollowUser(p.id);
    if (!ok) {
      setFollowing(!next);
      setFollowers((c) => c + (next ? -1 : 1));
    }
    setBusy(false);
  }

  if (p === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-4 text-center">
        <Logo size={40} />
        <p className="text-lg font-bold text-fg">{t("profile.notFound")}</p>
        <Link href="/" className="rounded-2xl bg-brand px-5 py-3 font-extrabold text-white btn-pop">
          Imparo
        </Link>
      </div>
    );
  }

  const lv = levelFromXp(p.totalXp);
  const achievements = computeAchievements({
    totalXp: p.totalXp,
    streakDays: p.streakDays,
    completedLessons: [],
    lastActiveDate: null,
    streakFreezes: 0,
    gems: 0,
  }).filter((a) => a.kind !== "lessons");

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-lg px-4 py-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-extrabold text-fg">Imparo</span>
        </Link>

        {/* Kimlik */}
        <div className="mt-6 flex flex-col items-center rounded-3xl border border-line bg-panel p-8 text-center">
          <Avatar config={p.avatar} seed={p.username || p.id} size={104} />
          <h1 className="mt-3 text-2xl font-bold text-fg">{p.name}</h1>
          {p.username && <p className="text-sm font-bold text-muted">@{p.username}</p>}
          <p className="mt-1 text-xs text-muted">
            {t("profile.memberSince").replace("{d}", memberDate(p.createdAt))}
          </p>
          <div className="mt-3 rounded-full bg-brand/10 px-4 py-1 text-sm font-extrabold text-brand">
            {t("level.label")} {lv.level} · {t(TIER_KEYS[Math.min(p.tier, 4)])}
          </div>

          {/* İzləyici / izlənilən sayı */}
          <div className="mt-4 flex items-center gap-6">
            <div className="text-center">
              <div className="text-lg font-extrabold text-fg">{followers}</div>
              <div className="text-[11px] text-muted">{t("follow.followers")}</div>
            </div>
            <div className="h-8 w-px bg-line" />
            <div className="text-center">
              <div className="text-lg font-extrabold text-fg">{p.following}</div>
              <div className="text-[11px] text-muted">{t("follow.followingCount")}</div>
            </div>
          </div>

          {/* İzlə / İzlənilir — botlarda da göstərilir (real profildən fərqlənməsin;
              bot izləməsi localStorage-da saxlanılır). */}
          {user && !isSelf && (
            <button
              type="button"
              onClick={toggleFollow}
              disabled={busy}
              className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 font-extrabold uppercase tracking-wide btn-pop disabled:opacity-50 ${
                following
                  ? "border-2 border-line bg-panel text-fg btn-pop-ghost hover:border-brand"
                  : "bg-brand text-white hover:bg-brand-dark"
              }`}
            >
              {following ? <Check size={18} /> : <UserPlus size={18} />}
              {following ? t("follow.following") : t("follow.follow")}
            </button>
          )}
        </div>

        {/* Statistika */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat Icon={Star} value={p.totalXp} label={t("stat.xp")} color="text-accent" />
          <Stat Icon={Flame} value={p.streakDays} label={t("stat.streak")} color="text-orange-500" />
        </div>

        {/* Nişanlar */}
        <div className="mt-4 rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-lg font-bold text-fg">{t("profile.badges")}</h2>
          <div className="mt-4 flex flex-wrap gap-5">
            {achievements.map((a) => (
              <div key={a.id} className="flex flex-col items-center gap-1.5 text-center">
                <OrderBadge Icon={ACH_ICON[a.kind]} tier={a.tier} size={54} />
                <span className="max-w-[80px] text-[11px] font-semibold text-fg">
                  {t(a.titleKey)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({
  Icon,
  value,
  label,
  color,
}: {
  Icon: LucideIcon;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-panel px-4 py-3">
      <Icon size={22} className={color} />
      <div className="leading-tight">
        <div className="text-lg font-extrabold text-fg">{value}</div>
        <div className="text-[11px] text-muted">{label}</div>
      </div>
    </div>
  );
}
