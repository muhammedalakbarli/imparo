"use client";

// Admin · Adminlər — admin siyahısı, rolları və e-poçt üzrə dəvətlər (0060).
//
// Dəvət niyə lazımdır: `admins` cədvəli mövcud hesaba bağlıdır, yəni komanda
// yoldaşını əlavə etmək üçün onun ARTIQ qeydiyyatdan keçmiş olması tələb olunurdu.
// İndi e-poçtu əvvəlcədən yazmaq olar — həmin şəxs qeydiyyatdan keçib e-poçtunu
// təsdiqləyəndə ilk girişdə avtomatik admin olur.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Star, Mail, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  checkIsAdmin, checkIsSuperAdmin, adminListAdmins, adminListInvites,
  adminInviteAdmin, adminRevokeInvite, adminRemoveAdmin,
  type AdminRow, type AdminInvite,
} from "@/lib/adminApi";
import { PageShell, PageHeader, Card, Button, Badge, EmptyState } from "@/components/admin/ui";
import { useConfirm } from "@/components/admin/ConfirmDialog";

export default function AdminAdminsPage() {
  const router = useRouter();
  const { user } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSuper, setIsSuper] = useState(false);
  const [rows, setRows] = useState<AdminRow[] | null>(null);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "super">("admin");
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (user) { checkIsAdmin().then(setIsAdmin); checkIsSuperAdmin().then(setIsSuper); }
  }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);

  const reload = useCallback(() => {
    adminListAdmins().then(setRows);
    adminListInvites().then(setInvites);
  }, []);
  useEffect(() => { if (isAdmin === true) reload(); }, [isAdmin, reload]);

  async function invite() {
    const e = email.trim();
    if (!e || busy) return;
    setBusy(true);
    const res = await adminInviteAdmin(e, role);
    setBusy(false);
    if (!res.ok) { toast.error(res.error || "Alınmadı"); return; }
    toast.success(
      res.result === "added"
        ? "Hesab tapıldı — dərhal admin edildi"
        : "Dəvət yazıldı — qeydiyyatdan keçəndə avtomatik admin olacaq",
    );
    setEmail("");
    reload();
  }

  async function revoke(inv: AdminInvite) {
    if (!(await confirm({
      title: "Dəvət ləğv edilsin?",
      message: `${inv.email} artıq avtomatik admin olmayacaq.`,
      danger: true, confirmText: "Ləğv et",
    }))) return;
    const res = await adminRevokeInvite(inv.email);
    if (!res.ok) { toast.error(res.error || "Alınmadı"); return; }
    toast.success("Dəvət ləğv edildi");
    reload();
  }

  async function remove(r: AdminRow) {
    if (!(await confirm({
      title: "Admin səlahiyyəti geri alınsın?",
      message: `${r.email} bundan sonra admin panelinə girə bilməyəcək.`,
      danger: true, confirmText: "Geri al",
    }))) return;
    const res = await adminRemoveAdmin(r.user_id);
    if (!res.ok) { toast.error(res.error || "Alınmadı"); return; }
    toast.success("Səlahiyyət geri alındı");
    reload();
  }

  if (isAdmin !== true || !rows) return null;

  return (
    <PageShell>
      <PageHeader
        Icon={ShieldCheck}
        title="Adminlər"
        desc="Admin hesabları və səlahiyyət səviyyələri. Super-admin hesab silə və rolları idarə edə bilər; moderator qalan əməliyyatları görür."
      />

      {/* Dəvət formu */}
      <Card title="Admin əlavə et" desc="Hesabı varsa dərhal admin olur; yoxdursa e-poçt dəvəti yazılır və qeydiyyatdan keçəndə avtomatik tətbiq olunur.">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") invite(); }}
            placeholder="ad@gmail.com"
            className="min-w-[240px] flex-1 rounded-md border border-line bg-panel px-3 py-2 text-[13px] text-fg outline-none focus:border-brand/60"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "super")}
            disabled={!isSuper}
            className="rounded-md border border-line bg-panel px-2.5 py-2 text-[13px] text-fg disabled:opacity-60"
          >
            <option value="admin">Moderator</option>
            <option value="super">Super-admin</option>
          </select>
          <Button variant="primary" Icon={UserPlus} onClick={invite} disabled={busy || !email.trim()}>
            {busy ? "…" : "Əlavə et"}
          </Button>
        </div>
        {!isSuper && (
          <p className="mt-2 text-[12px] text-muted">Super-admin rolunu yalnız super-admin verə bilər.</p>
        )}
      </Card>

      {/* Gözləyən dəvətlər */}
      {invites.length > 0 && (
        <div className="mt-4">
          <Card title={`Gözləyən dəvətlər (${invites.length})`} padded={false}>
            <div className="divide-y divide-line">
              {invites.map((i) => (
                <div key={i.email} className="flex items-center gap-3 px-4 py-3">
                  <Mail size={15} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg">{i.email}</span>
                  <Badge tone={i.role === "super" ? "amber" : "muted"}>
                    {i.role === "super" ? "Super-admin" : "Moderator"}
                  </Badge>
                  <span className="hidden text-[11px] text-muted sm:inline">
                    {new Date(i.created_at).toLocaleDateString("az-AZ", { dateStyle: "medium" })}
                  </span>
                  <Button size="sm" variant="danger" Icon={Trash2} onClick={() => revoke(i)} />
                </div>
              ))}
            </div>
          </Card>
          <p className="mt-2 text-[12px] text-muted">
            Dəvət yalnız e-poçtu təsdiqlənmiş hesaba tətbiq olunur — həmin şəxs imparo.app-da
            qeydiyyatdan keçib e-poçtunu təsdiqləməlidir.
          </p>
        </div>
      )}

      {/* Mövcud adminlər */}
      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState text="Admin yoxdur" />
        ) : (
          <Card title={`Adminlər (${rows.length})`} padded={false}>
            <div className="divide-y divide-line">
              {rows.map((r) => (
                <div key={r.user_id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-semibold uppercase text-brand">
                    {(r.email || "A").slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-fg">{r.name}</span>
                    <span className="block truncate text-[11px] text-muted">{r.email}</span>
                  </span>
                  <Badge tone={r.role === "super" ? "amber" : "muted"}>
                    {r.role === "super" ? <><Star size={11} /> Super-admin</> : "Moderator"}
                  </Badge>
                  {isSuper && r.user_id !== user?.id && (
                    <Button size="sm" variant="danger" Icon={Trash2} onClick={() => remove(r)} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
