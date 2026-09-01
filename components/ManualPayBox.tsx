"use client";

// Əl ilə ödəniş qutusu — /plus və /destek səhifələrində eyni komponent (0059).
//
// Axın: rekvizitlər göstərilir → valideyn köçürməni edir → qəbz nömrəsini yazır →
// müraciət admin növbəsinə düşür. Müraciət HEÇ NƏ VERMİR: Plus yalnız admin
// ödənişi bank tərəfdə görüb təsdiqləyəndən sonra aktivləşir. Bu, mətndə də
// açıq yazılır ki, istifadəçi dərhal Plus gözləməsin.

import { useEffect, useState } from "react";
import { Copy, Check, Clock, Banknote, X } from "lucide-react";
import {
  PAY_TARGET, manualPayEnabled, myPaymentRequest, requestManualPayment,
  type MyPaymentRequest, type PayKind, type PayMethod,
} from "@/lib/manualPay";

export default function ManualPayBox({
  kind,
  plan,
  amountCents,
  title = "Kartla və ya m10 ilə ödə",
  onDone,
}: {
  kind: PayKind;
  plan: string;
  amountCents: number;
  title?: string;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<MyPaymentRequest | null>(null);
  const [method, setMethod] = useState<PayMethod>(PAY_TARGET.card ? "card" : "m10");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { myPaymentRequest().then(setMine); }, []);

  if (!manualPayEnabled()) return null;

  const amount = (amountCents / 100).toFixed(2);

  function copy(v: string) {
    navigator.clipboard?.writeText(v).then(() => {
      setCopied(v);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => {});
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await requestManualPayment(kind, plan, amountCents, method, reference.trim());
      setMine(await myPaymentRequest());
      setOpen(false);
      setReference("");
      onDone?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Göndərilmədi, yenidən yoxla.");
    } finally {
      setBusy(false);
    }
  }

  // Açıq müraciət varsa форма əvəzinə vəziyyət göstərilir.
  if (mine?.status === "pending") {
    return (
      <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <Clock size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="text-sm">
          <div className="font-bold text-amber-700 dark:text-amber-400">Ödənişin yoxlanılır</div>
          <div className="text-muted">
            {(mine.amount_cents / 100).toFixed(2)} ₼ üçün müraciətin qeydə alındı
            {mine.reference ? ` (qəbz: ${mine.reference})` : ""}. Ödəniş təsdiqlənən kimi Plus
            avtomatik açılacaq — adətən bir neçə saat çəkir.
          </div>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-line py-3 font-extrabold text-fg transition hover:border-brand"
        >
          <Banknote size={18} /> {title}
        </button>
        {mine?.status === "rejected" && (
          <p className="mt-2 text-center text-xs text-red-500">
            Əvvəlki müraciətin təsdiqlənmədi{mine.decided_note ? `: ${mine.decided_note}` : ""} — yenidən cəhd edə bilərsən.
          </p>
        )}
      </>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-line bg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-extrabold text-fg">{title}</div>
          <div className="text-sm text-muted">Ödəniləcək məbləğ: <span className="font-bold text-fg">{amount} ₼</span></div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Bağla" className="rounded-lg p-1.5 text-muted hover:bg-panel-2">
          <X size={18} />
        </button>
      </div>

      {/* Rekvizitlər */}
      <div className="mt-3 space-y-2">
        {PAY_TARGET.card && (
          <Row label="Kart" value={PAY_TARGET.card} copied={copied} onCopy={copy} />
        )}
        {PAY_TARGET.m10 && (
          <Row label="m10 / nömrə" value={PAY_TARGET.m10} copied={copied} onCopy={copy} />
        )}
        {PAY_TARGET.name && (
          <div className="text-xs text-muted">Alıcı: <span className="font-bold text-fg">{PAY_TARGET.name}</span></div>
        )}
      </div>

      {/* Üsul */}
      <div className="mt-3 flex gap-1.5">
        {([["card", "Kart köçürməsi"], ["m10", "m10"], ["other", "Digər"]] as const)
          .filter(([m]) => (m === "card" ? !!PAY_TARGET.card : m === "m10" ? !!PAY_TARGET.m10 : true))
          .map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`rounded-xl px-3 py-1.5 text-sm font-bold transition-colors ${
                method === m ? "bg-brand text-white" : "border border-line text-muted hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
      </div>

      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Qəbz nömrəsi və ya kartının son 4 rəqəmi"
        className="mt-3 w-full rounded-xl border-2 border-line bg-ink px-4 py-2.5 font-semibold text-fg outline-none focus:border-brand"
      />
      <p className="mt-1.5 text-xs text-muted">
        Köçürməni etdikdən sonra bu formanı göndər. Plus dərhal açılmır — ödəniş yoxlanıldıqdan
        sonra (adətən bir neçə saat) hesabına əlavə olunur.
      </p>

      {err && <p className="mt-2 text-sm font-bold text-red-500">{err}</p>}

      <button
        onClick={submit}
        disabled={busy}
        className="mt-3 w-full rounded-2xl bg-brand py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? "Göndərilir…" : "Ödənişi bildir"}
      </button>
    </div>
  );
}

function Row({
  label, value, copied, onCopy,
}: {
  label: string; value: string; copied: string | null; onCopy: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-panel-2 px-3 py-2">
      <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      <span className="min-w-0 flex-1 truncate font-mono font-bold text-fg">{value}</span>
      <button
        onClick={() => onCopy(value)}
        aria-label="Kopyala"
        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-panel hover:text-fg"
      >
        {copied === value ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
      </button>
    </div>
  );
}
