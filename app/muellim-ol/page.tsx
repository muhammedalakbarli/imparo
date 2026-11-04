"use client";

// Müəllim qeydiyyatı — bir səhifədə bütün axın.
//
//   /muellim-ol               → hesab yarat (Google və ya e-poçt) → 3 sahəli müraciət
//                               → admin-ə məktub gedir → təsdiqdə müəllimə məktub
//   /muellim-ol?devet=TOKEN   → dəvət linki: daxil olan kimi təsdiqlənmiş müəllim
//
// Şagird axınından fərqi: valideyn nəzarəti, sinif seçimi, Zefi və 12 addımlı
// onboarding YOXDUR. Mətn "siz" formasındadır — müəllim böyükdür.
// Təsdiq qapısı (uşaqların sinfinə yalnız real müəllim girsin) qalır; dəvət linki
// sadəcə təsdiqi ƏVVƏLCƏDƏN verir. Bax supabase/migrations/0063_teacher_onboarding.sql.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2, Clock, GraduationCap, LogOut, Mail, ShieldCheck, Users, ClipboardList, BarChart3,
  AlertTriangle, Eye, EyeOff,
} from "lucide-react";
import Logo from "@/components/Logo";
import Mascot from "@/components/Mascot";
import GoogleButton from "@/components/GoogleButton";
import TeacherRequestForm from "@/components/teacher/TeacherRequestForm";
import { PageSkeleton } from "@/components/Skeleton";
import { useAuthUser } from "@/lib/useAuthUser";
import { signOut, signUpWithEmail } from "@/lib/auth";
import { myTeacherStatus, type TeacherStatus } from "@/lib/schools";
import { track } from "@/lib/analytics";
import {
  claimTeacherInvite, clearTeacherIntent, isInviteToken, markTeacherAccount, setTeacherIntent,
  teacherInviteInfo, type ClaimResult, type InviteInfo,
} from "@/lib/teacher";

export default function BecomeTeacherPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <BecomeTeacher />
    </Suspense>
  );
}

const INVITE_PROBLEM: Record<string, { title: string; body: string }> = {
  not_found: { title: "Dəvət linki tapılmadı", body: "Link yarımçıq kopyalanmış ola bilər. Göndərən şəxsdən linki yenidən istəyin." },
  revoked: { title: "Bu dəvət ləğv edilib", body: "Dəvəti göndərən şəxs onu geri götürüb. Yeni link istəyin və ya adi müraciət göndərin." },
  expired: { title: "Dəvətin müddəti bitib", body: "Dəvət linkləri məhdud müddət etibarlıdır. Yeni link istəyin və ya adi müraciət göndərin." },
  used_up: { title: "Bu dəvət artıq istifadə olunub", body: "Link başqa hesabla qəbul edilib. Yeni link istəyin və ya adi müraciət göndərin." },
  error: { title: "Dəvət yoxlanılmadı", body: "Bağlantı xətası ola bilər. Səhifəni yeniləyin." },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="force-light min-h-screen bg-ink">
      <header className="border-b border-line/60">
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-lg font-extrabold text-brand">Imparo</span>
          </Link>
          <span className="flex items-center gap-1.5 text-sm font-bold text-muted">
            <GraduationCap size={16} /> Müəllimlər üçün
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-5 py-8 sm:py-12">{children}</main>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-line bg-panel p-6 sm:p-8">{children}</div>;
}

const PERKS = [
  { Icon: Users, text: "Sinif yaradın — şagirdlər 6 simvollu kodla qoşulur" },
  { Icon: ClipboardList, text: "Kurikuluma uyğun dərslərdən tapşırıq verin" },
  { Icon: BarChart3, text: "Kimin etdiyini və sinfin harada ilişdiyini görün" },
];

function BecomeTeacher() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("devet");
  const token = isInviteToken(raw) ? raw : null;
  const badLink = raw !== null && !token;

  const { user, ready } = useAuthUser({ optional: true });
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [claim, setClaim] = useState<ClaimResult | null>(null);
  const [status, setStatus] = useState<TeacherStatus | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    track("teacher_flow_view", { invite: Boolean(token) });
  }, [token]);

  // Dəvət haqda ümumi məlumat (girişsiz də) — hansı hesabla girmək lazım olduğunu göstərmək üçün.
  useEffect(() => {
    if (!token) return;
    teacherInviteInfo(token).then(setInfo);
  }, [token]);

  // Giriş etmiş istifadəçi: dəvəti götür və ya müraciət vəziyyətini yoxla.
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    if (token) {
      claimTeacherInvite(token).then(async (r) => {
        if (!alive) return;
        if (r === "ok" || r === "already") {
          await markTeacherAccount();
          clearTeacherIntent();
          if (r === "ok") track("teacher_invite_claimed");
        }
        setClaim(r);
      });
    } else {
      myTeacherStatus().then(async (st) => {
        if (!alive) return;
        if (st.is_teacher) {
          await markTeacherAccount();
          clearTeacherIntent();
          router.replace("/mekteb/muellim");
          return;
        }
        if (st.request_status === "pending") {
          await markTeacherAccount();
          clearTeacherIntent();
        }
        setStatus(st);
      });
    }
    return () => {
      alive = false;
    };
  }, [userId, token, router]);

  if (!ready) return <PageSkeleton />;

  // ── Girişsiz ────────────────────────────────────────────────────────────────
  if (!user) {
    if (badLink || (token && info && info.status !== "ok")) {
      return <InviteProblem kind={badLink ? "not_found" : info!.status} />;
    }
    if (token && !info) return <PageSkeleton />;
    return <SignIn token={token} info={info} />;
  }

  // ── Dəvət ilə ───────────────────────────────────────────────────────────────
  if (token) {
    if (!claim) return <PageSkeleton />;
    if (claim === "ok" || claim === "already") return <Welcome />;
    if (claim === "email_mismatch" || claim === "need_google") {
      return (
        <WrongAccount
          kind={claim}
          hint={info?.email_hint ?? null}
          current={user.email ?? ""}
          onSwitch={async () => {
            setTeacherIntent(token);
            setClaim(null);
            await signOut();
          }}
        />
      );
    }
    return <InviteProblem kind={claim === "auth_required" ? "error" : claim} />;
  }

  // ── Adi müraciət ────────────────────────────────────────────────────────────
  if (!status || status.is_teacher) return <PageSkeleton />;
  if (status.request_status === "pending") return <Pending email={user.email ?? ""} />;

  return (
    <Shell>
      <Card>
        <h1 className="text-2xl font-extrabold text-fg sm:text-3xl">Son addım: özünüz haqqında</h1>
        <p className="mt-2 leading-relaxed text-muted">
          Uşaqların təhlükəsizliyi üçün hər müəllim hesabını əl ilə təsdiqləyirik — sinfə yalnız real
          müəllim girə bilsin. Təsdiqlənən kimi <b className="text-fg">{user.email}</b> ünvanına məktub
          göndərəcəyik.
        </p>
        {status.request_status === "rejected" && (
          <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
            Əvvəlki müraciətiniz təsdiqlənməyib. Məlumatları dəqiqləşdirib yenidən göndərə bilərsiniz.
          </p>
        )}
        <div className="mt-6">
          <TeacherRequestForm
            onDone={async () => {
              await markTeacherAccount();
              clearTeacherIntent();
              setStatus({ is_teacher: false, request_status: "pending" });
            }}
          />
        </div>
      </Card>
      <NotTeacher onboarded={Boolean(user.user_metadata?.onboarded)} />
    </Shell>
  );
}

// ── Ekranlar ─────────────────────────────────────────────────────────────────

function SignIn({ token, info }: { token: string | null; info: InviteInfo | null }) {
  const router = useRouter();
  const googleOnly = Boolean(info?.needs_google);
  const remember = () => setTeacherIntent(token);

  return (
    <Shell>
      <Card>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <GraduationCap size={28} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-fg sm:text-3xl">
          {token ? "Sizi Imparo-ya müəllim kimi dəvət edirik" : "Müəllim hesabı yaradın"}
        </h1>
        <p className="mt-2 leading-relaxed text-muted">
          {token
            ? "Daxil olan kimi hesabınız müəllim hesabı olacaq — gözləmə və təsdiq lazım deyil."
            : "Pulsuzdur və bir dəqiqə çəkir. Şagird qeydiyyatından fərqli olaraq heç bir şagird sualı yoxdur."}
        </p>

        <ul className="mt-5 space-y-2.5">
          {PERKS.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm font-semibold text-fg">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon size={16} />
              </span>
              {text}
            </li>
          ))}
        </ul>

        {googleOnly && info?.email_hint && (
          <p className="mt-5 flex gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-fg">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <span>
              Bu dəvət <b>{info.email_hint}</b> ünvanı üçündür. Təhlükəsizlik üçün yalnız həmin Google
              hesabı ilə qəbul olunur.
            </span>
          </p>
        )}

        <div className="mt-6">
          <GoogleButton label="Google ilə davam edin" onBeforeRedirect={remember} />
        </div>

        {!googleOnly && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase text-muted">
              <span className="h-px flex-1 bg-line" /> və ya e-poçtla <span className="h-px flex-1 bg-line" />
            </div>
            <EmailSignup token={token} />
          </>
        )}

        <p className="mt-5 text-center text-sm text-muted">
          Hesabınız var?{" "}
          <button
            type="button"
            onClick={() => {
              remember();
              router.push("/login");
            }}
            className="font-bold text-brand hover:underline"
          >
            Daxil olun
          </button>
        </p>
      </Card>
      {!token && (
        <p className="mt-5 text-center text-sm text-muted">
          Şagird və ya valideynsiniz?{" "}
          <Link href="/onboarding" className="font-bold text-brand hover:underline">
            Buradan başlayın
          </Link>
        </p>
      )}
    </Shell>
  );
}

function EmailSignup({ token }: { token: string | null }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (name.trim().length < 2 || !email.includes("@")) {
      setError("Ad və e-poçtu tam yazın.");
      return;
    }
    if (password.length < 6) {
      setError("Parol ən azı 6 simvol olmalıdır.");
      return;
    }
    setBusy(true);
    setError("");
    setTeacherIntent(token);
    // Valideyn nəzarəti sahəsi müəllimə aid deyil — `role` ilə ayrılır.
    const res = await signUpWithEmail(name.trim(), email.trim(), password, false, undefined, { role: "teacher" });
    setBusy(false);
    if (!res.ok) {
      track("signup_failed", { reason: (res.error || "unknown").slice(0, 60), role: "teacher" });
      setError(res.error || "Qeydiyyat alınmadı.");
      return;
    }
    track("signup_completed", { method: "email", role: "teacher" });
    if (res.needsEmailConfirm) setError("E-poçtunuza təsdiq linki göndərdik. Linkə keçib davam edin.");
    // Sessiya yarananda useAuthUser səhifəni avtomatik növbəti addıma keçirir.
  }

  const input =
    "w-full rounded-2xl border-2 border-line bg-ink px-4 py-3 text-fg outline-none focus:border-brand";
  return (
    <form onSubmit={submit} className="space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad və soyad" autoComplete="name" className={input} />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-poçt"
        type="email"
        autoComplete="email"
        className={input}
      />
      <div className="relative">
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Parol (ən azı 6 simvol)"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          className={`${input} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Parolu gizlət" : "Parolu göstər"}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-fg"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="rounded-xl bg-red-500/10 px-3.5 py-2 text-sm font-semibold text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-line py-3 font-extrabold uppercase tracking-wide text-fg transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
      >
        <Mail size={17} /> {busy ? "Yaradılır…" : "E-poçtla qeydiyyat"}
      </button>
    </form>
  );
}

function Welcome() {
  return (
    <Shell>
      <Card>
        <div className="flex flex-col items-center text-center">
          <Mascot size={110} mood="celebrate" />
          <h1 className="mt-4 text-2xl font-extrabold text-fg sm:text-3xl">Hazırdır — siz Imparo müəllimisiniz</h1>
          <p className="mt-2 max-w-sm leading-relaxed text-muted">Üç addımda sinfiniz işləməyə başlayır:</p>
        </div>
        <ol className="mt-6 space-y-3">
          {[
            "Sinif yaradın və fənni seçin",
            "6 simvollu kodu şagirdlərinizlə paylaşın",
            "Dərsdən tapşırıq verin və nəticələri izləyin",
          ].map((s, i) => (
            <li key={s} className="flex items-center gap-3 rounded-2xl border border-line bg-ink px-4 py-3 font-semibold text-fg">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-extrabold text-white">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <Link
          href="/mekteb/muellim?yeni=1"
          className="mt-6 flex w-full items-center justify-center rounded-2xl bg-brand py-3.5 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
        >
          İlk sinfinizi yaradın
        </Link>
      </Card>
    </Shell>
  );
}

function Pending({ email }: { email: string }) {
  return (
    <Shell>
      <Card>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 size={32} />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-fg sm:text-3xl">Müraciətiniz qəbul edildi</h1>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5 text-sm font-bold text-amber-600">
            <Clock size={16} /> Təsdiq gözlənilir
          </div>
          <p className="mt-4 max-w-sm leading-relaxed text-muted">
            Müraciətinizə baxırıq. Təsdiqlənən kimi <b className="text-fg">{email}</b> ünvanına məktub gələcək —
            sonra sinif yarada biləcəksiniz.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-center rounded-2xl border-2 border-line py-3 font-extrabold text-fg transition-colors hover:border-brand hover:text-brand"
          >
            Dərslərə baxın
          </Link>
          <a
            href="mailto:destek@imparo.app?subject=M%C3%BC%C9%99llim%20m%C3%BCraci%C9%99ti"
            className="flex items-center justify-center rounded-2xl border-2 border-line py-3 font-extrabold text-fg transition-colors hover:border-brand hover:text-brand"
          >
            Bizə yazın
          </a>
        </div>
      </Card>
    </Shell>
  );
}

function WrongAccount({
  kind,
  hint,
  current,
  onSwitch,
}: {
  kind: "email_mismatch" | "need_google";
  hint: string | null;
  current: string;
  onSwitch: () => void;
}) {
  return (
    <Shell>
      <Card>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
          <AlertTriangle size={26} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-fg">
          {kind === "need_google" ? "Google ilə daxil olun" : "Bu dəvət başqa hesab üçündür"}
        </h1>
        <p className="mt-2 leading-relaxed text-muted">
          {kind === "need_google" ? (
            <>
              Hesabınızın ünvanı düzgündür, amma dəvət yalnız <b className="text-fg">Google</b> ilə girişdə qəbul
              olunur — belə olanda ünvanın sizə aid olduğu təsdiqlənir.
            </>
          ) : (
            <>
              Siz <b className="text-fg">{current}</b> ilə daxil olmusunuz, dəvət isə{" "}
              <b className="text-fg">{hint ?? "başqa ünvan"}</b> üçündür.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={onSwitch}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
        >
          <LogOut size={18} /> Çıxış edib düzgün hesabla daxil olun
        </button>
      </Card>
    </Shell>
  );
}

function InviteProblem({ kind }: { kind: string }) {
  const p = INVITE_PROBLEM[kind] ?? INVITE_PROBLEM.error;
  return (
    <Shell>
      <Card>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
          <AlertTriangle size={26} />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-fg">{p.title}</h1>
        <p className="mt-2 leading-relaxed text-muted">{p.body}</p>
        <Link
          href="/muellim-ol"
          className="mt-6 flex w-full items-center justify-center rounded-2xl bg-brand py-3.5 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
        >
          Adi müraciət göndərin
        </Link>
      </Card>
    </Shell>
  );
}

function NotTeacher({ onboarded }: { onboarded: boolean }) {
  const router = useRouter();
  return (
    <p className="mt-5 text-center text-sm text-muted">
      Müəllim deyilsiniz?{" "}
      <button
        type="button"
        onClick={() => {
          clearTeacherIntent();
          router.push(onboarded ? "/dashboard" : "/onboarding");
        }}
        className="font-bold text-brand hover:underline"
      >
        Şagird kimi davam edin
      </button>
    </p>
  );
}
