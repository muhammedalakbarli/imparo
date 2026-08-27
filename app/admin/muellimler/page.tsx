"use client";

// Admin · Müəllimlər — müəllimlik müraciətlərini təsdiq/rədd et, təsdiqlənmiş müəllimləri idarə et.
// Yalnız təsdiqlənmiş müəllim sinif aça bilir (Duolingo for Schools məntiqi).

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Check, X, Trash2 } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  checkIsAdmin, adminListTeacherRequests, adminListTeachers,
  adminApproveTeacher, adminRejectTeacher, adminRevokeTeacher,
  type AdminTeacherRequest, type AdminTeacher,
} from "@/lib/adminApi";
import { PageSkeleton } from "@/components/Skeleton";
import { toast } from "sonner";
import { useConfirm } from "@/components/admin/ConfirmDialog";

function fmtDate(s: string): string {
  return new Date(s).toLocaleString("az-AZ", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminTeachersPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reqs, setReqs] = useState<AdminTeacherRequest[] | null>(null);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  const reload = useCallback(() => {
    adminListTeacherRequests().then(setReqs);
    adminListTeachers().then(setTeachers);
  }, []);

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);
  useEffect(() => { if (isAdmin === true) reload(); }, [isAdmin, reload]);

  async function act(fn: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (!r.ok) { toast.error(r.error || "Xəta baş verdi"); return; }
    toast.success(successMsg);
    reload();
  }

  if (!ready || !user || isAdmin !== true || !reqs) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8">
        <Link href="/admin" className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-fg">
          <ArrowLeft size={16} /> Admin
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold text-fg">
          <GraduationCap size={22} className="text-brand" /> Müəllimlər
        </h1>

        {/* Gözləyən müraciətlər */}
        <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-muted">
          Gözləyən müraciətlər ({reqs.length})
        </h2>
        {reqs.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Yeni müraciət yoxdur.</p>
        ) : (
          <div className="mt-2 space-y-3">
            {reqs.map((r) => (
              <div key={r.user_id} className="rounded-[10px] border border-brand/40 bg-brand/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-fg">{r.name}</div>
                    <div className="truncate text-sm text-muted">{r.email}</div>
                    {r.note && <p className="mt-1.5 whitespace-pre-wrap text-sm text-fg/80">“{r.note}”</p>}
                    <div className="mt-1 text-[11px] text-muted">{fmtDate(r.created_at)}</div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      disabled={busy}
                      onClick={() => act(() => adminApproveTeacher(r.user_id), `${r.name} müəllim təsdiqləndi`)}
                      className="flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <Check size={15} /> Təsdiq
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => act(() => adminRejectTeacher(r.user_id), "Müraciət rədd edildi")}
                      className="flex items-center gap-1 rounded-md border-2 border-red-500/40 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <X size={15} /> Rədd
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Təsdiqlənmiş müəllimlər */}
        <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">
          Təsdiqlənmiş müəllimlər ({teachers.length})
        </h2>
        {teachers.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Hələ müəllim yoxdur.</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-[10px] border border-line bg-panel">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-bold">Ad</th>
                  <th className="px-3 py-3 font-bold">Email</th>
                  <th className="px-3 py-3 text-right font-bold">Sinif</th>
                  <th className="px-3 py-3 font-bold">Təsdiq</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.user_id} className="border-b border-line/60 last:border-b-0">
                    <td className="px-4 py-2.5 font-semibold text-fg">{t.name}</td>
                    <td className="max-w-[200px] truncate px-3 py-2.5 text-muted">{t.email}</td>
                    <td className="px-3 py-2.5 text-right text-brand">{Number(t.classes)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted">{fmtDate(t.approved_at)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        disabled={busy}
                        title="Müəllimliyi geri al"
                        onClick={async () => {
                          if (await confirm({ title: "Müəllimliyi geri al?", message: `${t.name} artıq sinif aça bilməyəcək.`, danger: true, confirmText: "Geri al" }))
                            act(() => adminRevokeTeacher(t.user_id), "Müəllimlik geri alındı");
                        }}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
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
