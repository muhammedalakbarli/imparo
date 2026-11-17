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
  Users,
  UserCheck,
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
import SubjectBadge, { subjectVisual } from "@/components/SubjectBadge";

const ACH_ICON: Record<AchievementKind, LucideIcon> = {
  xp: Star,
  streak: Flame,
  lessons: CircleCheck,
  level: Crown,
};

// Hər nişan növünün öz irəliləyiş rəngi.
const ACH_BAR: Record<AchievementKind, string> = {
  xp: "bg-amber-400",
  streak: "bg-orange-500",
  lessons: "bg-emerald-500",
  level: "bg-violet-500",
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
        {/* Kimlik kartı — dekorativ zolaq + üzərinə oturan avatar */}
        <div className={`overflow-hidden ${CARD} rounded-3xl`}>
          <div className="relative h-24 bg-gradient-to-r from-teal-300/45 via-amber-200/50 to-orange-300/55 dark:from-teal-500/25 dark:via-amber-500/15 dark:to-orange-500/25">
            <span className="absolute right-4 top-3 flex items-center gap-1 rounded-full bg-card/90 px-3 py-1 text-xs font-extrabold text-brand shadow-sm">
              <Crown size={13} strokeWidth={2.6} /> {t("level.label")} {lv.level}
            </span>
          </div>
          {/* `relative` — yoxsa mövqeli (relative) zolaq avatarın üstünə çəkilir. */}
          <div className="relative -mt-14 flex flex-col items-center px-5 pb-6 text-center sm:px-8">
            <span className="rounded-[1.35rem] bg-card ring-4 ring-card">
              <Avatar config={profile.avatar} seed={profile.username || profile.name} size={104} />
            </span>
            <h1 className="mt-3 text-2xl font-bold text-fg">{profile.name}</h1>
            {profile.username && (
              <p className="text-sm font-bold text-muted">@{profile.username}</p>
            )}
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <CalendarDays size={14} />
              {t("profile.memberSince").replace("{d}", memberDate(profile.createdAt))}
            </p>

            {/* İzləyici / izlənilən — statistik kapsullar */}
            <div className="mt-4 flex items-center gap-2.5">
              <span className="flex items-center gap-2 rounded-2xl border border-line bg-panel px-3.5 py-2">
                <Users size={16} className="text-teal-600 dark:text-teal-400" />
                <b className="text-base font-extrabold text-fg">{social.followers}</b>
                <span className="text-xs font-semibold text-muted">{t("follow.followers")}</span>
              </span>
              <span className="flex items-center gap-2 rounded-2xl border border-line bg-panel px-3.5 py-2">
                <UserCheck size={16} className="text-brand" />
                <b className="text-base font-extrabold text-fg">{social.following}</b>
                <span className="text-xs font-semibold text-muted">{t("follow.followingCount")}</span>
              </span>
            </div>

            {/* Səviyyə */}
            <div className="mt-5 w-full max-w-sm">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-extrabold text-brand">
                  {t("level.label")} {lv.level} · {t(lv.titleKey)}
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                  <Star size={12} fill="currentColor" strokeWidth={0} />
                  {lv.xpInLevel}/{lv.xpForNext} XP
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-panel-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                  style={{ width: `${lv.progress * 100}%` }}
                />
              </div>
            </div>

            {/* Redaktə + Paylaş — yan-yana iki bərabər düymə (QR paneli altda tam enli açılır) */}
            <div className="mt-5 grid w-full max-w-sm grid-cols-2 gap-3">
              <Link
                href="/profil/redakte"
                className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border-2 border-line bg-card px-2 py-2.5 text-[13px] font-bold text-fg btn-pop btn-pop-ghost hover:border-brand sm:text-sm"
              >
                <Pencil size={15} className="shrink-0" /> {t("profile.edit")}
              </Link>
              <ShareProfile username={profile.username} compact />
            </div>
          </div>
        </div>

        {/* Statistika: streak · XP · liqa */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat
            Icon={Flame}
            value={String(state.streakDays)}
            label={t("stat.streak")}
            tile="bg-orange-500/12 text-orange-500"
          />
          <Stat
            Icon={Star}
            value={String(state.totalXp)}
            label={t("stat.xp")}
            tile="bg-amber-400/15 text-amber-500"
          />
          <Stat
            Icon={Crown}
            value={t(TIER_KEYS[Math.min(tier, 4)]).replace(" liqa", "").replace(" league", "").replace(" лига", "")}
            label={t("nav.league")}
            tile="bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
            text
          />
        </div>

        {/* Dostlar */}
        <div className={`mt-4 p-5 ${CARD}`}>
          <h2 className="text-lg font-bold text-fg">{t("friends.title")}</h2>
          {friends.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t("friends.none")}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {friends.map((f) => (
                <Link
                  key={f.friendId}
                  href={`/u/${f.username || f.friendId}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-3 py-2.5 transition hover:bg-panel-2"
                >
                  <Avatar config={f.avatar} seed={f.username || f.name} size={40} />
                  <span className="min-w-0 flex-1 truncate font-bold text-fg">{f.name}</span>
                  {f.friendStreak > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-extrabold text-orange-500">
                      <Flame size={14} /> {f.friendStreak}
                    </span>
                  )}
                  <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                    <Star size={12} fill="currentColor" strokeWidth={0} /> {f.totalXp}
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

        {/* Nişanlar (medal/orden) — hər biri öz iç kartında, öz rəngində */}
        <div className={`mt-4 p-5 ${CARD}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-fg">{t("profile.badges")}</h2>
            {/* Aylıq nişan */}
            <div className="flex items-center gap-2 rounded-full border border-line bg-panel py-1 pl-1 pr-3">
              <OrderBadge Icon={CalendarDays} tier={monthTier} size={30} />
              <span className="text-xs font-bold text-muted">{t("profile.monthly")}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {achievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-3.5">
                <OrderBadge Icon={ACH_ICON[a.kind]} tier={a.tier} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-bold text-fg">{t(a.titleKey)}</span>
                    <span className="shrink-0 rounded-full bg-panel-2 px-2 py-0.5 text-[11px] font-extrabold text-muted">
                      {a.tier}/3
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-panel-2">
                    <div
                      className={`h-full rounded-full transition-all ${ACH_BAR[a.kind]}`}
                      style={{ width: `${a.progress * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-muted">
                    {a.nextGoal === null ? `${a.value}` : `${a.value}/${a.nextGoal}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fənn üzrə irəliləyiş — fənn ikonu + fənnin öz rəngi */}
        <div className={`mt-4 p-5 ${CARD}`}>
          <h2 className="text-lg font-bold text-fg">{t("profile.progress")}</h2>
          <div className="mt-4 space-y-4">
            {subjectsForGrade(subjects, user).map((s) => {
              const ls = s.units.flatMap((u) => u.lessons);
              const done = ls.filter((l) => state.completedLessons.includes(l.id)).length;
              const pct = ls.length ? Math.round((done / ls.length) * 100) : 0;
              const color = subjectVisual(s.slug)?.color ?? "var(--color-brand)";
              return (
                <div key={s.slug} className="flex items-center gap-3">
                  <SubjectBadge slug={s.slug} fallback={s.icon} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                      <span className="truncate text-fg">{t(`subject.${s.slug}`)}</span>
                      <span className="shrink-0 text-xs text-muted">
                        <b className="font-extrabold text-fg">{done}/{ls.length}</b> · {pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-panel-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daha çoxu — Məktəblər üçün · Plus · Ayarlar · Yardım (mobil giriş) */}
        <div className={`mt-6 overflow-hidden ${CARD}`}>
          <MenuRow href="/mekteb" Icon={School} tile="bg-brand/12 text-brand" label={t("nav.schools")} />
          <MenuRow href="/plus" Icon={Crown} tile="bg-amber-400/15 text-amber-500" label="Imparo Plus" />
          <MenuRow href="/ayarlar" Icon={Settings} tile="bg-slate-500/12 text-slate-500 dark:text-slate-300" label={t("nav.settings")} />
          {isAdmin && (
            <MenuRow href="/admin" Icon={ShieldCheck} tile="bg-violet-500/12 text-violet-600 dark:text-violet-300" label="Admin paneli" />
          )}
          <MenuRow href="/yardim" Icon={HelpCircle} tile="bg-sky-500/12 text-sky-600 dark:text-sky-300" label={t("nav.help")} last />
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-line bg-card px-5 py-3 font-bold text-fg btn-pop btn-pop-ghost hover:border-red-400"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/12 text-red-500">
            <LogOut size={16} />
          </span>
          {t("profile.logout")}
        </button>
      </main>
    </div>
  );
}

// Bu səhifədəki əsas kartlar: ağ kart + "basılan" 3D alt haşiyə (Öyrən ekranı ilə eyni dil).
const CARD = "rounded-2xl border-2 border-line bg-card shadow-[0_4px_0_0_var(--color-line)]";

function Stat({
  Icon,
  value,
  label,
  tile,
  text = false,
}: {
  Icon: LucideIcon;
  value: string;
  label: string;
  tile: string;
  /** Rəqəm yox, söz (liqa adı) — bir az kiçik şrift ki, sığsın. */
  text?: boolean;
}) {
  return (
    <div className={`flex min-w-0 flex-col items-start gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4 ${CARD}`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tile}`}>
        <Icon size={22} strokeWidth={2.4} />
      </span>
      <div className="min-w-0 leading-tight">
        <div className={`truncate font-extrabold text-fg ${text ? "text-base sm:text-lg" : "text-xl"}`}>{value}</div>
        <div className="truncate text-[11px] font-semibold text-muted">{label}</div>
      </div>
    </div>
  );
}

function MenuRow({
  href,
  Icon,
  tile,
  label,
  last = false,
}: {
  href: string;
  Icon: LucideIcon;
  tile: string;
  label: string;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 transition hover:bg-panel ${last ? "" : "border-b border-line"}`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tile}`}>
        <Icon size={19} strokeWidth={2.3} />
      </span>
      <span className="flex-1 font-bold text-fg">{label}</span>
      <ChevronRight size={18} className="text-muted" />
    </Link>
  );
}
