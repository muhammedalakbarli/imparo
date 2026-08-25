"use client";

// Qeydiyyat səhifəsi — login ilə eyni peşəkar split-ekran (solda brend, sağda forma).
// Validasiya + şifrə gücü + təsdiq + real Supabase qeydiyyatı.

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, XCircle, Check } from "lucide-react";
import Logo from "@/components/Logo";
import GoogleButton from "@/components/GoogleButton";
import Mascot from "@/components/Mascot";
import { signUpWithEmail } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { getGuest, guestMetadata, clearGuest, setGuest } from "@/lib/guest";
import { createClient } from "@/lib/supabase/client";
import { completeLesson } from "@/lib/progress";
import { addWrong } from "@/lib/srs";
import { useT } from "@/lib/i18n";

// useSearchParams() statik prerender-i pozur — Next sənədlərinə görə Suspense
// sərhədi tələb olunur. Səhifə qabığı serverdə hazırlanır, parametrdən asılı hissə
// isə brauzerdə açılır.
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}

function SignupInner() {
  const router = useRouter();
  const t = useT();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  // Onboarding-dən gələn şagirddən əvvəlcə yaş soruşulur (Duolingo axını) — yaş
  // uşaq məxfiliyi qaydaları üçün lazımdır, bax məxfilik siyasəti bölmə 3.
  const fromOnboarding = useSearchParams().get("from") === "onboarding";
  const [age, setAge] = useState("");
  const [askedAge, setAskedAge] = useState(false);
  const needAge = fromOnboarding && !askedAge;

  // Şifrə gücü yoxlaması
  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
    if (pass.match(/[0-9]/)) strength++;
    if (pass.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const doPasswordsMatch = password === confirmPassword && password.length > 0;
  const PERKS = [t("auth.signup.perk1"), t("auth.signup.perk2"), t("auth.signup.perk3")];

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password) {
      setError(t("auth.err.allFields"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.err.passMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.err.passShort"));
      return;
    }
    if (!guardianConsent) {
      setError(t("auth.err.guardianConsent"));
      return;
    }

    setLoading(true);
    setError("");

    // Real Supabase qeydiyyatı (ad + email + parol + valideyn nəzarəti təsdiqi)
    const res = await signUpWithEmail(fullName.trim(), email.trim(), password, guardianConsent, parentEmail);
    setLoading(false);

    if (!res.ok) {
      // Uğursuz qeydiyyat indiyə qədər ümumiyyətlə ölçülmürdü: "email artıq var",
      // "parol zəifdir" kimi maneələr funnel-də görünmürdü. Səbəb mətnini deyil,
      // yalnız qısa açarını göndəririk (şəxsi məlumat sızmasın).
      track("signup_failed", { reason: (res.error || "unknown").slice(0, 60) });
      setError(res.error || t("auth.err.signupFailed"));
      return;
    }
    track("signup_completed", { method: "email" });
    if (res.needsEmailConfirm) {
      router.push("/login?confirm=1");
      return;
    }
    // Onboarding artıq qeydiyyatdan ƏVVƏL keçilib (Duolingo modeli) — cavabları və
    // sınaq dərsini yeni hesaba köçür, sonra qonaq anbarını təmizlə.
    const g = getGuest();
    if (g.grade !== undefined) {
      await createClient().auth.updateUser({ data: guestMetadata(g) }).catch(() => {});
      // Dərsin mükafatı SERVERDƏ hesablanır (0037) — client məbləğ göndərmir.
      for (const lessonId of g.lessons ?? []) {
        await completeLesson(lessonId).catch(() => {});
      }
      // Diaqnostika: "bilirəm" dərsləri XP-SİZ tamamlanmış işarələnir, səhvlər SRS-ə.
      for (const lessonId of g.knownLessons ?? []) {
        await completeLesson(lessonId, false).catch(() => {});
      }
      for (const taskId of g.wrongTasks ?? []) {
        await addWrong(taskId).catch(() => {});
      }
      clearGuest();
      router.push("/dashboard");
      return;
    }
    // Onboarding keçilməyibsə (birbaşa /signup-a gəlib) — suallara yönləndir.
    router.push("/onboarding");
  }

  if (needAge) {
    const n = Number(age);
    const valid = Number.isFinite(n) && n >= 5 && n <= 18;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-5">
        <Mascot size={120} mood="happy" />
        <h1 className="mt-6 text-2xl font-extrabold text-fg">Neçə yaşın var?</h1>
        <p className="mt-2 max-w-sm text-center text-sm text-muted">
          Yaşını bilmək sənə uyğun məzmunu göstərməyə kömək edir. Bax{" "}
          <Link href="/mexfilik" className="font-bold text-brand underline">
            Məxfilik siyasəti
          </Link>
          .
        </p>
        <input
          type="number"
          inputMode="numeric"
          min={5}
          max={18}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Yaş"
          className="mt-7 w-40 rounded-2xl border-2 border-line bg-panel px-5 py-3.5 text-center text-2xl font-extrabold text-fg outline-none focus:border-brand"
        />
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            setGuest({ age: n });
            setAskedAge(true);
          }}
          className="mt-7 w-full max-w-xs rounded-2xl bg-brand px-5 py-3.5 text-lg font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Davam et
        </button>
      </div>
    );
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
            <Mascot size={230} mood="celebrate" disk={false} />
          </div>
          <h2 className="max-w-sm text-4xl font-extrabold leading-tight">
            {t("auth.signup.brandHeading")}
          </h2>
          <p className="mt-3 max-w-sm text-white/80">{t("auth.signup.brandSub")}</p>
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

          <h1 className="text-2xl font-extrabold text-slate-900">{t("auth.signup.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("auth.signup.subtitle")}</p>

          <div className="mt-8">
            <GoogleButton label={t("auth.signup.google")} />
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">{t("auth.or")}</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Ad və Soyad */}
            <div>
              <label className="block text-sm font-bold text-slate-800">{t("auth.signup.name")}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder={t("auth.signup.namePlaceholder")}
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-800">{t("auth.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="example@email.com"
                disabled={loading}
              />
            </div>

            {/* Şifrə */}
            <div>
              <label className="block text-sm font-bold text-slate-800">{t("auth.signup.password")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder={t("auth.signup.passwordPlaceholder")}
                  disabled={loading}
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

              {/* Şifrə gücü indikatoru */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition ${
                          level <= passwordStrength
                            ? passwordStrength <= 1
                              ? "bg-red-500"
                              : passwordStrength <= 2
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {passwordStrength <= 1 && t("auth.strength.weak")}
                    {passwordStrength === 2 && t("auth.strength.fair")}
                    {passwordStrength === 3 && t("auth.strength.good")}
                    {passwordStrength === 4 && t("auth.strength.strong")}
                  </p>
                </div>
              )}
            </div>

            {/* Şifrə təkrar */}
            <div>
              <label className="block text-sm font-bold text-slate-800">
                {t("auth.signup.confirm")}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder={t("auth.signup.confirmPlaceholder")}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? t("auth.hidePass") : t("auth.showPass")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Şifrə uyğunluğu mesajı */}
              {confirmPassword.length > 0 && (
                <p
                  className={`mt-1 flex items-center gap-1 text-xs ${
                    doPasswordsMatch ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {doPasswordsMatch ? (
                    <>
                      <CheckCircle size={14} /> {t("auth.signup.match")}
                    </>
                  ) : (
                    <>
                      <XCircle size={14} /> {t("auth.err.passMismatch")}
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Valideyn nəzarəti təsdiqi (platforma uşaqlar üçündür) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <label className="flex items-start gap-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={guardianConsent}
                  onChange={(e) => setGuardianConsent(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand focus:ring-brand/30"
                />
                <span>{t("auth.signup.guardianConsent")}</span>
              </label>
              <div className="mt-2.5">
                <label className="block text-xs font-bold text-slate-600">
                  {t("auth.signup.parentEmail")}
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder={t("auth.signup.parentEmailPlaceholder")}
                />
              </div>
            </div>

            {/* Xəta mesajı */}
            {error && (
              <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* Qeydiyyat düyməsi */}
            <button
              type="submit"
              disabled={
                !fullName.trim() ||
                !email.trim() ||
                !password ||
                !confirmPassword ||
                loading ||
                !doPasswordsMatch ||
                !guardianConsent
              }
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
                  {t("auth.signup.loading")}
                </span>
              ) : (
                t("auth.signup.submit")
              )}
            </button>
          </form>

          {/* Login linki */}
          <p className="mt-8 text-center text-sm text-slate-600">
            {t("auth.signup.haveAccount")}{" "}
            <Link href="/login" className="font-bold text-brand hover:underline">
              {t("auth.signup.loginLink")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
