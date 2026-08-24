"use client";

// Admin command palette (⌘K / Ctrl+K) — sürətli naviqasiya. cmdk əsaslı.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard, BookOpen, Users, BarChart3, School, GraduationCap,
  Megaphone, MessageSquare, ShieldAlert, ShieldCheck, TrendingUp, Gauge, ExternalLink, Search, Siren, Bot,
} from "lucide-react";

const ITEMS = [
  { href: "/admin/panel", label: "Panel (overview)", Icon: LayoutDashboard },
  { href: "/admin", label: "Məzmun (fənn/dərs)", Icon: BookOpen },
  { href: "/admin/istifadeciler", label: "İstifadəçilər", Icon: Users },
  { href: "/admin/botlar", label: "Moderasiya (botlar / banlar)", Icon: Bot },
  { href: "/admin/analitika", label: "Analitika", Icon: BarChart3 },
  { href: "/admin/gelir", label: "Gəlir / abunə", Icon: TrendingUp },
  { href: "/admin/mezmun-performans", label: "Məzmun performansı", Icon: Gauge },
  { href: "/admin/mekteb", label: "Məktəb (B2B)", Icon: School },
  { href: "/admin/muellimler", label: "Müəllim müraciətləri", Icon: GraduationCap },
  { href: "/admin/elan", label: "Elanlar", Icon: Megaphone },
  { href: "/admin/feedback", label: "Rəylər", Icon: MessageSquare },
  { href: "/admin/audit", label: "Audit log", Icon: ShieldAlert },
  { href: "/admin/tehlukesizlik", label: "Təhlükəsizlik", Icon: Siren },
  { href: "/admin/adminler", label: "Adminlər / rollar", Icon: ShieldCheck },
  { href: "/dashboard", label: "Sayta qayıt", Icon: ExternalLink },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("admin-cmdk", onOpen);
    return () => { document.removeEventListener("keydown", onKey); window.removeEventListener("admin-cmdk", onOpen); };
  }, []);

  const go = (href: string) => { setOpen(false); router.push(href); };

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Admin axtarış"
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 p-4 pt-[15vh]">
      <div className="w-full max-w-lg overflow-hidden rounded-[10px] border border-line bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-line px-4">
          <Search size={16} className="text-muted" />
          <Command.Input placeholder="Bölmə axtar və ya keç…"
            className="w-full bg-transparent py-3.5 text-sm font-semibold text-fg outline-none placeholder:text-muted" />
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted">Nəticə yoxdur.</Command.Empty>
          <Command.Group heading="Bölmələr" className="text-[11px] font-bold uppercase tracking-wide text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            {ITEMS.map((it) => (
              <Command.Item key={it.href} value={it.label} onSelect={() => go(it.href)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-fg aria-selected:bg-brand/10 aria-selected:text-brand">
                <it.Icon size={16} /> {it.label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
