"use client";

// Admin · Təhlükəsizlik — sui-istifadə siqnalları: gündəlik mükafat tavanına dəfələrlə dəyən
// hesablar (skript-oxşar davranış) + son hadisələr (signup cəhdləri, tavan çarpmaları).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, TriangleAlert } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  checkIsAdmin,
  adminSecurityEvents,
  adminFlaggedUsers,
  type AdminSecurityEvent,
  type AdminFlaggedUser,
} from "@/lib/adminApi";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/DataTable";

const KIND_LABEL: Record<string, string> = {
  signup_attempt: "Qeydiyyat cəhdi",
  login_attempt: "Giriş cəhdi",
  reward_cap_hit: "Mükafat tavanına dəydi",
  self_delete_account: "Hesabını özü sildi",
};

export default function AdminSecurityPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [events, setEvents] = useState<AdminSecurityEvent[] | null>(null);
  const [flagged, setFlagged] = useState<AdminFlaggedUser[] | null>(null);

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);
  useEffect(() => {
    if (isAdmin === true) {
      adminSecurityEvents(300).then(setEvents);
      adminFlaggedUsers().then(setFlagged);
    }
  }, [isAdmin]);

  const cols: Column<AdminSecurityEvent>[] = [
    {
      key: "created_at", header: "Tarix", sortable: true,
      value: (r) => r.created_at,
      render: (r) => new Date(r.created_at).toLocaleString("az-AZ", { dateStyle: "short", timeStyle: "short" }),
      className: "whitespace-nowrap text-muted",
    },
    {
      key: "kind", header: "Növ", sortable: true,
      value: (r) => KIND_LABEL[r.kind] ?? r.kind,
      render: (r) => (
        <span className={r.kind === "reward_cap_hit" ? "font-bold text-amber-500" : "text-fg"}>
          {KIND_LABEL[r.kind] ?? r.kind}
        </span>
      ),
    },
    { key: "email", header: "İstifadəçi", value: (r) => r.email ?? "—", className: "max-w-[200px] truncate text-fg" },
    { key: "ip", header: "IP", value: (r) => r.ip ?? "—", className: "text-muted" },
    {
      key: "detail", header: "Detal",
      value: (r) => JSON.stringify(r.detail ?? {}),
      render: (r) => <span className="text-xs text-muted">{r.detail ? JSON.stringify(r.detail) : "—"}</span>,
      className: "max-w-[280px] truncate",
    },
  ];

  const flagCols: Column<AdminFlaggedUser>[] = [
    { key: "email", header: "İstifadəçi", value: (r) => r.email ?? "—", className: "text-fg font-semibold" },
    { key: "name", header: "Ad", value: (r) => r.name ?? "—", className: "text-muted" },
    {
      key: "cap_hits", header: "Tavan çarpması (7 gün)", sortable: true,
      value: (r) => r.cap_hits,
      render: (r) => <span className="font-bold text-red-500">{r.cap_hits}×</span>,
    },
    {
      key: "last_hit", header: "Son dəfə", sortable: true,
      value: (r) => r.last_hit,
      render: (r) => new Date(r.last_hit).toLocaleString("az-AZ", { dateStyle: "short", timeStyle: "short" }),
      className: "text-muted",
    },
  ];

  if (isAdmin !== true) return null;

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8">
      <PageHeader
        Icon={ShieldAlert}
        title="Təhlükəsizlik"
        desc="Sui-istifadə siqnalları — gündəlik mükafat tavanına dəfələrlə dəyən hesablar skript-oxşar davranışı göstərir."
      />

      <div className="mt-4">
        <Card title="⚠️ İşarələnmiş hesablar (son 7 gündə 3+ tavan çarpması)">
          {flagged === null ? (
            <p className="text-sm text-muted">Yüklənir…</p>
          ) : flagged.length === 0 ? (
            <EmptyState
              text="Heç bir hesab işarələnməyib"
              hint="Hazırda sui-istifadə əlaməti aşkarlanmayıb. Şübhəli fəaliyyət olarsa hesablar burada görünəcək."
            />
          ) : (
            <DataTable columns={flagCols} data={flagged} getRowId={(r) => r.user_id}
              loading={false} csvName="isarelenmis-hesablar" emptyText="—" minWidth={520} />
          )}
        </Card>
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm text-muted">
        <TriangleAlert size={16} />
        <span>Tavan çarpması avtomatik bloklanır (istifadəçi zərər görmür) — bu siyahı yalnız izləmə üçündür.</span>
      </div>

      <div className="mt-3">
        <DataTable columns={cols} data={events ?? []} getRowId={(r) => String(r.id)}
          loading={!ready || !events} csvName="tehlukesizlik-hadiseleri" emptyText="Hələ qeyd yoxdur." minWidth={720}
          searchPlaceholder="İstifadəçi, IP, növ…" />
      </div>
    </main>
  );
}
