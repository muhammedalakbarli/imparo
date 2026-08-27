"use client";

// Müəllim paneli — siniflərim + yeni sinif yarat. Sinif kurikulum fənninə bağlıdır.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Users, ChevronRight, ArrowLeft, ShieldCheck, Clock, GraduationCap } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { useContent } from "@/components/ContentProvider";
import {
  teacherClasses, createClass, myTeacherStatus, requestTeacher,
  type TeacherClass, type TeacherStatus,
} from "@/lib/schools";
import { PageSkeleton } from "@/components/Skeleton";

export default function TeacherPage() {
  const { user, ready } = useAuthUser();
  const { subjects } = useContent();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [subjectSlug, setSubjectSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<TeacherStatus | null>(null);
  const [note, setNote] = useState("");
  const [requesting, setRequesting] = useState(false);

  // Fənlər (sinif üzrə sıralı) — sinif yaradarkən seçim.
  const options = [...subjects].sort((a, b) => a.grade - b.grade);

  function refresh() {
    Promise.all([myTeacherStatus(), teacherClasses()])
      .then(([st, cls]) => {
        setStatus(st);
        setClasses(st.is_teacher ? cls : []);
      })
      .finally(() => setLoaded(true));
  }
  useEffect(() => {
    if (user) refresh();
  }, [user]);

  async function sendRequest() {
    if (requesting) return;
    setRequesting(true);
    await requestTeacher(note.trim()).catch(() => null);
    await myTeacherStatus().then(setStatus);
    setRequesting(false);
  }

  async function submit() {
    const subj = options.find((s) => s.slug === subjectSlug) ?? options[0];
    if (!subj || busy) return;
    setBusy(true);
    await createClass(name.trim() || subj.name, subj.slug, subj.grade).catch(() => null);
    setName("");
    setCreating(false);
    setBusy(false);
    refresh();
  }

  if (!ready || (user && !loaded)) return <PageSkeleton />;

  // ── Müəllim qapısı: yalnız təsdiqlənmiş müəllim sinif aça bilər (Duolingo kimi) ──
  if (status && !status.is_teacher) {
    const rs = status.request_status;
    return (
      <div className="min-h-screen bg-ink">
        <main className="mx-auto max-w-lg px-4 py-6">
          <Link href="/mekteb" className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-fg">
            <ArrowLeft size={16} /> Məktəb
          </Link>

          <div className="mt-6 rounded-3xl border border-line bg-panel p-6 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <GraduationCap size={30} />
            </span>
            <h1 className="mt-4 text-2xl font-extrabold text-fg">Müəllim hesabı</h1>

            {rs === "pending" ? (
              <>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5 text-sm font-bold text-amber-600">
                  <Clock size={16} /> Müraciətin baxılır
                </div>
                <p className="mt-3 text-muted">
                  Müəllimlik müraciətin admin tərəfindən yoxlanılır. Təsdiqlənəndə sinif yarada biləcəksən.
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-muted">
                  Sinif yaratmaq və tapşırıq vermək üçün müəllimlik təsdiqi lazımdır. Hər kəs avtomatik
                  müəllim ola bilməz — müraciət et, admin təsdiqləsin.
                </p>
                {rs === "rejected" && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-bold text-red-500">
                    Əvvəlki müraciətin rədd edildi — yenidən müraciət edə bilərsən
                  </div>
                )}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Qısa məlumat (məktəb, fənn, niyə müəllim olmaq istəyirsən) — istəyə bağlı"
                  rows={3}
                  className="mt-4 w-full rounded-2xl border-2 border-line bg-ink px-4 py-2.5 text-fg outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={sendRequest}
                  disabled={requesting}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-50"
                >
                  <ShieldCheck size={18} /> {requesting ? "Göndərilir…" : "Müəllimlik üçün müraciət et"}
                </button>
              </>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-muted">
            Şagirdsənsə, <Link href="/mekteb" className="font-bold text-brand hover:underline">kodla sinfə qoşul</Link>.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/mekteb" className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-fg">
            <ArrowLeft size={16} /> Məktəb
          </Link>
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            className="flex items-center gap-1.5 rounded-2xl bg-brand px-4 py-2 text-sm font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
          >
            <Plus size={16} /> Yeni sinif
          </button>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-fg">Siniflərim</h1>

        {/* Yeni sinif formu */}
        {creating && (
          <div className="mt-4 space-y-3 rounded-2xl border border-line bg-panel p-5">
            <div>
              <label className="text-xs font-bold text-muted">Sinif adı</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Məs: 5A"
                className="mt-1 w-full rounded-2xl border-2 border-line bg-ink px-4 py-2.5 font-bold text-fg outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted">Fənn</label>
              <select
                value={subjectSlug || options[0]?.slug}
                onChange={(e) => setSubjectSlug(e.target.value)}
                className="mt-1 w-full rounded-2xl border-2 border-line bg-ink px-4 py-2.5 font-bold text-fg outline-none focus:border-brand"
              >
                {options.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name} · {s.grade}-ci sinif
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="w-full rounded-2xl bg-brand py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-50"
            >
              {busy ? "Yaradılır…" : "Sinif yarat"}
            </button>
          </div>
        )}

        {/* Sinif siyahısı */}
        {classes.length === 0 ? (
          <p className="mt-6 text-muted">Hələ sinif yoxdur. “Yeni sinif” ilə başla.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/mekteb/sinif/${c.id}`}
                className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-5 transition hover:bg-panel-2"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-lg font-extrabold text-white">
                  {c.grade}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold text-fg">{c.name}</span>
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <Users size={14} /> {c.student_count} şagird · kod{" "}
                    <span className="font-mono font-bold text-brand">{c.code}</span>
                  </span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-muted" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
