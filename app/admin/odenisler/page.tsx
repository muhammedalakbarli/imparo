"use client";

// Admin · Ödənişlər — əl ilə (kart/m10) ödəniş müraciətlərinin təsdiqi (0059).
//
// VACİB: kod ödənişin gəlib-gəlmədiyini BİLƏ BİLMİR. Admin məbləği və qəbz
// nömrəsini bank tətbiqində yoxlayır, sonra təsdiqləyir. Təsdiq mövcud
// `admin_grant_plus_days` üzərindən Plus verir və audit jurnalına düşür.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Check, X, Clock, Crown, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { useAuthUser } from "@/lib/useAuthUser";
import { checkIsAdmin } from "@/lib/adminApi";
import {
  adminPaymentRequests, adminDecidePaymentRequest, type AdminPaymentRequest,
} from "@/lib/manualPay";
import { PageShell, PageHeader, StatCard, Button, Badge, EmptyState } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { useConfirm } from "@/components/admin/ConfirmDialog";

const PLAN_LABEL: Record<string, string> = {
  monthly: "Aylıq Plus (30 gün)",
  yearly: "İllik Plus (365 gün)",
  sponsor: "Sponsorluq",
};

export default function AdminManualPaymentsPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminPaymentRequest[] | null>(null);
  const confirm = useConfirm();

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);

  const reload = useCallback(() => { adminPaymentRequests().then(setRows); }, []);
  useEffect(() => { if (isAdmin === true) reload(); }, [isAdmin, reload]);

  async function decide(r: AdminPaymentRequest, approve: boolean) {
    const money = `${(r.amount_cents / 100).toFixed(2)} ₼`;
    const ok = await confirm({
      title: approve ? "Ödəniş təsdiqlənsin?" : "Müraciət rədd edilsin?",
      message: approve
        ? `${r.email ?? r.name} — ${money} (${PLAN_LABEL[r.plan] ?? r.plan}). Bank tətbiqində bu köçürməni gördüyünə əmin ol: təsdiq dərhal Plus verir.`
        : `${r.email ?? r.name} — ${money}. İstifadəçi yenidən müraciət edə biləcək.`,
      danger: !approve,
      confirmText: approve ? "Təsdiqlə" : "Rədd et",
    });
    if (!ok) return;

    const res = await adminDecidePaymentRequest(r.id, approve);
    if (!res.ok) { toast.error(res.error || "Alınmadı"); return; }
    toast.success(approve ? "Təsdiqləndi — Plus verildi" : "Rədd edildi");
    reload();
  }

  const pending = (rows ?? []).filter((r) => r.status === "pending");
  const approved = (rows ?? []).filter((r) => r.status === "approved");
  const totalApproved = approved.reduce((a, r) => a + r.amount_cents, 0);

  const cols: Column<AdminPaymentRequest>[] = [
    {
      key: "email", header: "İstifadəçi", sortable: true,
      value: (r) => r.email ?? r.name,
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-fg">{r.email ?? "—"}</div>
          <div className="truncate text-[11px] text-muted">{r.name}</div>
        </div>
      ),
      className: "max-w-[220px]",
    },
    {
      key: "plan", header: "Nə üçün", sortable: true,
      value: (r) => PLAN_LABEL[r.plan] ?? r.plan,
      render: (r) => (
        <Badge tone={r.kind === "sponsor" ? "green" : "amber"}>
          {r.kind === "sponsor" ? <HeartHandshake size={11} /> : <Crown size={11} />}
          {PLAN_LABEL[r.plan] ?? r.plan}
        </Badge>
      ),
    },
    {
      key: "amount", header: "Məbləğ", sortable: true, align: "right",
      value: (r) => r.amount_cents,
      render: (r) => <span className="tabular font-semibold text-fg">{(r.amount_cents / 100).toFixed(2)} ₼</span>,
    },
    {
      key: "reference", header: "Qəbz / üsul",
      value: (r) => `${r.reference ?? ""} ${r.method}`,
      render: (r) => (
        <span className="text-muted">
          {r.reference || "—"} <span className="text-[11px]">· {r.method}</span>
        </span>
      ),
      className: "max-w-[200px] truncate",
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
      key: "created_at", header: "Tarix", sortable: true, hideable: true,
      value: (r) => r.created_at,
      render: (r) => new Date(r.created_at).toLocaleString("az-AZ", { dateStyle: "short", timeStyle: "short" }),
      className: "whitespace-nowrap text-muted",
    },
    {
      key: "act", header: "", align: "right",
      render: (r) => (
        r.status !== "pending" ? <span className="text-[11px] text-muted">—</span> : (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="primary" Icon={Check} onClick={() => decide(r, true)}>Təsdiqlə</Button>
            <Button size="sm" variant="danger" Icon={X} onClick={() => decide(r, false)} />
          </div>
        )
      ),
    },
  ];

  if (isAdmin !== true) return null;

  return (
    <PageShell>
      <PageHeader
        Icon={Banknote}
        title="Əl ilə ödənişlər"
        desc="Kart köçürməsi və m10 ilə gələn ödənişlər. Məbləği bank tətbiqində yoxla, sonra təsdiqlə — təsdiq dərhal Plus verir."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard Icon={Clock} label="Gözləyən" value={pending.length} tint="text-amber-500" hint="Yoxlama tələb edir" />
        <StatCard Icon={Check} label="Təsdiqlənmiş" value={approved.length} tint="text-emerald-500" />
        <StatCard Icon={Banknote} label="Toplanan" value={`${(totalApproved / 100).toFixed(2)} ₼`} tint="text-brand" />
      </div>

      <div className="mt-6">
        {rows !== null && rows.length === 0 ? (
          <EmptyState
            text="Hələ ödəniş müraciəti yoxdur"
            hint="İstifadəçi /plus və ya /destek səhifəsində «Kartla ödə» seçib köçürməni bildirəndə burada görünəcək."
          />
        ) : (
          <DataTable
            columns={cols} data={rows ?? []} getRowId={(r) => r.id}
            loading={!ready || rows === null}
            csvName="el-ile-odenisler" searchPlaceholder="İstifadəçi, qəbz…" minWidth={880}
          />
        )}
      </div>
    </PageShell>
  );
}
