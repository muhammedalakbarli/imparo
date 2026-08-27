"use client";

// Admin · Məktəb (B2B) icmalı — siniflər, müəllim, üzv/tapşırıq sayı, aktivlik.
// Yalnız is_admin() girə bilir (admin_schools RPC).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, School, Users, ClipboardList } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { checkIsAdmin, adminSchools, type AdminSchool } from "@/lib/adminApi";
import { PageSkeleton } from "@/components/Skeleton";

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("az-AZ", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminSchoolsPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminSchool[] | null>(null);

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);
  useEffect(() => { if (isAdmin === true) adminSchools().then(setRows); }, [isAdmin]);

  if (!ready || !user || isAdmin !== true || !rows) return <PageSkeleton />;

  const totalMembers = rows.reduce((n, r) => n + Number(r.members), 0);
  const totalAssign = rows.reduce((n, r) => n + Number(r.assignments), 0);

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8">
        <Link href="/admin" className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-fg">
          <ArrowLeft size={16} /> Admin
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-fg">Məktəb (B2B)</h1>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Card Icon={School} label="Sinif" value={rows.length} tint="text-brand" />
          <Card Icon={Users} label="Şagird" value={totalMembers} tint="text-emerald-500" />
          <Card Icon={ClipboardList} label="Tapşırıq" value={totalAssign} tint="text-amber-500" />
        </div>

        {rows.length === 0 ? (
          <p className="mt-8 text-center text-muted">Hələ sinif yaradılmayıb.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-[10px] border border-line bg-panel">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-bold">Sinif</th>
                  <th className="px-3 py-3 font-bold">Kod</th>
                  <th className="px-3 py-3 font-bold">Fənn / Sinif</th>
                  <th className="px-3 py-3 font-bold">Müəllim</th>
                  <th className="px-3 py-3 text-right font-bold">Şagird</th>
                  <th className="px-3 py-3 text-right font-bold">Tapşırıq</th>
                  <th className="px-3 py-3 font-bold">Yaradıldı</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.class_id} className="border-b border-line/60 last:border-b-0">
                    <td className="px-4 py-2.5 font-semibold text-fg">{r.name}</td>
                    <td className="px-3 py-2.5 font-mono text-muted">{r.code}</td>
                    <td className="px-3 py-2.5 text-muted">{r.subject_slug} · {r.grade}</td>
                    <td className="max-w-[200px] truncate px-3 py-2.5 text-muted">{r.teacher_email ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{Number(r.members)}</td>
                    <td className="px-3 py-2.5 text-right text-amber-500">{Number(r.assignments)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted">{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function Card({ Icon, label, value, tint }: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string; value: number; tint: string;
}) {
  return (
    <div className="rounded-[10px] border border-line bg-panel p-4 text-center">
      <Icon size={20} className={`mx-auto ${tint}`} />
      <div className="mt-1 text-xl font-semibold text-fg">{value.toLocaleString("az")}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}
