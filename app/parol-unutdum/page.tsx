"use client";

// Parol unutdum — email ünvanı al, Supabase bərpa linki göndər.

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { sendPasswordReset } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || loading) return;
    setLoading(true);
    setError("");
    const res = await sendPasswordReset(email.trim());
    setLoading(false);
    if (!res.ok) {
      setError(res.error || t("auth.err.invalid"));
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2" aria-label={t("auth.homeAria")}>
          <Logo size={40} />
          <span className="text-xl font-extrabold text-slate-900">Imparo</span>
        </Link>

        {sent ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              <MailCheck size={28} />
            </span>
            <h1 className="mt-4 text-xl font-extrabold text-slate-900">{t("auth.forgot.sent.title")}</h1>
            <p className="mt-2 text-sm text-slate-500">{t("auth.forgot.sent.body")}</p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-bold text-brand hover:underline"
            >
              {t("auth.forgot.backToLogin")}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-slate-900">{t("auth.forgot.title")}</h1>
            <p className="mt-1 text-sm text-slate-500">{t("auth.forgot.subtitle")}</p>

            <div className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800">{t("auth.email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="example@email.com"
                  disabled={loading}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{error}</p>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={!email.trim() || loading}
                className="w-full rounded-2xl bg-brand px-4 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? t("auth.forgot.sending") : t("auth.forgot.submit")}
              </button>
            </div>

            <p className="mt-8 text-center text-sm">
              <Link href="/login" className="font-bold text-brand hover:underline">
                {t("auth.forgot.backToLogin")}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
