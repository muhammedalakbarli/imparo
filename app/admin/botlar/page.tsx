"use client";

// Admin · Moderasiya — botlar və banlı hesablar bir konsolda.
//
// Niyə ayrıca səhifə: bot işarəsi qoyulan hesab "İstifadəçilər" cədvəlindən GİZLƏNİR
// (bax 0027) — yəni işarəni geri götürmək üçün heç bir yol qalmırdı. Bu səhifə həmin
// gizli hesabları görünən edir və moderasiya əməliyyatlarını (bot⇄istifadəçi, ban,
// ban qaldırma, Plus, silmə) bir yerə toplayır.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Ban, ShieldOff, Crown, Trash2, UserCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  checkIsAdmin, adminModerationList, adminSetBot, adminUnbanUser, adminDeleteUser,
  isForever, type AdminModerationRow,
} from "@/lib/adminApi";
import { PageShell, PageHeader, StatCard, Button, Badge, EmptyState } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { BanDialog, PlusDialog, fmtUntil, daysLeft, type ModTarget } from "@/components/admin/moderation";

type Tab = "bots" | "bans";

export default function AdminModerationPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminModerationRow[] | null>(null);
  const [tab, setTab] = useState<Tab>("bots");
  const [banTarget, setBanTarget] = useState<ModTarget | null>(null);
  const [plusTarget, setPlusTarget] = useState<(ModTarget & { hasPlus: boolean }) | null>(null);
  const confirm = useConfirm();

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);

  const reload = useCallback(() => { adminModerationList().then(setRows); }, []);
  useEffect(() => { if (isAdmin === true) reload(); }, [isAdmin, reload]);

  const bots = useMemo(() => (rows ?? []).filter((r) => r.is_bot), [rows]);
  const banned = useMemo(
    () => (rows ?? []).filter((r) => r.banned_until && (isForever(r.banned_until) || new Date(r.banned_until) > new Date())),
    [rows],
  );
  const permanent = useMemo(() => banned.filter((r) => isForever(r.banned_until)).length, [banned]);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    const r = await fn();
    if (!r.ok) { toast.error(r.error || "Əməliyyat alınmadı"); return; }
    toast.success(okMsg);
    reload();
  }

  async function unmarkBot(r: AdminModerationRow) {
    if (!(await confirm({
      title: "Bot işarəsi götürülsün?",
      message: `${r.email ?? r.name ?? r.user_id} yenidən adi istifadəçi kimi siyahılarda və analitikada görünəcək.`,
      confirmText: "İstifadəçi et",
    }))) return;
    run(() => adminSetBot(r.user_id, false), "Bot işarəsi götürüldü");
  }

  async function del(r: AdminModerationRow) {
    if (!(await confirm({
      title: "Hesab silinsin?",
      message: `${r.email ?? r.user_id} və bütün irəliləyişi həmişəlik silinir. Geri qaytarıla bilməz.`,
      danger: true, confirmText: "Sil",
    }))) return;
    run(() => adminDeleteUser(r.user_id), "Hesab silindi");
  }

  const target = (r: AdminModerationRow): ModTarget => ({
    uid: r.user_id, label: r.email ?? r.name ?? r.user_id.slice(0, 8),
  });

  const idCol: Column<AdminModerationRow> = {
    key: "email", header: "İstifadəçi", sortable: true,
    value: (r) => r.email ?? r.name ?? r.user_id,
    render: (r) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-fg">{r.email ?? "—"}</div>
        <div className="truncate text-[11px] text-muted">
          {r.name ?? "—"}{r.username ? ` · @${r.username}` : ""}
        </div>
      </div>
    ),
    className: "max-w-[260px]",
  };
  const xpCol: Column<AdminModerationRow> = {
    key: "total_xp", header: "XP", sortable: true, align: "right",
    value: (r) => r.total_xp, className: "tabular text-muted", hideable: true,
  };
  const joinedCol: Column<AdminModerationRow> = {
    key: "created_at", header: "Qoşuldu", sortable: true, hideable: true,
    value: (r) => r.created_at,
    render: (r) => new Date(r.created_at).toLocaleDateString("az-AZ", { dateStyle: "medium" }),
    className: "whitespace-nowrap text-muted",
  };

  const botCols: Column<AdminModerationRow>[] = [
    idCol,
    {
      key: "state", header: "Vəziyyət",
      value: (r) => (r.banned_until ? "banlı" : "bot"),
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          <Badge tone="muted"><Bot size={11} /> Bot</Badge>
          {r.banned_until && isForeverOrActive(r.banned_until) && (
            <Badge tone="red"><Ban size={11} /> Banlı</Badge>
          )}
          {r.is_plus && <Badge tone="amber"><Crown size={11} /> Plus</Badge>}
        </div>
      ),
    },
    xpCol, joinedCol,
    {
      key: "act", header: "", align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" Icon={UserCheck} onClick={() => unmarkBot(r)}>İstifadəçi et</Button>
          <Button size="sm" Icon={Crown} onClick={() => setPlusTarget({ ...target(r), hasPlus: r.is_plus })} />
          <Button size="sm" Icon={Ban} onClick={() => setBanTarget(target(r))} />
          <Button size="sm" variant="danger" Icon={Trash2} onClick={() => del(r)} />
        </div>
      ),
    },
  ];

  const banCols: Column<AdminModerationRow>[] = [
    idCol,
    {
      key: "until", header: "Bitir", sortable: true,
      value: (r) => (isForever(r.banned_until) ? "9999" : r.banned_until ?? ""),
      render: (r) => (
        <div>
          <div className={`font-medium ${isForever(r.banned_until) ? "text-red-600" : "text-fg"}`}>
            {fmtUntil(r.banned_until)}
          </div>
          {daysLeft(r.banned_until) && <div className="text-[11px] text-muted">{daysLeft(r.banned_until)}</div>}
        </div>
      ),
      className: "whitespace-nowrap",
    },
    {
      key: "reason", header: "Səbəb", value: (r) => r.ban_reason ?? "—",
      render: (r) => <span className="text-muted">{r.ban_reason || "—"}</span>,
      className: "max-w-[240px] truncate",
    },
    joinedCol,
    {
      key: "act", header: "", align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" Icon={ShieldOff} onClick={() => run(() => adminUnbanUser(r.user_id), "Ban qaldırıldı")}>
            Banı qaldır
          </Button>
          <Button size="sm" Icon={Ban} onClick={() => setBanTarget(target(r))}>Müddəti dəyiş</Button>
          <Button size="sm" variant="danger" Icon={Trash2} onClick={() => del(r)} />
        </div>
      ),
    },
  ];

  if (isAdmin !== true) return null;

  const data = tab === "bots" ? bots : banned;
  const cols = tab === "bots" ? botCols : banCols;

  return (
    <PageShell>
      <PageHeader
        Icon={ShieldCheck}
        title="Moderasiya"
        desc="Bot işarəli və banlı hesablar. Bot işarəsi hesabı analitikadan və istifadəçi siyahısından gizlədir — buradan geri qaytarmaq olar."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard Icon={Bot} label="Bot hesab" value={bots.length} hint="Analitikadan gizlədilib" />
        <StatCard Icon={Ban} label="Aktiv ban" value={banned.length} tint="text-red-500" />
        <StatCard Icon={ShieldOff} label="Həmişəlik" value={permanent} tint="text-red-500" />
        <StatCard Icon={Crown} label="Plus (bu siyahıda)" value={(rows ?? []).filter((r) => r.is_plus).length} tint="text-amber-500" />
      </div>

      {/* Bölmə seçici */}
      <div className="mt-6 inline-flex rounded-md border border-line bg-panel p-0.5">
        {([["bots", "Botlar", bots.length], ["bans", "Banlar", banned.length]] as const).map(([k, label, n]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
              tab === k ? "bg-brand text-white" : "text-muted hover:text-fg"}`}>
            {label} <span className="tabular opacity-70">{n}</span>
          </button>
        ))}
      </div>

      <div className="mt-3">
        {rows !== null && data.length === 0 ? (
          <EmptyState
            text={tab === "bots" ? "Bot işarəli hesab yoxdur" : "Banlı hesab yoxdur"}
            hint={tab === "bots"
              ? "İstifadəçilər səhifəsindən hesabı bot kimi işarələsən burada görünəcək."
              : "Ban vermək üçün İstifadəçilər səhifəsində hesabı aç və “Banla” düyməsini seç."}
          />
        ) : (
          <DataTable
            columns={cols} data={data} getRowId={(r) => r.user_id}
            loading={!ready || rows === null}
            csvName={tab === "bots" ? "botlar" : "banlar"}
            searchPlaceholder="Email, ad, istifadəçi adı…"
            minWidth={760}
          />
        )}
      </div>

      {banTarget && <BanDialog target={banTarget} onClose={() => setBanTarget(null)} onDone={reload} />}
      {plusTarget && (
        <PlusDialog target={plusTarget} hasPlus={plusTarget.hasPlus}
          onClose={() => setPlusTarget(null)} onDone={reload} />
      )}
    </PageShell>
  );
}

// Ban hələ qüvvədədirmi (həmişəlik və ya gələcək tarix).
function isForeverOrActive(ts: string | null): boolean {
  if (!ts) return false;
  return isForever(ts) || new Date(ts) > new Date();
}
