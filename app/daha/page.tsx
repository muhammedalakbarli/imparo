"use client";

// Daha çoxu: fənlərə keçidlər, hesab, məlumat.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, User, Dumbbell, LogOut, ChevronRight, Settings, HelpCircle, School, Crown, Map } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { signOut } from "@/lib/auth";
import { useContent } from "@/components/ContentProvider";
import { subjectsForGrade } from "@/lib/grade";
import { useT } from "@/lib/i18n";
import { PageSkeleton } from "@/components/Skeleton";
import Logo from "@/components/Logo";

export default function MorePage() {
  const { user, ready } = useAuthUser();
  const { subjects } = useContent();
  const router = useRouter();
  const t = useT();

  const shown = subjectsForGrade(subjects, user);

  if (!ready || !user) return <PageSkeleton />;

  async function logout() {
    await signOut();
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold text-fg">{t("nav.more")}</h1>

        {/* Fənlər */}
        <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">
          {t("more.subjects")}
        </h2>
        <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-panel">
          {shown.map((s) => (
            <Link
              key={s.slug}
              href={`/subjects/${s.slug}`}
              className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0 transition hover:bg-panel-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
                {s.icon}
              </span>
              <span className="flex-1 font-bold text-fg">{t(`subject.${s.slug}`)}</span>
              <ChevronRight size={18} className="text-muted" />
            </Link>
          ))}
        </div>

        {/* Hesab */}
        <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">
          {t("more.account")}
        </h2>
        <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-panel">
          <Row href="/profil" Icon={User} label={t("nav.profile")} />
          <Row href="/praktika" Icon={Dumbbell} label={t("nav.practice")} />
          <Row href="/bilik-xeritesi" Icon={Map} label={t("map.title")} />
          <Row href="/dashboard" Icon={BookOpen} label={t("nav.learn")} />
        </div>

        {/* Imparo dünyası */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-panel">
          <Row href="/mekteb" Icon={School} label={t("nav.schools")} />
          <Row href="/plus" Icon={Crown} label="Imparo Plus" />
        </div>

        {/* Tənzimləmə */}
        <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">
          {t("more.config")}
        </h2>
        <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-panel">
          <Row href="/ayarlar" Icon={Settings} label={t("nav.settings")} />
          <Row href="/yardim" Icon={HelpCircle} label={t("nav.help")} />
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-line bg-panel px-5 py-3 font-bold text-fg btn-pop btn-pop-ghost hover:border-brand"
        >
          <LogOut size={18} /> {t("profile.logout")}
        </button>

        {/* Alt */}
        <div className="mt-10 flex flex-col items-center gap-1.5 text-center text-xs text-muted">
          <Logo size={24} />
          <span className="font-bold text-fg">Imparo</span>
          <span>{t("more.tagline")}</span>
        </div>
      </main>
    </div>
  );
}

function Row({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0 transition hover:bg-panel-2"
    >
      <Icon size={20} className="text-muted" />
      <span className="flex-1 font-bold text-fg">{label}</span>
      <ChevronRight size={18} className="text-muted" />
    </Link>
  );
}
