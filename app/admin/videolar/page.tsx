"use client";

// Admin · Videolar — müəllimlərin ÜMUMİ KİTABXANAYA göndərdiyi videoların moderasiyası.
//
// Sinif videoları buraya DÜŞMÜR: onlar qapalı auditoriyadadır (yalnız həmin sinfin
// şagirdləri görür) və müəllim onsuz da admin tərəfindən təsdiqlənib. Burada yalnız
// bütün platformaya açılacaq məzmun yoxlanılır.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Check, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuthUser } from "@/lib/useAuthUser";
import { checkIsAdmin } from "@/lib/adminApi";
import { adminVideoQueue, adminDecideVideo, type AdminVideoRow } from "@/lib/videos";
import { PageShell, PageHeader, StatCard, Button, Badge, EmptyState, Card } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { gradeLabel } from "@/lib/grade";

export default function AdminVideosPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminVideoRow[] | null>(null);
  const [preview, setPreview] = useState<AdminVideoRow | null>(null);
  const confirm = useConfirm();

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);

  const reload = useCallback(() => { adminVideoQueue().then(setRows); }, []);
  useEffect(() => { if (isAdmin === true) reload(); }, [isAdmin, reload]);

  async function decide(r: AdminVideoRow, approve: boolean) {
    if (!approve && !(await confirm({
      title: "Video rədd edilsin?",
      message: `“${r.title}” kitabxanada görünməyəcək. Müəllim yenidən göndərə bilər.`,
      danger: true, confirmText: "Rədd et",
    }))) return;

    const res = await adminDecideVideo(r.id, approve);
    if (!res.ok) { toast.error(res.error || "Alınmadı"); return; }
    toast.success(approve ? "Video təsdiqləndi" : "Video rədd edildi");
    if (preview?.id === r.id) setPreview(null);
    reload();
  }

  const pending = (rows ?? []).filter((r) => r.status === "pending");
  const approved = (rows ?? []).filter((r) => r.status === "approved");

  const cols: Column<AdminVideoRow>[] = [
    {
      key: "title", header: "Video", sortable: true,
      value: (r) => r.title,
      render: (r) => (
        <div className="min-w-0">
          <button onClick={() => setPreview(r)} className="truncate font-medium text-fg hover:text-brand">
            {r.title}
          </button>
          <div className="truncate text-[11px] text-muted">
            {r.teacher_name}{r.teacher_email ? ` · ${r.teacher_email}` : ""}
          </div>
        </div>
      ),
      className: "max-w-[280px]",
    },
    {
      key: "status", header: "Vəziyyət", sortable: true,
      value: (r) => r.status,
      render: (r) => (
        <Badge tone={r.status === "pending" ? "amber" : r.status === "approved" ? "green" : "red"}>
          {r.status === "pending" ? "Gözləyir" : r.status === "approved" ? "Təsdiqli" : "Rədd"}
        </Badge>
      ),
    },
    {
      key: "context", header: "Sinif / fənn", hideable: true,
      value: (r) => `${r.grade ?? ""} ${r.subject_slug ?? ""}`.trim(),
      render: (r) => (
        <span className="text-muted">
          {r.grade ? gradeLabel(Number(r.grade)) : "—"}{r.subject_slug ? ` · ${r.subject_slug}` : ""}
        </span>
      ),
    },
    {
      key: "provider", header: "Mənbə", hideable: true,
      value: (r) => r.provider,
      render: (r) => <span className="text-muted">{r.provider === "upload" ? "Yüklənib" : r.provider === "youtube" ? "YouTube" : "Link"}</span>,
    },
    {
      key: "created_at", header: "Tarix", sortable: true, hideable: true,
      value: (r) => r.created_at,
      render: (r) => new Date(r.created_at).toLocaleDateString("az-AZ", { dateStyle: "medium" }),
      className: "whitespace-nowrap text-muted",
    },
    {
      key: "act", header: "", align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" Icon={ExternalLink} href={r.src} />
          {r.status !== "approved" && (
            <Button size="sm" variant="primary" Icon={Check} onClick={() => decide(r, true)}>Təsdiqlə</Button>
          )}
          {r.status !== "rejected" && (
            <Button size="sm" variant="danger" Icon={X} onClick={() => decide(r, false)} />
          )}
        </div>
      ),
    },
  ];

  if (isAdmin !== true) return null;

  return (
    <PageShell>
      <PageHeader
        Icon={Video}
        title="Video moderasiyası"
        desc="Müəllimlərin ümumi kitabxanaya göndərdiyi videolar. Sinif daxilindəki videolar buraya düşmür — onlar qapalı auditoriyadadır."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard Icon={Video} label="Gözləyir" value={pending.length} tint="text-amber-500" hint="Baxış tələb olunur" />
        <StatCard Icon={Check} label="Təsdiqli" value={approved.length} tint="text-emerald-500" />
        <StatCard Icon={X} label="Ümumi" value={rows?.length ?? 0} />
      </div>

      {preview && (
        <div className="mt-6">
          <Card title={preview.title} desc={preview.description ?? undefined}
            actions={<Button size="sm" Icon={X} onClick={() => setPreview(null)} />}>
            {preview.provider === "youtube" ? (
              <p className="text-[13px] text-muted">
                YouTube videosu — <a href={preview.src} className="font-medium text-brand hover:underline">linki aç</a> və məzmunu yoxla.
              </p>
            ) : (
              <video src={preview.src} controls preload="metadata" className="w-full rounded-lg bg-black" />
            )}
            <div className="mt-3 flex gap-2">
              <Button variant="primary" Icon={Check} onClick={() => decide(preview, true)}>Təsdiqlə</Button>
              <Button variant="danger" Icon={X} onClick={() => decide(preview, false)}>Rədd et</Button>
            </div>
          </Card>
        </div>
      )}

      <div className="mt-6">
        {rows !== null && rows.length === 0 ? (
          <EmptyState
            text="Kitabxanaya göndərilmiş video yoxdur"
            hint="Müəllim sinif səhifəsində videonu «Ümumi kitabxanaya göndər» seçimi ilə əlavə edəndə burada görünəcək."
          />
        ) : (
          <DataTable
            columns={cols} data={rows ?? []} getRowId={(r) => r.id}
            loading={!ready || rows === null}
            csvName="videolar" searchPlaceholder="Başlıq, müəllim…" minWidth={820}
          />
        )}
      </div>
    </PageShell>
  );
}
