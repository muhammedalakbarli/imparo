"use client";

// Moderasiya dialoqları — ban və sərbəst müddətli Plus.
//
// Niyə ayrıca komponent: eyni iki dialoq HƏM moderasiya səhifəsində (/admin/botlar),
// HƏM də istifadəçi detal modalında lazımdır. Müddət seçimi məntiqi (hazır düymələr +
// "fərdi gün" + "həmişəlik") bir yerdə saxlanılır ki, iki yerdə fərqli davranmasın.

import { useEffect, useState } from "react";
import { X, Ban, Crown, Infinity as InfinityIcon } from "lucide-react";
import { toast } from "sonner";
import { adminBanUser, adminGrantPlusDays, isForever } from "@/lib/adminApi";
import { Button } from "@/components/admin/ui";

/* ── Formatlaşdırma ── */

// `infinity` timestamp-i Date() ilə parse olunmur — ayrıca yoxlanılır.
export function fmtUntil(ts: string | null | undefined): string {
  if (!ts) return "—";
  if (isForever(ts)) return "həmişəlik";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "həmişəlik";
  return d.toLocaleString("az-AZ", { dateStyle: "medium", timeStyle: "short" });
}

// Neçə gün qaldı (banın/abunənin qalan müddəti).
export function daysLeft(ts: string | null | undefined): string {
  if (!ts || isForever(ts)) return "";
  const d = new Date(ts).getTime() - Date.now();
  if (Number.isNaN(d) || d <= 0) return "";
  const days = Math.ceil(d / 86_400_000);
  return days === 1 ? "1 gün qalıb" : `${days} gün qalıb`;
}

export interface ModTarget { uid: string; label: string }

/* ── Dialoq çərçivəsi ── */

function Modal({ title, Icon, tone, onClose, children }: {
  title: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: "red" | "amber";
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Esc ilə bağlansın — admin klaviatura ilə sürətli işləyir.
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="admin-theme fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}>
      <div className="admin-surface max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl p-5 sm:rounded-[12px]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              tone === "red" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600"}`}>
              <Icon size={17} />
            </span>
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Bağla"
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-panel-2 hover:text-fg">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Müddət seçici ── */

// `value === null` → həmişəlik. Əks halda gün sayı.
function DurationPicker({ presets, value, onChange }: {
  presets: { label: string; days: number | null }[];
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const custom = value !== null && !presets.some((p) => p.days === value);
  return (
    <>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const on = value === p.days;
          return (
            <button key={p.label} onClick={() => onChange(p.days)}
              className={`rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                on ? "border-brand bg-brand/[0.08] text-brand" : "border-line bg-panel text-muted hover:text-fg"}`}>
              {p.days === null && <InfinityIcon size={12} className="mr-1 inline" />}
              {p.label}
            </button>
          );
        })}
      </div>
      <label className="mt-2.5 flex items-center gap-2 text-[12px] text-muted">
        Fərdi:
        <input type="number" min={1} max={3650}
          value={custom ? String(value) : ""}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) && n > 0 ? n : 1);
          }}
          placeholder="gün"
          className="w-24 rounded-md border border-line bg-panel px-2 py-1.5 text-[13px] text-fg outline-none focus:border-brand/60" />
        gün
      </label>
    </>
  );
}

/* ── Ban dialoqu ── */

export function BanDialog({ target, onClose, onDone }: {
  target: ModTarget; onClose: () => void; onDone: () => void;
}) {
  const [days, setDays] = useState<number | null>(7);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const r = await adminBanUser(target.uid, days, reason);
    setBusy(false);
    if (!r.ok) { toast.error(r.error || "Ban tətbiq olunmadı"); return; }
    toast.success(days === null ? "Hesab həmişəlik banlandı" : `Hesab ${days} gün banlandı`);
    onDone();
    onClose();
  }

  return (
    <Modal title="Hesabı banla" Icon={Ban} tone="red" onClose={onClose}>
      <p className="mt-3 text-[13px] text-muted">
        <span className="font-medium text-fg">{target.label}</span> — banlı hesab dərs bitirə,
        XP və zümrüd qazana bilməyəcək.
      </p>

      <DurationPicker
        presets={[
          { label: "1 gün", days: 1 },
          { label: "7 gün", days: 7 },
          { label: "30 gün", days: 30 },
          { label: "Həmişəlik", days: null },
        ]}
        value={days} onChange={setDays} />

      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
        placeholder="Səbəb (istəyə bağlı) — audit jurnalına yazılır"
        className="mt-3 w-full resize-none rounded-md border border-line bg-panel px-2.5 py-2 text-[13px] text-fg outline-none focus:border-brand/60" />

      <div className="mt-4 flex gap-2">
        <Button variant="danger" Icon={Ban} disabled={busy} onClick={submit} className="flex-1">
          {days === null ? "Həmişəlik banla" : `${days} gün banla`}
        </Button>
        <Button onClick={onClose}>Ləğv et</Button>
      </div>
    </Modal>
  );
}

/* ── Plus dialoqu ── */

export function PlusDialog({ target, hasPlus, onClose, onDone }: {
  target: ModTarget; hasPlus?: boolean; onClose: () => void; onDone: () => void;
}) {
  const [days, setDays] = useState<number | null>(30);
  const [extend, setExtend] = useState(!!hasPlus);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const r = await adminGrantPlusDays(target.uid, days ?? 0, extend);
    setBusy(false);
    if (!r.ok) { toast.error(r.error || "Plus verilmədi"); return; }
    toast.success(days === null ? "Həmişəlik Plus verildi" : `Plus ${fmtUntil(r.until)} tarixinə qədər`);
    onDone();
    onClose();
  }

  return (
    <Modal title="Plus ver" Icon={Crown} tone="amber" onClose={onClose}>
      <p className="mt-3 text-[13px] text-muted">
        <span className="font-medium text-fg">{target.label}</span> — limitsiz can və 2× zümrüd.
      </p>

      <DurationPicker
        presets={[
          { label: "7 gün", days: 7 },
          { label: "30 gün", days: 30 },
          { label: "90 gün", days: 90 },
          { label: "1 il", days: 365 },
          { label: "Həmişəlik", days: null },
        ]}
        value={days} onChange={setDays} />

      <label className="mt-3 flex items-center gap-2 text-[12px] text-muted">
        <input type="checkbox" checked={extend} onChange={(e) => setExtend(e.target.checked)} />
        Mövcud abunənin üstünə əlavə et (uzat)
      </label>

      <div className="mt-4 flex gap-2">
        <Button variant="primary" Icon={Crown} disabled={busy} onClick={submit} className="flex-1">
          {days === null ? "Həmişəlik ver" : `${days} gün ver`}
        </Button>
        <Button onClick={onClose}>Ləğv et</Button>
      </div>
    </Modal>
  );
}
