"use client";

// Profil: avatar + ad/@username + üzvlük tarixi, streak·XP·liqa, nişan/orden achievements,
// aylıq nişan, fənn irəliləyişi, paylaş + redaktə.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  Flame,
  CircleCheck,
  LogOut,
  Crown,
  Pencil,
  CalendarDays,
  Settings,
  HelpCircle,
  ChevronRight,
  School,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { checkIsAdmin } from "@/lib/adminApi";
import { loadProgress, type ProgressState } from "@/lib/progress";
import { signOut } from "@/lib/auth";
import { useContent } from "@/components/ContentProvider";
import { subjectsForGrade } from "@/lib/grade";
import { useT } from "@/lib/i18n";
import { levelFromXp } from "@/lib/levels";
import { computeAchievements, type AchievementKind } from "@/lib/achievements";
import { loadMyLeagueTier, TIER_KEYS } from "@/lib/leaderboard";
import { loadProfileRow, getPublicProfile, memberDate, type ProfileRow } from "@/lib/profileApi";
import { loadMonthly, monthlyBadgeTier } from "@/lib/monthly";
import { getFriends, type FriendRow } from "@/lib/friends";
import { PageSkeleton } from "@/components/Skeleton";
import Avatar from "@/components/Avatar";
import OrderBadge from "@/components/OrderBadge";
import ShareProfile from "@/components/ShareProfile";

const ACH_ICON: Record<AchievementKind, LucideIcon> = {
  xp: Star,
  streak: Flame,
  lessons: CircleCheck,
  level: Crown,
};

export default function ProfilePage() {
  const { user, ready } = useAuthUser();
  const router = useRouter();
  const t = useT();
  const { subjects } = useContent();
  const [state, setState] = useState<ProgressState | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [tier, setTier] = useState(0);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [social, setSocial] = useState({ followers: 0, following: 0 });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkIsAdmin().then(setIsAdmin);
    loadProgress(user.id).then(setState);
    loadProfileRow().then((pr) => {
      setProfile(pr);
      if (pr)
        getPublicProfile(pr.id).then((pp) => {
          if (pp) setSocial({ followers: pp.followers, following: pp.following });
        });
    });
    loadMyLeagueTier().then(setTier);
    getFriends().then(setFriends);
  }, [user]);

  if (!ready || !user || !state || !profile) return <PageSkeleton />;

  const lv = levelFromXp(state.totalXp);
  const achievements = computeAchievements(state);
  const monthTier = monthlyBadgeTier(loadMonthly(user.user_metadata).xp);

  async function logout() {
    await signOut();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Kimlik kartı */}
        <div className="flex flex-col items-center rounded-3xl border border-line bg-panel p-8 text-center">
          <Avatar config={profile.avatar} seed={profile.username || profile.name} size={104} />
          <h1 className="mt-3 text-2xl font-bold text-fg">{profile.name}</h1>
          {profile.username && (
            <p className="text-sm font-bold text-muted">@{profile.username}</p>
          )}
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <CalendarDays size={14} />
            {t("profile.memberSince").replace("{d}", memberDate(profile.createdAt))}
          </p>

          {/* İzləyici / izlənilən */}
          <div className="mt-3 flex items-center gap-5">
            <span className="text-sm">
              <b className="font-extrabold text-fg">{social.followers}</b>{" "}
              <span className="text-muted">{t("follow.followers")}</span>
            </span>
            <span className="text-sm">
              <b className="font-extrabold text-fg">{social.following}</b>{" "}
              <span className="text-muted">{t("follow.followingCount")}</span>
            </span>
          </div>

          {/* Səviyyə */}
          <div className="mt-4 w-full max-w-xs">
            <div className="flex items-center justify-between text-sm">
              <span className="font-extrabold text-brand">
                {t("level.label")} {lv.level} · {t(lv.titleKey)}
              </span>
              <span className="text-xs text-muted">
                {lv.xpInLevel}/{lv.xpForNext} XP
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-panel-2">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${lv.progress * 100}%` }}
              />
            </div>
          </div>

          {/* Redaktə */}
          <Link
            href="/profil/redakte"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border-2 border-line bg-panel px-4 py-2 text-sm font-bold text-fg btn-pop btn-pop-ghost hover:border-brand"
          >
            <Pencil size={16} /> {t("profile.edit")}
          </Link>
        </div>

        {/* Statistika: streak · XP · liqa */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat Icon={Flame} value={state.streakDays} label={t("stat.streak")} color="text-orange-500" />
          <Stat Icon={Star} value={state.totalXp} label={t("stat.xp")} color="text-accent" />
          <StatText
            Icon={Crown}
            value={t(TIER_KEYS[Math.min(tier, 4)]).replace(" liqa", "").replace(" league", "").replace(" лига", "")}
            label={t("nav.league")}
            color="text-brand"
          />
        </div>

        {/* Paylaş */}
        <div className="mt-4">
          <ShareProfile username={profile.username} />
        </div>

        {/* Dostlar */}
        <div className="mt-4 rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-lg font-bold text-fg">{t("friends.title")}</h2>
          {friends.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t("friends.none")}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {friends.map((f) => (
                <Link
                  key={f.friendId}
                  href={`/u/${f.username || f.friendId}`}
                  className="flex items-center gap-3 rounded-2xl border border-line px-3 py-2.5 transition hover:bg-panel-2"
                >
                  <Avatar config={f.avatar} seed={f.username || f.name} size={40} />
                  <span className="min-w-0 flex-1 truncate font-bold text-fg">{f.name}</span>
                  {f.friendStreak > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-extrabold text-orange-500">
                      <Flame size={14} /> {f.friendStreak}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs font-bold text-muted">
                    <Star size={13} className="text-accent" /> {f.totalXp}
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-4">
            <ShareProfile
              username={profile.username}
              path="dost"
              labelKey="friends.invite"
            />
          </div>
        </div>

        {/* Nişanlar (medal/orden) */}
        <div className="mt-4 rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-fg">{t("profile.badges")}</h2>
            {/* Aylıq nişan */}
            <div className="flex items-center gap-2">
              <OrderBadge Icon={CalendarDays} tier={monthTier} size={34} />
              <span className="text-xs font-bold text-muted">{t("profile.monthly")}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {achievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <OrderBadge Icon={ACH_ICON[a.kind]} tier={a.tier} size={54} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-bold text-fg">{t(a.titleKey)}</span>
                    <span className="shrink-0 text-xs font-bold text-muted">{a.tier}/3</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-panel-2">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${a.progress * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-muted">
                    {a.nextGoal === null ? `${a.value}` : `${a.value}/${a.nextGoal}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fənn üzrə irəliləyiş */}
        <div className="mt-4 rounded-2xl border border-line bg-panel p-5">
          <h2 className="text-lg font-bold text-fg">{t("profile.progress")}</h2>
          <div className="mt-4 space-y-4">
            {subjectsForGrade(subjects, user).map((s) => {
              const ls = s.units.flatMap((u) => u.lessons);
              const done = ls.filter((l) => state.completedLessons.includes(l.id)).length;
              const pct = ls.length ? Math.round((done / ls.length) * 100) : 0;
              return (
                <div key={s.slug}>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-fg">{t(`subject.${s.slug}`)}</span>
                    <span className="text-muted">
                      {done}/{ls.length}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-panel-2">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daha çoxu — Məktəblər üçün · Plus · Ayarlar · Yardım (mobil giriş) */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-panel">
          <Link href="/mekteb" className="flex items-center gap-3 border-b border-line px-4 py-3.5 transition hover:bg-panel-2">
            <School size={20} className="text-brand" />
            <span className="flex-1 font-bold text-fg">{t("nav.schools")}</span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
          <Link href="/plus" className="flex items-center gap-3 border-b border-line px-4 py-3.5 transition hover:bg-panel-2">
            <Crown size={20} className="text-amber-500" />
            <span className="flex-1 font-bold text-fg">Imparo Plus</span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
          <Link href="/ayarlar" className="flex items-center gap-3 border-b border-line px-4 py-3.5 transition hover:bg-panel-2">
            <Settings size={20} className="text-muted" />
            <span className="flex-1 font-bold text-fg">{t("nav.settings")}</span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-3 border-b border-line px-4 py-3.5 transition hover:bg-panel-2">
              <ShieldCheck size={20} className="text-brand" />
              <span className="flex-1 font-bold text-fg">Admin paneli</span>
              <ChevronRight size={18} className="text-muted" />
            </Link>
          )}
          <Link href="/yardim" className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-panel-2">
            <HelpCircle size={20} className="text-muted" />
            <span className="flex-1 font-bold text-fg">{t("nav.help")}</span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-line bg-panel px-5 py-3 font-bold text-fg btn-pop btn-pop-ghost hover:border-brand"
        >
          <LogOut size={18} /> {t("profile.logout")}
        </button>
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

function StatText({
  Icon,
  value,
  label,
  color,
}: {
  Icon: LucideIcon;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-panel px-4 py-3">
      <Icon size={22} className={color} />
      <div className="leading-tight">
        <div className="truncate text-sm font-extrabold text-fg">{value}</div>
        <div className="text-[11px] text-muted">{label}</div>
      </div>
    </div>
  );
}
