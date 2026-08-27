"use client";

// Əsas naviqasiya: desktop-da sol yan panel, mobil-də alt panel.
// Bölmələr: Öyrən · Praktika et · Profil · Daha çoxu.

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Settings,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Dumbbell,
  User,
  Target,
  ShoppingBag,
  School,
  Crown,
} from "lucide-react";
import Logo from "./Logo";
import {
  IconLearn,
  IconPractice,
  IconLeague,
  IconProfile,
  IconMore,
  IconQuests,
  IconShop,
} from "./NavIcons";
import { signOut } from "@/lib/auth";
import { checkIsAdmin, adminListTeacherRequests } from "@/lib/adminApi";
import { useT } from "@/lib/i18n";
import { useOptionalUser } from "@/lib/useOptionalUser";

// Hər bölmənin öz rəngi — uşaqlar üçün rəngarəng, cəlbedici naviqasiya.
// icon: həmişə rəngli ikon; activeBg/activeText: aktiv olanda rəngli fon+mətn.
// Mobil alt panel — Duolingo kimi əsas bölmələr (Ayarlar/Yardım Profil içindədir).
const MOBILE_HREFS = ["/dashboard", "/praktika", "/liqa", "/gorevler", "/magaza", "/profil"];

// Hər bölmənin öz rəngli qrafik ikonu (NavIcons) + aktiv fon/mətn rəngi.
const NAV = [
  {
    href: "/dashboard",
    key: "nav.learn",
    Icon: IconLearn,
    match: ["/dashboard", "/subjects", "/lessons"],
    activeBg: "bg-brand/12",
    activeText: "text-brand",
  },
  {
    href: "/praktika",
    key: "nav.practice",
    Icon: IconPractice,
    match: ["/praktika"],
    activeBg: "bg-brand/12",
    activeText: "text-brand",
  },
  {
    href: "/liqa",
    key: "nav.league",
    Icon: IconLeague,
    match: ["/liqa"],
    activeBg: "bg-brand/12",
    activeText: "text-brand",
  },
  {
    href: "/gorevler",
    key: "nav.quests",
    Icon: IconQuests,
    match: ["/gorevler"],
    activeBg: "bg-brand/12",
    activeText: "text-brand",
  },
  {
    href: "/magaza",
    key: "nav.shop",
    Icon: IconShop,
    match: ["/magaza"],
    activeBg: "bg-brand/12",
    activeText: "text-brand",
  },
  {
    href: "/profil",
    key: "nav.profile",
    Icon: IconProfile,
    match: ["/profil"],
    activeBg: "bg-brand/12",
    activeText: "text-brand",
  },
  {
    href: "/daha",
    key: "nav.more",
    Icon: IconMore,
    match: ["/daha"],
    activeBg: "bg-brand/12",
    activeText: "text-brand",
  },
];

export default function Sidebar() {
  // Girişsiz ziyarətçiyə sidebar göstərilmir: Liqa/Mağaza/Görevlər/Profil bəndlərinin
  // HAMISI giriş tələb edir, yəni qonaq üçün ölü linklərdir. Bu, onboarding-də
  // "Sonra" seçib yolda gəzən şagirdə də aiddir (bax lib/guest.ts).
  const { user, ready: authReady } = useOptionalUser();
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const [isAdmin, setIsAdmin] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [adminPending, setAdminPending] = useState(0); // gözləyən müəllim müraciətləri

  // Səhifə dəyişəndə mobil "Daha çoxu" vərəqini bağla — render fazasında,
  // əvvəlki path ilə müqayisə (effektsiz, əlavə render yaratmır).
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setMoreOpen(false);
  }

  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
  }, []);
  // Admin: gözləyən müəllim müraciətləri sayı (bildiriş badge-i). Səhifə dəyişəndə yenilə.
  useEffect(() => {
    if (!isAdmin) return;
    adminListTeacherRequests().then((r) => setAdminPending(r.length)).catch(() => {});
  }, [isAdmin, pathname]);
  const isActive = (match: string[]) =>
    match.some((m) => pathname === m || pathname.startsWith(m + "/"));

  async function logout() {
    await signOut();
    router.replace("/");
  }

  // Sessiya oxunana qədər heç nə göstərmirik ki, sidebar "yanıb-sönməsin".
  if (!authReady || !user) return null;

  return (
    <>
      {/* Desktop — sol panel */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-line bg-panel px-3 py-5 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
          <Logo size={32} />
          <span className="text-lg font-extrabold text-brand">
            Imparo
          </span>
        </Link>

        <nav className="mt-8 flex flex-col gap-1.5">
          {NAV.map(({ href, key, Icon, match, activeBg, activeText }) => {
            const label = t(key);
            const on = isActive(match);
            const cls = `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold transition ${
              on ? `${activeBg} ${activeText}` : "text-muted hover:bg-panel-2 hover:text-fg"
            }`;
            const iconEl = (
              <span className="relative">
                <Icon size={28} />
              </span>
            );

            // "Daha çoxu" — üzərinə gələndə yan flyout (Ayarlar, Yardım mərkəzi)
            if (href === "/daha") {
              return (
                <div key={href} className="group relative">
                  <Link href={href} className={`${cls} justify-between`}>
                    <span className="flex items-center gap-3">
                      {iconEl}
                      {label}
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                  {/* Flyout */}
                  <div className="invisible absolute left-full top-0 z-40 pl-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
                    <div className="w-56 rounded-2xl border border-line bg-panel p-1.5 shadow-xl">
                      <FlyoutLink href="/mekteb" Icon={School} label={t("nav.schools")} />
                      <FlyoutLink href="/plus" Icon={Crown} label="Imparo Plus" />
                      <FlyoutLink href="/ayarlar" Icon={Settings} label={t("nav.settings")} />
                      <FlyoutLink href="/yardim" Icon={HelpCircle} label={t("nav.help")} />
                      {isAdmin && (
                        <FlyoutLink href="/admin" Icon={ShieldCheck} label="Admin" badge={adminPending} />
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link key={href} href={href} className={cls}>
                {iconEl}
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted transition hover:bg-panel-2 hover:text-fg"
        >
          <LogOut size={20} strokeWidth={2.2} />
          {t("nav.logout")}
        </button>
      </aside>

      {/* Mobil "Daha çoxu" vərəqi — alt paneldən yuxarı açılır */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              aria-hidden
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed inset-x-0 bottom-[68px] z-40 mx-3 rounded-3xl border border-line bg-panel p-2 shadow-2xl lg:hidden"
            >
              <SheetLink href="/praktika" Icon={Dumbbell} label={t("nav.practice")} onNavigate={() => setMoreOpen(false)} />
              <SheetLink href="/gorevler" Icon={Target} label={t("nav.quests")} onNavigate={() => setMoreOpen(false)} />
              <SheetLink href="/magaza" Icon={ShoppingBag} label={t("nav.shop")} onNavigate={() => setMoreOpen(false)} />
              <SheetLink href="/profil" Icon={User} label={t("nav.profile")} onNavigate={() => setMoreOpen(false)} />
              <SheetLink href="/ayarlar" Icon={Settings} label={t("nav.settings")} onNavigate={() => setMoreOpen(false)} />
              <SheetLink href="/yardim" Icon={HelpCircle} label={t("nav.help")} onNavigate={() => setMoreOpen(false)} />
              {isAdmin && (
                <SheetLink href="/admin" Icon={ShieldCheck} label="Admin" badge={adminPending} onNavigate={() => setMoreOpen(false)} />
              )}
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-500 transition hover:bg-red-500/10"
              >
                <LogOut size={20} /> {t("nav.logout")}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobil — alt panel: yalnız ikonlar (yazısız). "Daha çoxu" vərəq açır. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-panel py-2 lg:hidden">
        {NAV.filter(({ href }) => MOBILE_HREFS.includes(href)).map(
          ({ href, Icon, match, activeBg }) => {
            const isMore = href === "/daha";
            const on = isMore ? moreOpen : isActive(match);
            const iconSpan = (
              <span
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                  on ? activeBg : "opacity-80"
                }`}
              >
                <Icon size={34} />
              </span>
            );
            const aria = t(NAV.find((n) => n.href === href)!.key);
            return isMore ? (
              <button
                key={href}
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-label={aria}
                className="flex flex-1 flex-col items-center"
              >
                {iconSpan}
              </button>
            ) : (
              <Link
                key={href}
                href={href}
                aria-label={aria}
                className="flex flex-1 flex-col items-center"
              >
                {iconSpan}
              </Link>
            );
          },
        )}
      </nav>
    </>
  );
}

// Mobil "Daha çoxu" vərəqindəki sətir.
function SheetLink({
  href,
  Icon,
  label,
  badge,
  onNavigate,
}: {
  href: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  badge?: number;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-fg transition hover:bg-panel-2"
    >
      <span className="relative">
        <Icon size={22} className="text-muted" />
      </span>
      <span className="flex-1">{label}</span>
      {!!badge && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-extrabold text-white">
          {badge}
        </span>
      )}
      <ChevronRight size={18} className="text-muted" />
    </Link>
  );
}

function FlyoutLink({
  href,
  Icon,
  label,
  badge,
}: {
  href: string;
  Icon: React.ComponentType<{ size?: number }>;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-muted transition hover:bg-panel-2 hover:text-fg"
    >
      <Icon size={20} />
      <span className="flex-1">{label}</span>
      {!!badge && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-extrabold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
