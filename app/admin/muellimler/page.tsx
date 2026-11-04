"use client";

// Admin · Müəllimlər — dəvət linkləri, müraciətlər, təsdiqlənmiş müəllimlər.
//
// İki yol:
//   • DƏVƏT LİNKİ — tanıdığınız müəllim üçün. Link açılıb daxil olunan kimi müəllim
//     hesabı hazırdır (təsdiqi siz əvvəlcədən verirsiniz). E-poçta bağlansa yalnız
//     həmin ünvanın Google hesabı qəbul olunur.
//   • MÜRACİƏT — sayta özü gələn müəllim. Təsdiq edəndə ona avtomatik məktub gedir.
// Bax supabase/migrations/0030_teacher_gate.sql, 0063_teacher_onboarding.sql.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Check, X, Trash2, Link2, Copy, Send, Ban, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  checkIsAdmin, adminListTeacherRequests, adminListTeachers,
  adminApproveTeacher, adminRejectTeacher, adminRevokeTeacher,
  adminListTeacherInvites, adminCreateTeacherInvite, adminRevokeTeacherInvite,
  type AdminTeacherRequest, type AdminTeacher, type AdminTeacherInvite,
} from "@/lib/adminApi";
import { notifyTeacherApproved } from "@/lib/teacher";
import { SITE_URL } from "@/lib/site";
import { PageSkeleton } from "@/components/Skeleton";
import { toast } from "sonner";
import { useConfirm } from "@/components/admin/ConfirmDialog";

function fmtDate(s: string): string {
  return new Date(s).toLocaleString("az-AZ", { dateStyle: "medium", timeStyle: "short" });
}
function fmtDay(s: string): string {
  return new Date(s).toLocaleDateString("az-AZ", { day: "numeric", month: "short" });
}

const inviteUrl = (token: string) => `${SITE_URL}/muellim-ol?devet=${token}`;
const shareText = (url: string) =>
  `Salam! Sizi Imparo-ya müəllim kimi dəvət edirəm. Bu linkə keçin və Google ilə daxil olun — ` +
  `müəllim hesabınız dərhal hazır olacaq:\n${url}`;

function inviteState(i: AdminTeacherInvite): { label: string; cls: string; active: boolean } {
  if (i.revoked_at) return { label: "Ləğv edilib", cls: "bg-red-500/10 text-red-500", active: false };
  if (new Date(i.expires_at) < new Date()) return { label: "Vaxtı keçib", cls: "bg-slate-500/10 text-muted", active: false };
  if (i.uses >= i.max_uses) return { label: "İstifadə olunub", cls: "bg-emerald-500/10 text-emerald-600", active: false };
  return { label: "Aktiv", cls: "bg-brand/10 text-brand", active: true };
}

const VIA: Record<AdminTeacher["via"], string> = { request: "Müraciət", invite: "Dəvət", admin: "Admin" };

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Kopyalandı");
  } catch {
    toast.error("Kopyalanmadı — linki əl ilə seçin");
  }
}

export default function AdminTeachersPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reqs, setReqs] = useState<AdminTeacherRequest[] | null>(null);
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [invites, setInvites] = useState<AdminTeacherInvite[]>([]);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  // Dəvət forması
  const [invEmail, setInvEmail] = useState("");
  const [invNote, setInvNote] = useState("");
  const [invUses, setInvUses] = useState(1);
  const [invDays, setInvDays] = useState(14);
  const [created, setCreated] = useState<string | null>(null);

  const reload = useCallback(() => {
    adminListTeacherRequests().then(setReqs);
    adminListTeachers().then(setTeachers);
    adminListTeacherInvites().then(setInvites);
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

  async function approve(r: AdminTeacherRequest) {
    setBusy(true);
    const res = await adminApproveTeacher(r.user_id);
    if (!res.ok) {
      setBusy(false);
      toast.error(res.error || "Xəta baş verdi");
      return;
    }
    const mailed = await notifyTeacherApproved(r.user_id);
    setBusy(false);
    toast.success(
      mailed ? `${r.name} təsdiqləndi — ona məktub getdi` : `${r.name} təsdiqləndi (məktub göndərilmədi)`,
    );
    reload();
  }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const r = await adminCreateTeacherInvite({
      email: invEmail,
      note: invNote,
      maxUses: invEmail.trim() ? 1 : invUses,
      days: invDays,
    });
    setBusy(false);
    if (!r.ok || !r.token) { toast.error(r.error || "Link yaradılmadı"); return; }
    setCreated(inviteUrl(r.token));
    setInvEmail("");
    setInvNote("");
    setInvUses(1);
    reload();
  }

  if (!ready || !user || isAdmin !== true || !reqs) return <PageSkeleton />;

  const emailBound = invEmail.trim().length > 0;
  const input = "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-fg outline-none focus:border-brand";

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8">
        <Link href="/admin" className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-fg">
          <ArrowLeft size={16} /> Admin
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold text-fg">
          <GraduationCap size={22} className="text-brand" /> Müəllimlər
        </h1>

        {/* ── Dəvət linki ── */}
        <section className="mt-6 rounded-[10px] border border-line bg-panel p-5">
          <h2 className="flex items-center gap-2 font-bold text-fg">
            <Link2 size={18} className="text-brand" /> Dəvət linki yarat
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tanıdığınız müəllimə göndərin: linki açıb daxil olan kimi müəllim hesabı hazırdır, təsdiq gözləmir.
          </p>
          <form onSubmit={createInvite} className="mt-4 grid gap-3 sm:grid-cols-[1.4fr_1.4fr_auto_auto_auto] sm:items-end">
            <label className="text-xs font-bold text-muted">
              E-poçt (istəyə bağlı)
              <input
                value={invEmail}
                onChange={(e) => setInvEmail(e.target.value)}
                placeholder="muellim@gmail.com"
                type="email"
                className={`mt-1 ${input}`}
              />
            </label>
            <label className="text-xs font-bold text-muted">
              Qeyd (yalnız siz görürsünüz)
              <input
                value={invNote}
                onChange={(e) => setInvNote(e.target.value)}
                placeholder="Məs: 132 saylı məktəb, riyaziyyat"
                maxLength={200}
                className={`mt-1 ${input}`}
              />
            </label>
            <label className="text-xs font-bold text-muted">
              Nəfər
              <input
                value={emailBound ? 1 : invUses}
                onChange={(e) => setInvUses(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
                type="number"
                min={1}
                max={200}
                disabled={emailBound}
                title={emailBound ? "E-poçta bağlı link yalnız 1 nəfər üçündür" : "Bu linklə neçə müəllim qeydiyyatdan keçə bilər"}
                className={`mt-1 w-20 ${input} disabled:opacity-50`}
              />
            </label>
            <label className="text-xs font-bold text-muted">
              Gün
              <input
                value={invDays}
                onChange={(e) => setInvDays(Math.max(1, Math.min(90, Number(e.target.value) || 14)))}
                type="number"
                min={1}
                max={90}
                className={`mt-1 w-20 ${input}`}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              <Link2 size={15} /> Yarat
            </button>
          </form>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
            {emailBound ? (
              <>
                <ShieldCheck size={14} className="mt-px shrink-0 text-emerald-600" />
                Yalnız bu ünvanın Google hesabı ilə qəbul olunur — link başqasının əlinə keçsə də işləməz.
              </>
            ) : (
              <>
                <ShieldAlert size={14} className="mt-px shrink-0 text-amber-600" />
                Açıq link: kimdə olsa, müəllim ola bilər. Yalnız etibar etdiyiniz qrupa göndərin.
              </>
            )}
          </p>

          {created && (
            <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
              <div className="text-sm font-bold text-emerald-600">Link hazırdır</div>
              <div className="mt-2 break-all rounded-md bg-ink px-3 py-2 font-mono text-xs text-fg">{created}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copy(created)}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-bold text-fg hover:border-brand"
                >
                  <Copy size={14} /> Kopyala
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText(created))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-bold text-white hover:opacity-90"
                >
                  <Send size={14} /> WhatsApp-da göndər
                </a>
                <button
                  type="button"
                  onClick={() => copy(shareText(created))}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-bold text-fg hover:border-brand"
                >
                  <Copy size={14} /> Mətnlə birlikdə kopyala
                </button>
              </div>
            </div>
          )}

          {invites.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3 font-bold">Kimə</th>
                    <th className="px-3 py-2 font-bold">Vəziyyət</th>
                    <th className="px-3 py-2 font-bold">İstifadə</th>
                    <th className="px-3 py-2 font-bold">Bitir</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((i) => {
                    const st = inviteState(i);
                    return (
                      <tr key={i.token} className="border-b border-line/60 last:border-b-0">
                        <td className="max-w-[260px] py-2.5 pr-3">
                          <div className="truncate font-semibold text-fg">{i.email ?? "Açıq link"}</div>
                          {i.note && <div className="truncate text-xs text-muted">{i.note}</div>}
                          {i.used_by && <div className="truncate text-xs text-emerald-600">→ {i.used_by}</div>}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-3 py-2.5 text-muted">{i.uses}/{i.max_uses}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-muted">{fmtDay(i.expires_at)}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right">
                          {st.active && (
                            <>
                              <button
                                title="Linki kopyala"
                                onClick={() => copy(inviteUrl(i.token))}
                                className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-fg"
                              >
                                <Copy size={15} />
                              </button>
                              <button
                                disabled={busy}
                                title="Ləğv et"
                                onClick={async () => {
                                  if (await confirm({ title: "Dəvəti ləğv et?", message: "Link artıq işləməyəcək.", danger: true, confirmText: "Ləğv et" }))
                                    act(() => adminRevokeTeacherInvite(i.token), "Dəvət ləğv edildi");
                                }}
                                className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                              >
                                <Ban size={15} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Gözləyən müraciətlər ── */}
        <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">
          Gözləyən müraciətlər ({reqs.length})
        </h2>
        {reqs.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Yeni müraciət yoxdur.</p>
        ) : (
          <div className="mt-2 space-y-3">
            {reqs.map((r) => {
              const verified = r.provider !== "email";
              return (
                <div key={r.user_id} className="rounded-[10px] border border-brand/40 bg-brand/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-fg">{r.name}</div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                        <span className="truncate">{r.email}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            verified ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/15 text-amber-600"
                          }`}
                          title={verified ? "Ünvan Google tərəfindən təsdiqlənib" : "E-poçt/parol — ünvanın sahibi sübut olunmayıb"}
                        >
                          {verified ? "Google ✓" : "E-poçt (təsdiqsiz)"}
                        </span>
                      </div>
                      {(r.school || r.subject) && (
                        <div className="mt-1.5 text-sm font-semibold text-fg">
                          {[r.school, r.subject].filter(Boolean).join(" · ")}
                        </div>
                      )}
                      {r.note && <p className="mt-1.5 whitespace-pre-wrap text-sm text-fg/80">“{r.note}”</p>}
                      <div className="mt-1 text-[11px] text-muted">{fmtDate(r.created_at)}</div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        disabled={busy}
                        onClick={() => approve(r)}
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
              );
            })}
          </div>
        )}

        {/* ── Təsdiqlənmiş müəllimlər ── */}
        <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">
          Təsdiqlənmiş müəllimlər ({teachers.length})
        </h2>
        {teachers.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Hələ müəllim yoxdur.</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-[10px] border border-line bg-panel">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-bold">Ad</th>
                  <th className="px-3 py-3 font-bold">Email</th>
                  <th className="px-3 py-3 font-bold">Yol</th>
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
                    <td className="px-3 py-2.5 text-muted">{VIA[t.via] ?? t.via}</td>
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
