"use client";

// Sinif dashboardu (müəllim) — kod paylaş, şagird reyestri + analitika, tapşırıq təyin et.

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Flame, Star, CircleCheck, AlertTriangle, ClipboardList, Clock, Target } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { useContent } from "@/components/ContentProvider";
import {
  teacherClasses,
  classRoster,
  classAssignments,
  classSkillGaps,
  assignLesson,
  type TeacherClass,
  type RosterRow,
  type ClassAssignment,
  type SkillGapRow,
} from "@/lib/schools";
import { getSkill } from "@/lib/skills";
import { PageSkeleton } from "@/components/Skeleton";

export default function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, ready } = useAuthUser();
  const { subjects } = useContent();
  const [cls, setCls] = useState<TeacherClass | null | undefined>(undefined);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [tasks, setTasks] = useState<ClassAssignment[]>([]);
  const [gaps, setGaps] = useState<SkillGapRow[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [due, setDue] = useState("");
  const [minScore, setMinScore] = useState(70);
  const [busy, setBusy] = useState(false);

  function reload() {
    classRoster(id).then(setRoster);
    classAssignments(id).then(setTasks);
    classSkillGaps(id).then(setGaps);
  }
  useEffect(() => {
    if (!user) return;
    teacherClasses().then((cs) => {
      setCls(cs.find((c) => c.id === id) ?? null);
    });
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  // Sinfin fənninin dərsləri (tapşırıq üçün).
  const lessons = useMemo(() => {
    if (!cls) return [] as { id: string; title: string; unit: string }[];
    const s = subjects.find((x) => x.slug === cls.subject_slug);
    if (!s) return [];
    return s.units.flatMap((u) => u.lessons.map((l) => ({ id: l.id, title: l.title, unit: u.title })));
  }, [cls, subjects]);

  const stats = useMemo(() => {
    const n = roster.length;
    if (!n) return { n: 0, avgXp: 0, active: 0, avgDone: 0 };
    const avgXp = Math.round(roster.reduce((a, r) => a + r.total_xp, 0) / n);
    const active = roster.filter((r) => r.streak_days > 0).length;
    const avgDone = Math.round(roster.reduce((a, r) => a + Number(r.completed), 0) / n);
    return { n, avgXp, active, avgDone };
  }, [roster]);

  async function assign() {
    const lid = lessonId || lessons[0]?.id;
    if (!lid || busy) return;
    const lesson = lessons.find((l) => l.id === lid);
    setBusy(true);
    await assignLesson(id, lid, lesson?.title ?? "Tapşırıq", due || null, minScore).catch(() => null);
    setDue("");
    setBusy(false);
    classAssignments(id).then(setTasks);
  }

  if (!ready || cls === undefined) return <PageSkeleton />;

  if (cls === null) {
    return (
      <div className="min-h-screen bg-ink">
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-muted">Bu sinif tapılmadı və ya sən onun müəllimi deyilsən.</p>
          <Link href="/mekteb/muellim" className="mt-4 inline-block rounded-2xl bg-brand px-5 py-3 font-extrabold text-white btn-pop">
            Siniflərə qayıt
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/mekteb/muellim" className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-fg">
          <ArrowLeft size={16} /> Siniflərim
        </Link>

        {/* Başlıq + kod */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand to-brand-dark p-5 text-white shadow-lg">
          <div>
            <h1 className="text-2xl font-extrabold">{cls.name}</h1>
            <p className="text-sm text-white/85">{cls.grade}-ci sinif kurikulumu</p>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-white/70">Sinif kodu</div>
            <div className="font-mono text-2xl font-black tracking-widest">{cls.code}</div>
          </div>
        </div>

        {/* Analitika */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox Icon={Users} label="Şagird" value={stats.n} tint="text-brand" />
          <StatBox Icon={Flame} label="Aktiv" value={stats.active} tint="text-orange-500" />
          <StatBox Icon={Star} label="Orta XP" value={stats.avgXp} tint="text-amber-500" />
          <StatBox Icon={CircleCheck} label="Orta dərs" value={stats.avgDone} tint="text-emerald-500" />
        </div>

        {/* Tapşırıq təyin et */}
        <div className="mt-5 rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-center gap-2 font-extrabold text-fg">
            <ClipboardList size={18} className="text-brand" /> Tapşırıq ver
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select
              value={lessonId || lessons[0]?.id || ""}
              onChange={(e) => setLessonId(e.target.value)}
              className="rounded-2xl border-2 border-line bg-ink px-4 py-2.5 font-bold text-fg outline-none focus:border-brand sm:col-span-2"
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.unit} — {l.title}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-2xl border-2 border-line bg-ink px-4 py-2.5">
              <span className="text-sm font-bold text-muted">Son tarix</span>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="flex-1 bg-transparent font-bold text-fg outline-none"
              />
            </label>
            <label className="flex items-center gap-2 rounded-2xl border-2 border-line bg-ink px-4 py-2.5">
              <span className="text-sm font-bold text-muted">Min. nəticə</span>
              <input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-16 bg-transparent font-bold text-fg outline-none"
              />
              <span className="text-sm text-muted">%</span>
            </label>
          </div>
          <button
            type="button"
            onClick={assign}
            disabled={busy || lessons.length === 0}
            className="mt-3 w-full rounded-2xl bg-brand py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {busy ? "Təyin edilir…" : "Təyin et"}
          </button>

          {tasks.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              {tasks.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <ClipboardList size={15} className="shrink-0 text-brand" />
                  <span className="flex-1 truncate font-bold text-fg">{a.title}</span>
                  {a.due_date && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-orange-500">
                      <Clock size={12} /> {a.due_date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sinfin zəif bacarıqları — dərs planlaşdırmaq üçün əsas siqnal.
            Ortalama YOX, "neçə şagird ilişib" göstərilir: 72%-lik ortalama 28
            şagirddən 11-nin ilişdiyini gizlədə bilər. */}
        {gaps.some((g) => g.weak_students > 0) && (
          <>
            <h2 className="mt-6 flex items-center gap-2 text-lg font-bold text-fg">
              <Target size={18} className="text-rose-500" /> Sinfin zəif bacarıqları
            </h2>
            <p className="mt-1 text-sm text-muted">
              Ən azı 3 dəfə cəhd edib 70%-dən aşağı qalan şagirdlər sayılır.
            </p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-panel">
              {gaps
                .filter((g) => g.weak_students > 0)
                .slice(0, 5)
                .map((g) => {
                  const sk = getSkill(g.skill_id);
                  const share = g.students ? Math.round((g.weak_students / g.students) * 100) : 0;
                  return (
                    <div key={g.skill_id} className="border-b border-line px-4 py-3 last:border-b-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-bold text-fg">{sk?.title ?? g.skill_id}</span>
                        <span className="shrink-0 text-sm font-extrabold tabular-nums text-rose-500">
                          {g.weak_students}/{g.students} şagird
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-panel-2">
                        <div className="h-full rounded-full bg-rose-500" style={{ width: `${share}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {sk ? `${sk.group} · ` : ""}sinif ortalaması {g.mastery}%
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {/* Şagird reyestri */}
        <h2 className="mt-6 text-lg font-bold text-fg">Şagirdlər</h2>
        {roster.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Hələ şagird yoxdur. Sinif kodunu (<span className="font-mono font-bold text-brand">{cls.code}</span>) şagirdlərə ver.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-panel">
            {roster.map((r) => {
              const atRisk = r.streak_days === 0 || Number(r.completed) === 0;
              return (
                <div key={r.user_id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <span className="flex-1 truncate font-bold text-fg">
                    {r.name}
                    {atRisk && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
                        <AlertTriangle size={10} /> diqqət
                      </span>
                    )}
                  </span>
                  <span className="w-16 text-right text-sm font-bold text-amber-500">{r.total_xp} XP</span>
                  <span className="w-12 text-right text-sm text-orange-500">🔥{r.streak_days}</span>
                  <span className="w-14 text-right text-sm text-emerald-600">{Number(r.completed)} dərs</span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function StatBox({
  Icon,
  label,
  value,
  tint,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4 text-center">
      <Icon size={20} className={`mx-auto ${tint}`} />
      <div className="mt-1 text-xl font-extrabold text-fg">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
}
