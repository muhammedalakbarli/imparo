"use client";

// Admin · Elanlar — bütün istifadəçilərə göstərilən bildiriş/banner yaz və idarə et.
// Yalnız is_admin() girə bilir. Aktiv elan hər istifadəçidə banner kimi görünür.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Megaphone, Trash2, Eye, EyeOff, Send } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  checkIsAdmin, adminListAnnouncements, adminPostAnnouncement,
  adminSetAnnouncementActive, adminDeleteAnnouncement, type Announcement,
} from "@/lib/adminApi";
import { PageSkeleton } from "@/components/Skeleton";
import { toast } from "sonner";
import { useConfirm } from "@/components/admin/ConfirmDialog";

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Announcement[] | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);
  useEffect(() => { if (isAdmin === true) adminListAnnouncements().then(setRows); }, [isAdmin]);

  async function reload() { setRows(await adminListAnnouncements()); }

  async function post() {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    const r = await adminPostAnnouncement(title.trim(), body.trim());
    setBusy(false);
    if (!r.ok) { toast.error(r.error || "Xəta baş verdi"); return; }
    toast.success("Elan yerləşdirildi");
    setTitle(""); setBody("");
    reload();
  }

  if (!ready || !user || isAdmin !== true || !rows) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8">
        <Link href="/admin" className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-fg">
          <ArrowLeft size={16} /> Admin
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold text-fg">
          <Megaphone size={22} className="text-brand" /> Elanlar
        </h1>
        <p className="mt-1 text-sm text-muted">Aktiv elan bütün istifadəçilərə banner kimi göstərilir.</p>

        {/* Yeni elan */}
        <div className="mt-5 rounded-[10px] border border-line bg-panel p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Başlıq (məs. Yeni dərslər əlavə olundu!)"
            className="w-full rounded-md border border-line bg-panel-2 px-3 py-2 font-semibold text-fg outline-none focus:border-brand"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Mətn…"
            rows={3}
            className="mt-2 w-full rounded-md border border-line bg-panel-2 px-3 py-2 text-fg outline-none focus:border-brand"
          />
          <button
            disabled={busy || !title.trim() || !body.trim()}
            onClick={post}
            className="mt-3 flex items-center gap-2 rounded-[10px] bg-brand px-5 py-2.5 font-semibold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-50"
          >
            <Send size={16} /> Yerləşdir
          </button>
        </div>

        {/* Siyahı */}
        <div className="mt-5 space-y-3">
          {rows.length === 0 && <p className="text-center text-muted">Hələ elan yoxdur.</p>}
          {rows.map((a) => (
            <div key={a.id} className={`rounded-[10px] border p-4 ${a.active ? "border-brand/40 bg-brand/5" : "border-line bg-panel"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-fg">{a.title}</span>
                    {a.active && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">AKTİV</span>}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{a.body}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {new Date(a.created_at).toLocaleString("az-AZ", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    title={a.active ? "Gizlət" : "Göstər"}
                    onClick={async () => { await adminSetAnnouncementActive(a.id, !a.active); reload(); }}
                    className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-fg"
                  >
                    {a.active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    title="Sil"
                    onClick={async () => { if (await confirm({ title: "Elan silinsin?", danger: true, confirmText: "Sil" })) { await adminDeleteAnnouncement(a.id); toast.success("Elan silindi"); reload(); } }}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
