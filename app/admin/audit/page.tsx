"use client";

// Admin · Audit log — kim hansı admin əməliyyatını nə vaxt etdi (hesabatlılıq). DataTable.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { checkIsAdmin, adminAuditList, type AdminAuditRow } from "@/lib/adminApi";
import { PageHeader } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/DataTable";

const LABEL: Record<string, string> = {
  grant_plus: "Plus verdi", revoke_plus: "Plus aldı", set_bot: "Bot işarələdi",
  unset_bot: "Bot işarəsini götürdü", delete_user: "Hesab sildi",
};
const TONE: Record<string, string> = {
  delete_user: "font-bold text-red-500", grant_plus: "font-bold text-amber-500",
};

export default function AdminAuditPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminAuditRow[] | null>(null);

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);
  useEffect(() => { if (isAdmin === true) adminAuditList(500).then(setRows); }, [isAdmin]);

  const cols: Column<AdminAuditRow>[] = [
    {
      key: "created_at", header: "Tarix", sortable: true,
      value: (r) => r.created_at,
      render: (r) => new Date(r.created_at).toLocaleString("az-AZ", { dateStyle: "short", timeStyle: "short" }),
      className: "whitespace-nowrap text-muted",
    },
    { key: "admin", header: "Admin", value: (r) => r.admin_email ?? "—", className: "max-w-[180px] truncate text-fg" },
    {
      key: "action", header: "Əməliyyat", sortable: true,
      value: (r) => LABEL[r.action] ?? r.action,
      render: (r) => <span className={TONE[r.action] ?? "text-fg"}>{LABEL[r.action] ?? r.action}</span>,
    },
    { key: "detail", header: "Hədəf / detal", value: (r) => r.detail ?? r.target_id ?? "—", className: "max-w-[240px] truncate text-muted" },
  ];

  if (isAdmin !== true) return null;

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8">
      <PageHeader Icon={ShieldAlert} title="Audit log" desc="Bütün həssas admin əməliyyatları (Plus, bot, hesab silmə)." />
      <div className="mt-4">
        <DataTable columns={cols} data={rows ?? []} getRowId={(r) => String(r.id)}
          loading={!ready || !rows} csvName="audit-log" emptyText="Hələ qeyd yoxdur." minWidth={640}
          searchPlaceholder="Admin, əməliyyat, detal…" />
      </div>
    </main>
  );
}
