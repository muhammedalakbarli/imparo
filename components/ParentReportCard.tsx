"use client";

// Ayarlar → "Valideyn hesabatı": şagird valideynin e-poçtunu qeyd edir,
// valideynə təsdiq məktubu gedir, təsdiqdən sonra hər bazar günü hesabat gəlir.
//
// Təsdiq addımı QƏSDƏNDİR: səhv yazılmış ünvana uşağın öyrənmə datası düşməsin.
// Ünvan təsdiqlənməyənə qədər heç bir hesabat göndərilmir.

import { useEffect, useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";

type State =
  | { status: "loading" }
  | { status: "none" }
  | { status: "pending"; email: string }
  | { status: "verified"; email: string };

export default function ParentReportCard() {
  const t = useT();
  const [state, setState] = useState<State>({ status: "loading" });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/parent/email")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { email: string | null; verified: boolean } | null) => {
        if (!d?.email) return setState({ status: "none" });
        setState({ status: d.verified ? "verified" : "pending", email: d.email });
      })
      .catch(() => setState({ status: "none" }));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const email = input.trim();
    if (!email) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/parent/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string; mailed?: boolean };
      if (!res.ok && res.status !== 202) {
        setMsg(data.error ?? t("parent.err"));
      } else {
        setState({ status: "pending", email });
        setInput("");
        // 202 = ünvan yadda qaldı, amma məktub GETMƏDİ. Bunu gizlətmək olmaz:
        // valideyn təsdiq məktubunu gözləyib almasa, sistem sınıq görünür.
        setMsg(data.mailed === false ? t("parent.mailFail") : t("parent.sentTo").replace("{email}", email));
      }
    } catch {
      setMsg(t("parent.err"));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setMsg("");
    try {
      await fetch("/api/parent/email", { method: "DELETE" });
      setState({ status: "none" });
      setMsg(t("parent.removed"));
    } catch {
      setMsg(t("parent.err"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">
        {t("parent.title")}
      </h2>
      <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-panel px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Mail size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-fg">{t("parent.heading")}</div>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{t("parent.hint")}</p>

            {state.status === "loading" && (
              <div className="mt-3 h-9 w-full max-w-xs animate-pulse rounded-xl bg-line" />
            )}

            {state.status !== "loading" && state.status !== "none" && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-panel-2 px-2.5 py-1.5 text-sm font-bold text-fg">
                  {state.status === "verified" && <Check size={14} className="text-brand" />}
                  {state.email}
                </span>
                <span className="text-xs font-bold text-muted">
                  {state.status === "verified" ? t("parent.verified") : t("parent.pending")}
                </span>
                <button
                  onClick={remove}
                  disabled={busy}
                  className="text-xs font-bold text-muted underline hover:text-fg disabled:opacity-50"
                >
                  {t("parent.remove")}
                </button>
              </div>
            )}

            {(state.status === "none" || state.status === "pending" || state.status === "verified") && (
              <form onSubmit={save} className="mt-3 flex flex-wrap gap-2">
                <input
                  type="email"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("parent.placeholder")}
                  className="min-w-0 flex-1 rounded-xl border-2 border-line bg-panel px-3 py-2 text-sm font-bold text-fg outline-none placeholder:font-normal placeholder:text-muted/70 focus:border-brand"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-extrabold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                >
                  {busy && <Loader2 size={14} className="animate-spin" />}
                  {state.status === "none" ? t("parent.add") : t("parent.change")}
                </button>
              </form>
            )}

            {msg && <p className="mt-2 text-xs font-bold text-muted">{msg}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
