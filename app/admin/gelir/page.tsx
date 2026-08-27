"use client";

// Admin · Gəlir — Plus abunə, təxmini MRR, bitməyə yaxın/bitmiş abunələr, abunəçi siyahısı.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, TrendingUp, Clock, XCircle } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  checkIsAdmin, adminRevenue, adminPlusList,
  type AdminRevenue, type AdminPlusRow,
} from "@/lib/adminApi";
import { PageSkeleton } from "@/components/Skeleton";

// Imparo Plus qiymətləri (bax menu-monetization / plus): aylıq 2.99 ₼.
const MONTHLY_PRICE = 2.99;

export default function AdminRevenuePage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rev, setRev] = useState<AdminRevenue | null>(null);
  const [list, setList] = useState<AdminPlusRow[]>([]);

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);
  useEffect(() => {
    if (isAdmin !== true) return;
    adminRevenue().then(setRev);
    adminPlusList(200).then(setList);
  }, [isAdmin]);

  if (!ready || !user || isAdmin !== true || !rev) return <PageSkeleton />;

  const estMrr = (rev.active_plus * MONTHLY_PRICE).toFixed(2);

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-fg">
        <TrendingUp size={22} className="text-brand" /> Gəlir
      </h1>
      <p className="mt-1 text-sm text-muted">Imparo Plus abunə və təxmini gəlir.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card Icon={Crown} label="Aktiv Plus" value={String(rev.active_plus)} tint="text-amber-500" />
        <Card Icon={TrendingUp} label="Təxmini MRR" value={`${estMrr} ₼`} tint="text-emerald-500" />
        <Card Icon={Clock} label="30 gündə bitir" value={String(rev.expiring_30)} tint="text-orange-500" />
        <Card Icon={XCircle} label="Bitmiş" value={String(rev.expired)} tint="text-muted" />
      </div>
      <p className="mt-2 text-xs text-muted">
        * MRR təxminidir: aktiv Plus × {MONTHLY_PRICE} ₼ (illik abunələr aylıq ekvivalentə tam ayrılmır).
      </p>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Abunəçilər ({list.length})</h2>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Hələ aktiv abunəçi yoxdur.</p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-[10px] border border-line bg-panel">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-bold">Ad</th>
                <th className="px-3 py-3 font-bold">Email</th>
                <th className="px-3 py-3 font-bold">Bitmə tarixi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.user_id} className="border-b border-line/60 last:border-b-0">
                  <td className="px-4 py-2.5 font-semibold text-fg">{r.name}</td>
                  <td className="max-w-[220px] truncate px-3 py-2.5 text-muted">{r.email}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                    {r.plus_until ? new Date(r.plus_until).toLocaleDateString("az-AZ", { dateStyle: "medium" }) : "limitsiz"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Card({ Icon, label, value, tint }: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string; value: string; tint: string;
}) {
  return (
    <div className="rounded-[10px] border border-line bg-panel p-4">
      <Icon size={18} className={tint} />
      <div className="mt-2 text-2xl font-semibold text-fg">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}
