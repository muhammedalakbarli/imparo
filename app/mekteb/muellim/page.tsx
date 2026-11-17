"use client";

// Müəllim paneli — siniflərim + yeni sinif yarat. Sinif kurikulum fənninə bağlıdır.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users, ChevronRight, ArrowLeft, Clock, GraduationCap, Video, Eye } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { useContent } from "@/components/ContentProvider";
import {
  teacherClasses, createClass, myTeacherStatus,
  type TeacherClass, type TeacherStatus,
} from "@/lib/schools";
import TeacherRequestForm from "@/components/teacher/TeacherRequestForm";
import { markTeacherAccount } from "@/lib/teacher";
import { myVideos, type MyVideo } from "@/lib/videos";
import { PageSkeleton } from "@/components/Skeleton";
import { gradeLabel } from "@/lib/grade";
import { isManagedAccount } from "@/lib/managedStudents";
import { azShortDate } from "@/lib/azDate";

export default function TeacherPage() {
  const { user, ready } = useAuthUser();
  const router = useRouter();
  const { subjects } = useContent();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [subjectSlug, setSubjectSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<TeacherStatus | null>(null);
  const [videos, setVideos] = useState<MyVideo[]>([]);

  // Fənlər (sinif üzrə sıralı) — sinif yaradarkən seçim.
  const options = [...subjects].sort((a, b) => a.grade - b.grade);

  function refresh() {
    Promise.all([myTeacherStatus(), teacherClasses()])
      .then(([st, cls]) => {
        setStatus(st);
        setClasses(st.is_teacher ? cls : []);
        // İlk sinif: yeni müəllim (dəvət/təsdiq məktubundan ?yeni=1 ilə gəlir) və ya
        // hələ sinfi olmayan müəllim üçün forma dərhal açıq olsun — boş siyahı +
        // "Yeni sinif" düyməsi axtarmaq əlavə addımdır.
        if (st.is_teacher && (cls.length === 0 || window.location.search.includes("yeni=1"))) {
          setCreating(true);
        }
        // Video siyahısı yalnız təsdiqlənmiş müəllim üçün mənalıdır (RPC də belə yoxlayır).
        if (st.is_teacher) myVideos().then(setVideos);
      })
      .finally(() => setLoaded(true));
  }
  // Sinif hesabı (müəllimin yaratdığı şagird) müəllim panelinə/müraciət formuna
  // düşməsin — /mekteb-də öz sinfi görünür.
  const managed = isManagedAccount(user);
  useEffect(() => {
    if (managed) router.replace("/mekteb");
    else if (user) refresh();
  }, [user, managed, router]);

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

  if (!ready || managed || (user && !loaded)) return <PageSkeleton />;

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
                  <Clock size={16} /> Müraciətiniz baxılır
                </div>
                <p className="mt-3 text-muted">
                  Təsdiqlənən kimi e-poçtla xəbər verəcəyik — sonra sinif yarada biləcəksiniz.
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-muted">
                  Sinif yaratmaq üçün müəllim hesabı lazımdır. Uşaqların təhlükəsizliyi üçün hesabları əl
                  ilə təsdiqləyirik — məktəb və fənni yazın, təsdiqlənən kimi e-poçtla xəbər verəcəyik.
                </p>
                {rs === "rejected" && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-bold text-red-500">
                    Əvvəlki müraciət təsdiqlənməyib — yenidən göndərə bilərsiniz
                  </div>
                )}
                <div className="mt-5">
                  <TeacherRequestForm
                    onDone={async () => {
                      await markTeacherAccount();
                      await myTeacherStatus().then(setStatus);
                    }}
                  />
                </div>
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
                    {s.name} · {gradeLabel(s.grade)}
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
        {/* Video dərslərim — sinif videoları + kitabxanaya göndərilənlərin statusu (0056).
            Sinif videosu dərhal açıqdır; kitabxana videosu admin təsdiqi gözləyir. */}
        {videos.length > 0 && (
          <section className="mt-8">
            <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
              <Video size={18} className="text-brand" /> Video dərslərim
            </h2>
            <div className="mt-3 space-y-2">
              {videos.map((v) => (
                <div key={v.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-fg">{v.title}</span>
                    <span className="block text-xs text-muted">
                      {v.class_name ?? "Ümumi kitabxana"} ·{" "}
                      {azShortDate(v.created_at)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-muted">
                    <Eye size={12} /> {v.views}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      v.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : v.status === "pending"
                          ? "bg-amber-500/15 text-amber-600"
                          : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {v.status === "approved" ? "Açıqdır" : v.status === "pending" ? "Təsdiq gözləyir" : "Rədd edilib"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
