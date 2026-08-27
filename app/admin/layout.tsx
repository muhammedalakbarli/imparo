"use client";

// Admin çərçivəsi — korporativ idarəetmə konsolu.
//
// Dizayn qərarı: bütün /admin/* subtree-si `.admin-theme` sinfinə bükülür (bax
// globals.css). Bu, dizayn tokenlərini şagird tərəfindəki isti/krem-narıncı
// palitradan neytral korporativ palitraya (sərin boz fon, ağ kartlar, mavi vurğu,
// Inter şrifti) çevirir. Şagird tərəfi toxunulmamış qalır.
//
// Struktur: sol yan panel (bölmələrə görə qruplaşdırılmış naviqasiya) + yuxarıda
// sabit üst zolaq (breadcrumb · axtarış · hesab). Mobil: sürüşən çekmecə.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, BookOpen, Users, BarChart3, School,
  GraduationCap, Megaphone, MessageSquare, ExternalLink,
  TrendingUp, Gauge, ShieldAlert, ShieldCheck, Search, Siren, Bot,
  Menu, X, ChevronRight,
} from "lucide-react";
import { Toaster } from "sonner";
import Logo from "@/components/Logo";
import { ConfirmProvider } from "@/components/admin/ConfirmDialog";
import CommandPalette from "@/components/admin/CommandPalette";
import { checkIsAdmin, adminListTeacherRequests } from "@/lib/adminApi";
import { useAuthUser } from "@/lib/useAuthUser";

interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
  badge?: "teachers";
}

// Naviqasiya məna qruplarına bölünüb — 13 element düz siyahıda "divar" kimi görünürdü.
const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Ümumi baxış",
    items: [
      { href: "/admin/panel", label: "Panel", Icon: LayoutDashboard },
      { href: "/admin/analitika", label: "Analitika", Icon: BarChart3 },
      { href: "/admin/gelir", label: "Gəlir", Icon: TrendingUp },
      { href: "/admin/mezmun-performans", label: "Performans", Icon: Gauge },
    ],
  },
  {
    title: "İdarəetmə",
    items: [
      { href: "/admin", label: "Məzmun", Icon: BookOpen, exact: true },
      { href: "/admin/istifadeciler", label: "İstifadəçilər", Icon: Users },
      { href: "/admin/botlar", label: "Moderasiya", Icon: Bot },
      { href: "/admin/elan", label: "Elanlar", Icon: Megaphone },
      { href: "/admin/feedback", label: "Rəylər", Icon: MessageSquare },
    ],
  },
  {
    title: "Məktəb (B2B)",
    items: [
      { href: "/admin/mekteb", label: "Siniflər", Icon: School },
      { href: "/admin/muellimler", label: "Müəllimlər", Icon: GraduationCap, badge: "teachers" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/admin/tehlukesizlik", label: "Təhlükəsizlik", Icon: Siren },
      { href: "/admin/audit", label: "Audit jurnalı", Icon: ShieldAlert },
      { href: "/admin/adminler", label: "Adminlər", Icon: ShieldCheck },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pending, setPending] = useState(0);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => { checkIsAdmin().then(setIsAdmin); }, []);
  useEffect(() => {
    if (isAdmin) adminListTeacherRequests().then((r) => setPending(r.length)).catch(() => {});
  }, [isAdmin, pathname]);
  // Səhifə dəyişəndə mobil çekmecə bağlansın. Effekt yox, render zamanı düzəliş
  // (React-in rəsmi "derive state from props" nümunəsi) — effekt kaskad render yaradırdı.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawer(false);
  }

  // Admin deyilsə layout çərçivəsi göstərmə (səhifələr özləri yönləndirir).
  if (!isAdmin) return <>{children}</>;

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");

  const current = ALL_ITEMS.find(isActive);
  const currentGroup = NAV_GROUPS.find((g) => g.items.some(isActive));

  const navList = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
      {NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted/80">
            {group.title}
          </div>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const on = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={on ? "page" : undefined}
                  className={`group relative flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13px] font-medium transition-colors ${
                    on
                      ? "bg-brand/[0.08] text-brand"
                      : "text-muted hover:bg-panel-2 hover:text-fg"
                  }`}
                >
                  {/* Aktiv göstərici — sol kənarda nazik zolaq (korporativ konsol nümunəsi) */}
                  {on && (
                    <span className="absolute inset-y-1 left-0 w-[2.5px] rounded-r bg-brand" aria-hidden />
                  )}
                  <item.Icon size={16} className={on ? "text-brand" : "text-muted group-hover:text-fg"} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge === "teachers" && pending > 0 && (
                    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                      {pending}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <Link href="/admin/panel" className="flex items-center gap-2.5">
      <Logo size={26} />
      <span className="flex flex-col leading-none">
        <span className="text-[13px] font-semibold tracking-tight text-fg">Imparo</span>
        <span className="mt-[3px] text-[10px] font-medium uppercase tracking-[0.11em] text-muted">
          İdarəetmə konsolu
        </span>
      </span>
    </Link>
  );

  return (
    <ConfirmProvider>
      <div className="admin-theme min-h-screen bg-ink text-fg">
        <Toaster richColors position="top-center" toastOptions={{ style: { fontWeight: 500 } }} />
        <CommandPalette />

        {/* ── Yan panel (desktop) ── */}
        <aside
          className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line px-3 py-4 lg:flex"
          style={{ background: "var(--admin-sidebar)" }}
        >
          <div className="px-2 pb-4">{brand}</div>

          <button
            onClick={() => window.dispatchEvent(new Event("admin-cmdk"))}
            className="mb-5 flex items-center gap-2 rounded-md border border-line bg-panel-2/60 px-2.5 py-[7px] text-[13px] text-muted transition-colors hover:border-brand/40 hover:text-fg"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Axtar</span>
            <kbd className="rounded border border-line px-1 py-px font-sans text-[10px] font-medium text-muted">
              ⌘K
            </kbd>
          </button>

          {navList}

          <div className="mt-4 border-t border-line pt-3">
            <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold uppercase text-brand">
                {(user?.email ?? "A").slice(0, 2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-fg">
                  {user?.email ?? "Admin"}
                </span>
                <span className="block text-[10px] text-muted">Administrator</span>
              </span>
            </div>
            <Link
              href="/dashboard"
              className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13px] font-medium text-muted transition-colors hover:bg-panel-2 hover:text-fg"
            >
              <ExternalLink size={15} /> Sayta qayıt
            </Link>
          </div>
        </aside>

        {/* ── Mobil çekmecə ── */}
        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/50"
              onClick={() => setDrawer(false)}
              aria-hidden
            />
            <aside
              className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line px-3 py-4"
              style={{ background: "var(--admin-sidebar)" }}
            >
              <div className="flex items-center justify-between px-2 pb-4">
                {brand}
                <button
                  onClick={() => setDrawer(false)}
                  aria-label="Bağla"
                  className="rounded-md p-1 text-muted hover:bg-panel-2 hover:text-fg"
                >
                  <X size={18} />
                </button>
              </div>
              {navList}
              <Link
                href="/dashboard"
                className="mt-3 flex items-center gap-2.5 border-t border-line px-3 pt-3 text-[13px] font-medium text-muted"
              >
                <ExternalLink size={15} /> Sayta qayıt
              </Link>
            </aside>
          </div>
        )}

        {/* ── Üst zolaq + məzmun ── */}
        <div className="lg:pl-60">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-panel/85 px-4 backdrop-blur lg:px-8">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Menyu"
              className="rounded-md p-1.5 text-muted hover:bg-panel-2 hover:text-fg lg:hidden"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb — hansı bölmədə olduğun həmişə görünsün */}
            <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
              <span className="hidden text-muted sm:inline">Admin</span>
              {currentGroup && (
                <>
                  <ChevronRight size={13} className="hidden shrink-0 text-muted/60 sm:inline" />
                  <span className="hidden text-muted sm:inline">{currentGroup.title}</span>
                </>
              )}
              <ChevronRight size={13} className="hidden shrink-0 text-muted/60 sm:inline" />
              <span className="truncate font-semibold text-fg">{current?.label ?? "Panel"}</span>
            </div>

            <div className="flex-1" />

            <button
              onClick={() => window.dispatchEvent(new Event("admin-cmdk"))}
              aria-label="Axtar"
              className="rounded-md p-1.5 text-muted hover:bg-panel-2 hover:text-fg lg:hidden"
            >
              <Search size={18} />
            </button>
            <span className="hidden h-7 items-center rounded-full border border-line px-2.5 text-[11px] font-medium text-muted lg:inline-flex">
              Canlı mühit
            </span>
          </header>

          {children}
        </div>
      </div>
    </ConfirmProvider>
  );
}
