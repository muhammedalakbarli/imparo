"use client";

// Parol yenilə — email bərpa linkinin qayıtdığı səhifə.
// Supabase link-i emal edəndə (detectSessionInUrl) müvəqqəti bərpa sessiyası qurulur
// və PASSWORD_RECOVERY hadisəsi baş verir → yeni parol təyin edilə bilər.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import Logo from "@/components/Logo";

type Status = "checking" | "ready" | "done" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const t = useT();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let settled = false;
    const ok = () => {
      if (settled) return;
      settled = true;
      setStatus("ready");
    };

    // Bərpa sessiyası qurulanda hazır ol.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) ok();
    });
    // Artıq qurulmuş sessiyanı da yoxla (hadisə keçmiş ola bilər).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) ok();
    });
    // Müəyyən vaxtda sessiya yoxdursa — link etibarsız.
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setStatus("invalid");
      }
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function submit() {
    if (saving) return;
    if (password.length < 6) {
      setError(t("auth.err.passShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.err.passMismatch"));
      return;
    }
    setSaving(true);
    setError("");
    const res = await updatePassword(password);
    setSaving(false);
    if (!res.ok) {
      setError(res.error || t("auth.reset.invalidLink"));
      return;
    }
    setStatus("done");
    setTimeout(() => router.replace("/login"), 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2" aria-label={t("auth.homeAria")}>
          <Logo size={40} />
          <span className="text-xl font-extrabold text-slate-900">Imparo</span>
        </Link>

        {status === "checking" && (
          <p className="text-center text-sm text-slate-500">{t("auth.reset.waiting")}</p>
        )}

        {status === "invalid" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <h1 className="text-xl font-extrabold text-slate-900">{t("auth.reset.title")}</h1>
            <p className="mt-2 text-sm text-red-600">{t("auth.reset.invalidLink")}</p>
            <Link href="/parol-unutdum" className="mt-6 inline-block text-sm font-bold text-brand hover:underline">
              {t("auth.forgot.title")}
            </Link>
          </div>
        )}

        {status === "done" && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <h1 className="text-xl font-extrabold text-slate-900">{t("auth.reset.title")}</h1>
            <p className="mt-2 text-sm text-green-600">{t("auth.reset.success")}</p>
          </div>
        )}

        {status === "ready" && (
          <>
            <h1 className="text-2xl font-extrabold text-slate-900">{t("auth.reset.title")}</h1>
            <p className="mt-1 text-sm text-slate-500">{t("auth.reset.subtitle")}</p>

            <div className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800">{t("auth.reset.newPassword")}</label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={saving}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? t("auth.hidePass") : t("auth.showPass")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">{t("auth.reset.confirm")}</label>
                <input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  disabled={saving}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{error}</p>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="w-full rounded-2xl bg-brand px-4 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? t("auth.reset.saving") : t("auth.reset.submit")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
