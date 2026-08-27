"use client";

// Admin · Panel — ümumi baxış (KPI göstəriciləri, siqnallar, böyümə, sürətli keçidlər).
// Böyük-şirkət admin panelinin "ana səhifəsi". Data mövcud admin RPC-lərindən.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Flame, Crown, Star, UserPlus, TrendingUp, GraduationCap,
  MessageSquare, ChevronRight, Activity,
} from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  checkIsAdmin, adminUserStats, adminGrowth, adminListTeacherRequests,
  type AdminUserStats, type AdminGrowth,
} from "@/lib/adminApi";
import { createClient } from "@/lib/supabase/client";
import { PageSkeleton } from "@/components/Skeleton";
import { PageShell, PageHeader, SectionTitle, StatCard, Card } from "@/components/admin/ui";

export default function AdminPanelPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [growth, setGrowth] = useState<AdminGrowth | null>(null);
  const [pendingTeachers, setPendingTeachers] = useState(0);
  const [openFeedback, setOpenFeedback] = useState(0);

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);
  useEffect(() => {
    if (isAdmin !== true) return;
    adminUserStats().then(setStats);
    adminGrowth().then(setGrowth);
    adminListTeacherRequests().then((r) => setPendingTeachers(r.length)).catch(() => {});
    createClient().from("task_feedback").select("resolved").then(({ data }) =>
      setOpenFeedback((data ?? []).filter((f: { resolved: boolean }) => !f.resolved).length),
    );
  }, [isAdmin]);

  if (!ready || !user || isAdmin !== true || !stats) return <PageSkeleton />;

  const g = growth;
  const convRate = g && g.funnel.signed_up > 0
    ? Math.round((g.funnel.plus / g.funnel.signed_up) * 1000) / 10 : 0;

  return (
    <PageShell>
      <PageHeader
        Icon={Activity}
        title="İdarəetmə paneli"
        desc="Platformanın ümumi vəziyyəti — istifadəçi bazası, aktivlik, böyümə və gözləyən əməliyyatlar."
      />

      {/* Siqnallar — diqqət tələb edən əməliyyatlar */}
      {(pendingTeachers > 0 || openFeedback > 0) && (
        <div className="mb-6 space-y-2">
          {pendingTeachers > 0 && (
            <Alert href="/admin/muellimler" Icon={GraduationCap}
              text={`${pendingTeachers} müəllimlik müraciəti gözləyir`} tone="amber" />
          )}
          {openFeedback > 0 && (
            <Alert href="/admin/feedback" Icon={MessageSquare}
              text={`${openFeedback} açıq istifadəçi rəyi var`} tone="brand" />
          )}
        </div>
      )}

      {/* Əsas KPI-lar */}
      <SectionTitle>Əsas göstəricilər</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard Icon={Users} label="Ümumi istifadəçi" value={stats.total} tint="text-brand" />
        <StatCard Icon={Activity} label="Aktiv (bu gün)" value={g?.dau ?? 0} tint="text-emerald-500" />
        <StatCard Icon={Flame} label="Aktiv (7 gün)" value={stats.active7} tint="text-orange-500" />
        <StatCard Icon={TrendingUp} label="Aktiv (30 gün)" value={stats.active30} tint="text-sky-500" />
        <StatCard Icon={UserPlus} label="Yeni (7 gün)" value={stats.new7} tint="text-emerald-500" />
        <StatCard Icon={Crown} label="Plus abunə" value={stats.plus_count} tint="text-amber-500" />
        <StatCard Icon={Star} label="Ümumi XP" value={stats.total_xp} tint="text-accent" />
        <StatCard Icon={TrendingUp} label="Plus konversiya" value={convRate} suffix="%" tint="text-amber-500" />
      </div>

      {/* Böyümə funnel + qrafik */}
      {g && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card title="Qıf (funnel)" desc="Qeydiyyatdan Plus abunəyə qədər çevrilmə">
            <Funnel label="Qeydiyyat" v={g.funnel.signed_up} max={g.funnel.signed_up} tone="bg-brand" />
            <Funnel label="İlk dərsi etdi" v={g.funnel.activated} max={g.funnel.signed_up} tone="bg-emerald-500" />
            <Funnel label="7 gündə qayıtdı" v={g.funnel.retained7} max={g.funnel.signed_up} tone="bg-amber-500" />
            <Funnel label="Plus aldı" v={g.funnel.plus} max={g.funnel.signed_up} tone="bg-yellow-400" />
          </Card>
          <Card title="Qeydiyyat" desc="Son 14 gün">
            <Bars data={g.signups_daily} />
          </Card>
        </div>
      )}

      {/* Sürətli keçidlər */}
      <SectionTitle>Bölmələr</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Quick href="/admin/istifadeciler" label="İstifadəçilər" desc="Cədvəl, detal, əməliyyatlar" />
        <Quick href="/admin/analitika" label="Analitika" desc="Böyümə, məzmun, liqa" />
        <Quick href="/admin" label="Məzmun" desc="Fənn/bölmə/dərs CRUD" />
        <Quick href="/admin/mekteb" label="Məktəb (B2B)" desc="Siniflər, müəllimlər" />
        <Quick href="/admin/muellimler" label="Müəllimlər" desc="Müraciət təsdiqi" />
        <Quick href="/admin/elan" label="Elanlar" desc="Bildiriş göndər" />
      </div>
    </PageShell>
  );
}

function Alert({ href, Icon, text, tone }: {
  href: string; Icon: React.ComponentType<{ size?: number; className?: string }>;
  text: string; tone: "amber" | "brand";
}) {
  const cls = tone === "amber"
    ? "border-amber-500/30 bg-amber-500/[0.07] text-amber-700 dark:text-amber-400"
    : "border-brand/30 bg-brand/[0.06] text-brand";
  return (
    <Link href={href} className={`flex items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:brightness-[1.03] ${cls}`}>
      <Icon size={16} className="shrink-0" />
      <span className="flex-1">{text}</span>
      <ChevronRight size={15} className="shrink-0 opacity-70" />
    </Link>
  );
}

function Funnel({ label, v, max, tone }: { label: string; v: number; max: number; tone: string }) {
  const pct = max > 0 ? Math.round((v / max) * 100) : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-baseline justify-between text-[12px]">
        <span className="font-medium text-fg">{label}</span>
        <span className="tabular text-muted">
          <b className="font-semibold text-fg">{v.toLocaleString("az")}</b> · {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  );
}

function Bars({ data }: { data: { d: string; n: number }[] }) {
  const max = Math.max(1, ...data.map((x) => x.n));
  const total = data.reduce((s, x) => s + x.n, 0);
  return (
    <div>
      <div className="tabular mb-3 text-[12px] text-muted">
        cəmi <b className="font-semibold text-fg">{total}</b> · ən çox <b className="font-semibold text-fg">{max}</b>
      </div>
      <div className="flex h-24 items-end gap-[3px]">
        {data.map((x, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end" title={`${x.d}: ${x.n}`}>
            <span className={`tabular text-[9px] font-medium leading-none ${x.n > 0 ? "text-muted" : "text-transparent"}`}>{x.n}</span>
            <div className={`mt-1 w-full rounded-[2px] bg-brand ${x.n === 0 ? "opacity-25" : ""}`}
              style={{ height: `${Math.max((x.n / max) * 100, x.n > 0 ? 6 : 3)}%` }} />
            <span className="tabular mt-1.5 text-[9px] leading-none text-muted/70">{x.d.slice(8)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Quick({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="admin-surface group rounded-[10px] p-4 transition-colors hover:border-brand/40">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-fg group-hover:text-brand">{label}</span>
        <ChevronRight size={15} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-1 text-[12px] leading-relaxed text-muted">{desc}</div>
    </Link>
  );
}
