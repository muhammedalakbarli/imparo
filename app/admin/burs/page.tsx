"use client";

// Admin · Burs — sponsorluq havuzu və ehtiyac əsaslı müraciətlərin idarəsi (0057).
//
// Təsdiq mövcud `admin_grant_plus_days` (0043) üzərindən gedir, yəni Plus vermə
// məntiqi burada TƏKRARLANMIR və əməliyyat audit jurnalına düşür.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Check, X, GraduationCap, Gift, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuthUser } from "@/lib/useAuthUser";
import { checkIsAdmin } from "@/lib/adminApi";
import {
  adminScholarshipList, adminDecideScholarship, sponsorPool,
  type AdminScholarshipRow, type SponsorPool,
} from "@/lib/sponsor";
import { PageShell, PageHeader, StatCard, Button, Badge, EmptyState } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { useConfirm } from "@/components/admin/ConfirmDialog";

export default function AdminScholarshipsPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminScholarshipRow[] | null>(null);
  const [pool, setPool] = useState<SponsorPool | null>(null);
  const [days, setDays] = useState(365);
  const confirm = useConfirm();

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);

  const reload = useCallback(() => {
    adminScholarshipList().then(setRows);
    sponsorPool().then(setPool);
  }, []);
  useEffect(() => { if (isAdmin === true) reload(); }, [isAdmin, reload]);

  async function decide(r: AdminScholarshipRow, approve: boolean) {
    const who = r.email ?? r.name;
    if (approve && (pool?.available ?? 0) <= 0) {
      // Havuz boşdursa da təsdiq mümkündür (məs. kampaniya) — amma admin bunu bilməlidir.
      if (!(await confirm({
        title: "Havuzda boş yer yoxdur",
        message: `${who} üçün burs yenə də verilsin? Bu, sponsorluq havuzunu mənfiyə salır.`,
        confirmText: "Yenə də ver",
      }))) return;
    } else if (!approve) {
      if (!(await confirm({
        title: "Müraciət rədd edilsin?",
        message: `${who} yenidən müraciət edə biləcək.`,
        danger: true, confirmText: "Rədd et",
      }))) return;
    }

    const res = await adminDecideScholarship(r.user_id, approve, days);
    if (!res.ok) { toast.error(res.error || "Alınmadı"); return; }
    toast.success(approve ? `Burs verildi (${days} gün)` : "Müraciət rədd edildi");
    reload();
  }

  const pending = (rows ?? []).filter((r) => r.status === "pending");

  const cols: Column<AdminScholarshipRow>[] = [
    {
      key: "email", header: "Şagird", sortable: true,
      value: (r) => r.email ?? r.name,
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-fg">{r.email ?? "—"}</div>
          <div className="truncate text-[11px] text-muted">{r.name}</div>
        </div>
      ),
      className: "max-w-[240px]",
    },
    {
      key: "status", header: "Vəziyyət", sortable: true,
      value: (r) => r.status,
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone={r.status === "pending" ? "amber" : r.status === "approved" ? "green" : "red"}>
            {r.status === "pending" ? "Gözləyir" : r.status === "approved" ? "Təsdiqli" : "Rədd"}
          </Badge>
          {r.endorser_email && <Badge tone="brand">Müəllim zəmanəti</Badge>}
        </div>
      ),
    },
    {
      key: "reason", header: "Səbəb",
      value: (r) => r.reason ?? "—",
      render: (r) => <span className="text-muted">{r.reason || "—"}</span>,
      className: "max-w-[280px] truncate",
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
          {r.status !== "approved" && (
            <Button size="sm" variant="primary" Icon={Check} onClick={() => decide(r, true)}>Burs ver</Button>
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
        Icon={HeartHandshake}
        title="Burs və sponsorluq"
        desc="Sponsorların ödədiyi yerlər və ehtiyac əsaslı müraciətlər. Təsdiq şagirdə pulsuz Plus verir."
        actions={
          <label className="flex items-center gap-2 text-[13px] text-muted">
            Müddət:
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-md border border-line bg-panel px-2 py-1.5 text-fg"
            >
              {[90, 180, 365, 730].map((d) => (
                <option key={d} value={d}>{d} gün</option>
              ))}
            </select>
          </label>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard Icon={Gift} label="Bağışlanan yer" value={pool?.funded ?? 0} />
        <StatCard Icon={GraduationCap} label="İstifadə olunub" value={pool?.used ?? 0} tint="text-emerald-500" />
        <StatCard Icon={Users} label="Boş yer" value={pool?.available ?? 0} tint="text-brand" hint="Havuzda qalan" />
        <StatCard Icon={Check} label="Gözləyən müraciət" value={pending.length} tint="text-amber-500" />
      </div>

      <div className="mt-6">
        {rows !== null && rows.length === 0 ? (
          <EmptyState
            text="Hələ burs müraciəti yoxdur"
            hint="Şagird /destek səhifəsindən müraciət edəndə və ya müəllim sinifdən zəmanət verəndə burada görünəcək."
          />
        ) : (
          <DataTable
            columns={cols} data={rows ?? []} getRowId={(r) => r.user_id}
            loading={!ready || rows === null}
            csvName="burs-muracietleri" searchPlaceholder="Şagird, səbəb…" minWidth={820}
          />
        )}
      </div>
    </PageShell>
  );
}
