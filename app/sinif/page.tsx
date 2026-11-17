"use client";

// Sinif girişi — e-poçtu olmayan şagird (1–4-cü siniflər) üçün.
//   1) sinif kodu (və ya kartdakı QR → /sinif?k=KOD&s=ŞAGİRD)
//   2) adını seç ("Aysel M." — tam ad girişsiz ekranda görünmür)
//   3) 4 rəqəmli PIN — böyük düymələr, 4-cü rəqəmdə özü yoxlanır
// 6–9 yaşlı uşaq üçün: yazmaq minimum, mətn qısa, səhv olanda nə edəcəyi aydın.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Delete } from "lucide-react";
import Logo from "@/components/Logo";
import Mascot from "@/components/Mascot";
import { PageSkeleton } from "@/components/Skeleton";
import { track } from "@/lib/analytics";
import { isRef, normalizeClassCode } from "@/lib/managedStudents";

export default function ClassLoginPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClassLogin />
    </Suspense>
  );
}

interface Roster {
  class: { name: string; grade: number };
  students: { ref: string; name: string }[];
}

const COLORS = ["bg-orange-400", "bg-amber-400", "bg-emerald-500", "bg-sky-400", "bg-violet-400", "bg-rose-400"];

function ClassLogin() {
  const params = useSearchParams();
  const [code, setCode] = useState(normalizeClassCode(params.get("k") ?? ""));
  const [roster, setRoster] = useState<Roster | null>(null);
  const [student, setStudent] = useState<{ ref: string; name: string } | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const loadRoster = useCallback(async (c: string, preselect?: string | null) => {
    setBusy(true);
    setError("");
    const r = await fetch("/api/sinif/roster", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: c }),
    }).catch(() => null);
    const j = (await r?.json().catch(() => null)) as ({ status: string } & Partial<Roster>) | null;
    setBusy(false);
    if (!j) return setError("İnternet yoxdur. Yenə yoxla.");
    if (j.status === "rate_limited") return setError("Çox cəhd oldu. Bir az gözlə.");
    if (j.status !== "ok" || !j.class || !j.students) return setError("Bu kodla sinif tapılmadı. Kodu müəllimindən yoxla.");
    setRoster({ class: j.class, students: j.students });
    const pre = preselect && j.students.find((s) => s.ref === preselect);
    if (pre) setStudent(pre);
    track("class_login_roster", { students: j.students.length, qr: Boolean(pre) });
  }, []);

  // Kartdakı QR: kod + şagird URL-dədir — birbaşa PIN ekranına.
  useEffect(() => {
    const k = normalizeClassCode(params.get("k") ?? "");
    const s = (params.get("s") ?? "").toUpperCase();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL-dən (QR) bir dəfəlik yükləmə
    if (k.length >= 4) loadRoster(k, isRef(s) ? s : null);
  }, [params, loadRoster]);

  const submitPin = useCallback(
    async (full: string) => {
      if (!student || busy) return;
      setBusy(true);
      setError("");
      const r = await fetch("/api/sinif/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, ref: student.ref, pin: full }),
      }).catch(() => null);
      const j = (await r?.json().catch(() => null)) as
        | { status: string; remaining?: number; retry_after?: number; error?: string }
        | null;
      if (j?.status === "ok") {
        track("class_login_success");
        // Tam yeniləmə QƏSDƏNDİR: yeni sessiya cookie-dən oxunsun — bu brauzerdə
        // əvvəl başqa hesab (müəllim, qardaş) açıq idisə, onun yaddaşdakı vəziyyəti qalmasın.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/dashboard");
        return;
      }
      setBusy(false);
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 450);
      if (!j) return setError("İnternet yoxdur. Yenə yoxla.");
      if (j.status === "wrong") {
        track("class_login_wrong");
        return setError(
          j.remaining && j.remaining > 0 ? `PIN səhvdir. Yenə yoxla (${j.remaining} cəhd qaldı).` : "PIN səhvdir.",
        );
      }
      if (j.status === "locked") {
        const min = Math.max(1, Math.ceil((j.retry_after ?? 300) / 60));
        return setError(`Çox səhv oldu. ${min} dəqiqə sonra yenə yoxla və ya PIN-i müəllimindən soruş.`);
      }
      if (j.status === "ip_limited") return setError("Bu kompüterdən çox səhv cəhd oldu. Bir az sonra yoxla.");
      setError(j.error ?? "Giriş alınmadı. Müəlliminə de.");
    },
    [student, busy, code],
  );

  function press(d: string) {
    if (busy || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) submitPin(next);
  }

  // Fiziki klaviatura da işləsin (kompüterdə).
  useEffect(() => {
    if (!student) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="force-light flex min-h-screen flex-col bg-ink">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={30} />
          <span className="text-lg font-extrabold text-brand">Imparo</span>
        </Link>
        <Link href="/login" className="text-sm font-bold text-muted hover:text-fg">
          E-poçtla giriş
        </Link>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-10">
        {/* 1) Sinif kodu */}
        {!roster && (
          <div className="mt-6 text-center">
            <Mascot size={110} mood="happy" />
            <h1 className="mt-4 text-3xl font-extrabold text-fg">Sinif kodunu yaz</h1>
            <p className="mt-2 text-muted">Kod müəlliminin verdiyi kartdadır.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (code.length >= 4) loadRoster(code);
              }}
              className="mt-6"
            >
              <input
                value={code}
                onChange={(e) => setCode(normalizeClassCode(e.target.value))}
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                aria-label="Sinif kodu"
                placeholder="AB12CD"
                className="w-full rounded-3xl border-4 border-line bg-panel px-4 py-4 text-center font-mono text-4xl font-extrabold tracking-[0.3em] text-fg outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={busy || code.length < 4}
                className="mt-4 w-full rounded-3xl bg-brand py-4 text-xl font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-50"
              >
                {busy ? "Axtarılır…" : "Davam"}
              </button>
            </form>
          </div>
        )}

        {/* 2) Adını seç */}
        {roster && !student && (
          <div className="mt-4">
            <button type="button" onClick={() => setRoster(null)} className="flex items-center gap-1 text-sm font-bold text-muted hover:text-fg">
              <ArrowLeft size={16} /> Başqa kod
            </button>
            <h1 className="mt-3 text-center text-3xl font-extrabold text-fg">Sən kimsən?</h1>
            <p className="mt-1 text-center text-muted">{roster.class.name}</p>
            {roster.students.length === 0 ? (
              <p className="mt-6 rounded-2xl bg-panel p-4 text-center text-muted">
                Bu sinifdə hələ şagird yoxdur. Müəlliminə de.
              </p>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {roster.students.map((s, i) => (
                  <button
                    key={s.ref}
                    type="button"
                    onClick={() => {
                      setStudent(s);
                      setPin("");
                      setError("");
                    }}
                    className="flex flex-col items-center gap-2 rounded-3xl border-2 border-line bg-panel px-3 py-4 transition hover:border-brand active:scale-95"
                  >
                    <span className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-extrabold text-white ${COLORS[i % COLORS.length]}`}>
                      {s.name.charAt(0)}
                    </span>
                    <span className="text-lg font-extrabold text-fg">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3) PIN */}
        {roster && student && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setStudent(null);
                setPin("");
                setError("");
              }}
              className="flex items-center gap-1 text-sm font-bold text-muted hover:text-fg"
            >
              <ArrowLeft size={16} /> Mən deyiləm
            </button>
            <h1 className="mt-3 text-3xl font-extrabold text-fg">Salam, {student.name.split(" ")[0]}!</h1>
            <p className="mt-1 text-muted">Kartdakı 4 rəqəmli PIN-i yaz</p>

            <div className={`mt-6 flex justify-center gap-4 ${shake ? "animate-[shake_0.4s]" : ""}`} aria-live="polite">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-6 w-6 rounded-full border-4 ${i < pin.length ? "border-brand bg-brand" : "border-line bg-panel"}`}
                />
              ))}
            </div>

            {error && <p className="mx-auto mt-4 max-w-xs rounded-2xl bg-red-500/10 px-4 py-2 font-bold text-red-500">{error}</p>}

            <div className="mx-auto mt-6 grid max-w-xs grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <PadKey key={d} onClick={() => press(d)} disabled={busy}>
                  {d}
                </PadKey>
              ))}
              <span />
              <PadKey onClick={() => press("0")} disabled={busy}>
                0
              </PadKey>
              <PadKey onClick={() => setPin((p) => p.slice(0, -1))} disabled={busy} label="Sil">
                <Delete size={26} />
              </PadKey>
            </div>
            {busy && <p className="mt-4 font-bold text-muted">Yoxlanılır…</p>}
          </div>
        )}

        {!roster && error && <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-center font-bold text-red-500">{error}</p>}
      </main>
    </div>
  );
}

function PadKey({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-16 items-center justify-center rounded-2xl border-2 border-line bg-panel text-2xl font-extrabold text-fg transition active:scale-95 active:bg-brand/10 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
