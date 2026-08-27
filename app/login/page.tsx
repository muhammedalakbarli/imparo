"use client";

// Giriş səhifəsi — peşəkar split-ekran: solda brend paneli, sağda forma.
// Real Supabase girişi; artıq daxil olmuş istifadəçi dashboard-a keçir.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Check } from "lucide-react";
import { signInWithEmail, getCurrentUser } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import Logo from "@/components/Logo";
import GoogleButton from "@/components/GoogleButton";
import ZefiMascot from "@/components/ZefiMascot";

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const PERKS = [t("auth.login.perk1"), t("auth.login.perk2"), t("auth.login.perk3")];

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) router.replace("/dashboard");
    });
    // Google OAuth callback xətası olubsa göstər (bax auth/callback route).
    if (new URLSearchParams(window.location.search).get("error") === "oauth") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(t("auth.err.oauth"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function login() {
    if (!email.trim() || !password || loading) return;
    setLoading(true);
    setError("");
    const res = await signInWithEmail(email.trim(), password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || t("auth.err.invalid"));
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-1">
      {/* Sol brend paneli (yalnız böyük ekranda) */}
      <aside className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-brand to-brand-dark p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5" aria-label={t("auth.homeAria")}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
            <Logo size={26} />
          </span>
          <span className="text-xl font-extrabold">Imparo</span>
        </Link>

        <div>
          <div className="mb-6 flex justify-center">
            <ZefiMascot emotion="learning" size={300} disk={false} />
          </div>
          <h2 className="max-w-sm text-4xl font-extrabold leading-tight">
            {t("auth.login.brandHeading")}
          </h2>
          <p className="mt-3 max-w-sm text-white/80">{t("auth.login.brandSub")}</p>
          <ul className="mt-8 space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check size={15} strokeWidth={3} />
                </span>
                <span className="text-white/90">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-white/60">{t("auth.tagline")}</p>
      </aside>

      {/* Sağ forma */}
      <main className="flex w-full items-center justify-center bg-[#f7f8fa] px-5 py-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobil loqo */}
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2 lg:hidden"
            aria-label={t("auth.homeAria")}
          >
            <Logo size={40} />
            <span className="text-xl font-extrabold text-slate-900">Imparo</span>
          </Link>

          <h1 className="text-2xl font-extrabold text-slate-900">{t("auth.login.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("auth.login.subtitle")}</p>

          <div className="mt-8">
            <GoogleButton label={t("auth.login.google")} />
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">{t("auth.or")}</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-800">{t("auth.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
                placeholder="example@email.com"
                disabled={loading}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-800">{t("auth.password")}</label>
                <Link href="/parol-unutdum" className="text-xs font-bold text-brand hover:underline">
                  {t("auth.forgot.link")}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && login()}
                  placeholder={t("auth.login.passwordPlaceholder")}
                  disabled={loading}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t("auth.hidePass") : t("auth.showPass")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={login}
              disabled={!email.trim() || !password || loading}
              className="w-full rounded-2xl bg-brand px-4 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("auth.checking")}
                </span>
              ) : (
                t("auth.login.submit")
              )}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            {t("auth.login.noAccount")}{" "}
            <Link href="/signup" className="font-bold text-brand hover:underline">
              {t("auth.login.signupLink")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
