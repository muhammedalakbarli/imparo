"use client";

// Admin · Adminlər — admin siyahısı və rolları (super vs moderator). Yalnız admin görür.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Star } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { checkIsAdmin, checkIsSuperAdmin, adminListAdmins, type AdminRow } from "@/lib/adminApi";
import { PageSkeleton } from "@/components/Skeleton";

export default function AdminAdminsPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSuper, setIsSuper] = useState(false);
  const [rows, setRows] = useState<AdminRow[] | null>(null);

  useEffect(() => { if (user) { checkIsAdmin().then(setIsAdmin); checkIsSuperAdmin().then(setIsSuper); } }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);
  useEffect(() => { if (isAdmin === true) adminListAdmins().then(setRows); }, [isAdmin]);

  if (!ready || !user || isAdmin !== true || !rows) return <PageSkeleton />;

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-fg">
        <ShieldCheck size={22} className="text-brand" /> Adminlər
      </h1>
      <p className="mt-1 text-sm text-muted">
        Admin hesabları və səlahiyyət səviyyələri. <b>Super-admin</b> hesab silə və rolları idarə edə bilər;
        <b> moderator</b> qalan əməliyyatları edir.
      </p>

      <div className="mt-4 overflow-hidden rounded-[10px] border border-line bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-bold">Ad</th>
              <th className="px-3 py-3 font-bold">Email</th>
              <th className="px-3 py-3 font-bold">Rol</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-b border-line/60 last:border-b-0">
                <td className="px-4 py-2.5 font-semibold text-fg">{r.name}</td>
                <td className="max-w-[220px] truncate px-3 py-2.5 text-muted">{r.email}</td>
                <td className="px-3 py-2.5">
                  {r.role === "super" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600">
                      <Star size={12} fill="currentColor" /> Super
                    </span>
                  ) : (
                    <span className="rounded-full bg-panel-2 px-2.5 py-1 text-xs font-bold text-muted">Moderator</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-muted">
        {isSuper
          ? "Sən super-admin-sən. Yeni admin əlavə etmək üçün Supabase → admins cədvəlinə user_id + role yaz (self-escalation qorunması)."
          : "Rol dəyişikliyi yalnız super-admin tərəfindən (Supabase SQL Editor) edilir."}
      </p>
    </main>
  );
}
