"use client";

// Sinif dashboardu (müəllim) — kod paylaş, şagird reyestri + analitika, tapşırıq təyin et.
// İdarəetmə (0054): sinfin adını dəyiş, kodu yenilə, sinfi sil, tapşırığı redaktə et/sil,
// şagirdi çıxar, şagirdin fərdi mənzərəsi.

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Users, Flame, Star, CircleCheck, AlertTriangle, ClipboardList, Clock, Target,
  Pencil, Check, X, Trash2, RefreshCw, Copy, ChevronRight, HeartHandshake,
} from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { useContent } from "@/components/ContentProvider";
import {
  teacherClasses,
  classRoster,
  classAssignments,
  classSkillGaps,
  assignLesson,
  assignmentProgress,
  renameClass,
  regenClassCode,
  deleteClass,
  removeStudent,
  updateAssignment,
  deleteAssignment,
  classStudentDetail,
  type TeacherClass,
  type RosterRow,
  type ClassAssignment,
  type SkillGapRow,
  type AssignmentProgress,
  type StudentDetail,
} from "@/lib/schools";
import { getSkill } from "@/lib/skills";
import ClassVideos from "@/components/mekteb/ClassVideos";
import ManagedStudents from "@/components/mekteb/ManagedStudents";
import { endorseStudent } from "@/lib/sponsor";
import { PageSkeleton } from "@/components/Skeleton";
import { gradeLabel } from "@/lib/grade";
import { useRouter } from "next/navigation";

export default function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const { subjects } = useContent();
  const [cls, setCls] = useState<TeacherClass | null | undefined>(undefined);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [tasks, setTasks] = useState<ClassAssignment[]>([]);
  const [gaps, setGaps] = useState<SkillGapRow[]>([]);
  const [prog, setProg] = useState<AssignmentProgress[]>([]);
  const [lessonId, setLessonId] = useState("");
  const [due, setDue] = useState("");
  const [minScore, setMinScore] = useState(70);
  const [busy, setBusy] = useState(false);
  // İdarəetmə vəziyyəti
  const [renaming, setRenaming] = useState<string | null>(null); // null = redaktə yoxdur
  const [detailUid, setDetailUid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Zəmanət verilmiş şagirdlər (sessiya daxilində vizual təsdiq üçün).
  const [endorsed, setEndorsed] = useState<Set<string>>(new Set());

  const reload = useCallback(() => {
    classRoster(id).then(setRoster);
    classAssignments(id).then(setTasks);
    classSkillGaps(id).then(setGaps);
    assignmentProgress(id).then(setProg);
  }, [id]);

  const loadClass = useCallback(() => {
    teacherClasses().then((cs) => setCls(cs.find((c) => c.id === id) ?? null));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    loadClass();
    reload();
  }, [user, loadClass, reload]);

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

  const progOf = (aid: string) => prog.find((p) => p.assignment_id === aid);

  async function assign() {
    const lid = lessonId || lessons[0]?.id;
    if (!lid || busy) return;
    const lesson = lessons.find((l) => l.id === lid);
    setBusy(true);
    await assignLesson(id, lid, lesson?.title ?? "Tapşırıq", due || null, minScore).catch(() => null);
    setDue("");
    setBusy(false);
    reload();
  }

  async function saveName(name: string) {
    if (!name.trim()) { setRenaming(null); return; }
    await renameClass(id, name).catch(() => null);
    setRenaming(null);
    loadClass();
  }

  async function newCode() {
    await regenClassCode(id).catch(() => null);
    loadClass();
  }

  async function removeClass() {
    await deleteClass(id).catch(() => null);
    router.replace("/mekteb/muellim");
  }

  function copyCode() {
    if (!cls) return;
    navigator.clipboard?.writeText(cls.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
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
          <div className="min-w-0">
            {renaming === null ? (
              <h1 className="flex items-center gap-2 text-2xl font-extrabold">
                <span className="truncate">{cls.name}</span>
                <button onClick={() => setRenaming(cls.name)} aria-label="Adı dəyiş"
                  className="rounded-lg p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white">
                  <Pencil size={16} />
                </button>
              </h1>
            ) : (
              <div className="flex items-center gap-1.5">
                <input autoFocus value={renaming} onChange={(e) => setRenaming(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName(renaming);
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  className="w-52 rounded-xl bg-white/15 px-3 py-1.5 text-xl font-extrabold text-white outline-none placeholder:text-white/50" />
                <button onClick={() => saveName(renaming)} aria-label="Yadda saxla"
                  className="rounded-lg bg-white/20 p-1.5 hover:bg-white/30"><Check size={16} /></button>
                <button onClick={() => setRenaming(null)} aria-label="Ləğv et"
                  className="rounded-lg p-1.5 text-white/70 hover:bg-white/15"><X size={16} /></button>
              </div>
            )}
            <p className="text-sm text-white/85">{gradeLabel(cls.grade)} kurikulumu</p>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-white/70">Sinif kodu</div>
            <div className="font-mono text-2xl font-black tracking-widest">{cls.code}</div>
            <div className="mt-1 flex items-center justify-end gap-1">
              <button onClick={copyCode}
                className="flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[11px] font-bold hover:bg-white/25">
                <Copy size={11} /> {copied ? "Kopyalandı" : "Kopyala"}
              </button>
              <ConfirmButton
                label={<><RefreshCw size={11} /> Kodu yenilə</>}
                question="Köhnə kod ləğv olunsun?"
                onConfirm={newCode}
                className="flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[11px] font-bold hover:bg-white/25"
                confirmClassName="rounded-lg bg-white text-brand px-2 py-1 text-[11px] font-bold"
                cancelClassName="rounded-lg bg-white/15 px-2 py-1 text-[11px] font-bold"
              />
            </div>
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
            <div className="mt-4 space-y-1 border-t border-line pt-4">
              {tasks.map((a) => (
                <AssignmentRow
                  key={a.id}
                  a={a}
                  progress={progOf(a.id)}
                  onChanged={reload}
                />
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

        {/* Video dərslər — müəllim yükləyir, sinfin şagirdləri izləyir (0056) */}
        <ClassVideos classId={id} canManage subjectSlug={cls.subject_slug} grade={cls.grade} />

        {/* E-poçtsuz şagird hesabları — sinif kodu + PIN ilə giriş (0065) */}
        <ManagedStudents classId={id} classCode={cls.code} onChanged={reload} />

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
                  <button onClick={() => setDetailUid(r.user_id)}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left font-bold text-fg hover:text-brand">
                    <span className="truncate">{r.name}</span>
                    {atRisk && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
                        <AlertTriangle size={10} /> diqqət
                      </span>
                    )}
                    <ChevronRight size={14} className="shrink-0 text-muted" />
                  </button>
                  <span className="w-16 text-right text-sm font-bold text-amber-500">{r.total_xp} XP</span>
                  <span className="w-12 text-right text-sm text-orange-500">🔥{r.streak_days}</span>
                  <span className="w-14 text-right text-sm text-emerald-600">{Number(r.completed)} dərs</span>
                  {/* Burs zəmanəti: ehtiyacı ən yaxşı müəllim bilir. Zəmanət Plus VERMİR —
                      müraciəti yaradıb admin növbəsində öndə yerləşdirir (0057). */}
                  <ConfirmButton
                    label={<HeartHandshake size={14} />}
                    question="Burs üçün zəmanət?"
                    onConfirm={async () => {
                      await endorseStudent(id, r.user_id).catch(() => null);
                      setEndorsed((prev) => new Set(prev).add(r.user_id));
                    }}
                    className={`rounded-lg p-1.5 transition-colors ${
                      endorsed.has(r.user_id)
                        ? "text-emerald-600"
                        : "text-muted hover:bg-emerald-500/10 hover:text-emerald-600"
                    }`}
                  />
                  <ConfirmButton
                    label={<Trash2 size={14} />}
                    question="Çıxarılsın?"
                    onConfirm={async () => { await removeStudent(id, r.user_id).catch(() => null); reload(); }}
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Təhlükəli zona */}
        <div className="mt-8 rounded-2xl border border-red-500/25 bg-red-500/[0.04] p-4">
          <div className="text-sm font-extrabold text-red-500">Sinfi sil</div>
          <p className="mt-1 text-sm text-muted">
            Sinif, üzvlüklər və tapşırıqlar silinir. Şagirdlərin şəxsi irəliləyişi (XP, dərslər) toxunulmur.
          </p>
          <div className="mt-3">
            <ConfirmButton
              label={<><Trash2 size={14} /> Sinfi sil</>}
              question="Sinif həmişəlik silinsin?"
              onConfirm={removeClass}
              className="flex items-center gap-1.5 rounded-xl border-2 border-red-500/40 px-4 py-2 text-sm font-extrabold text-red-500 hover:bg-red-500/10"
            />
          </div>
        </div>
      </main>

      {detailUid && (
        <StudentModal classId={id} uid={detailUid} onClose={() => setDetailUid(null)} />
      )}
    </div>
  );
}

/* ── İki addımlı təsdiq düyməsi ──
   Admin tərəfindəki ConfirmProvider şagird/müəllim tərəfində mount olunmayıb,
   window.confirm isə mobil brauzerdə kobud görünür — ona görə yerində təsdiq. */
function ConfirmButton({
  label, question, onConfirm, className, confirmClassName, cancelClassName,
}: {
  label: React.ReactNode;
  question: string;
  onConfirm: () => void | Promise<void>;
  className?: string;
  confirmClassName?: string;
  cancelClassName?: string;
}) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!asking) {
    return <button type="button" onClick={() => setAsking(true)} className={className}>{label}</button>;
  }
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-bold">
      <span className="text-muted">{question}</span>
      <button type="button" disabled={busy}
        onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); setAsking(false); }}
        className={confirmClassName ?? "rounded-lg bg-red-500 px-2 py-1 text-white disabled:opacity-50"}>
        Bəli
      </button>
      <button type="button" onClick={() => setAsking(false)}
        className={cancelClassName ?? "rounded-lg border border-line px-2 py-1 text-fg"}>
        Xeyr
      </button>
    </span>
  );
}

/* ── Tapşırıq sətri (baxış / redaktə) ── */
function AssignmentRow({
  a, progress, onChanged,
}: {
  a: ClassAssignment;
  progress?: AssignmentProgress;
  onChanged: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(a.title);
  const [due, setDue] = useState(a.due_date ?? "");
  const [min, setMin] = useState(a.min_score);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await updateAssignment(a.id, {
      title,
      due: due ? due : null, // boş → son tarixi təmizlə
      minScore: min,
    }).catch(() => null);
    setBusy(false);
    setEdit(false);
    onChanged();
  }

  if (edit) {
    return (
      <div className="rounded-xl border border-line bg-ink p-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm font-bold text-fg outline-none focus:border-brand" />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
            className="rounded-lg border border-line bg-panel px-2.5 py-1.5 text-sm font-bold text-fg outline-none focus:border-brand" />
          <label className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-sm">
            <span className="font-bold text-muted">Min</span>
            <input type="number" min={0} max={100} value={min} onChange={(e) => setMin(Number(e.target.value))}
              className="w-12 bg-transparent font-bold text-fg outline-none" />
            <span className="text-muted">%</span>
          </label>
          <button onClick={save} disabled={busy}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-extrabold text-white disabled:opacity-50">
            {busy ? "…" : "Saxla"}
          </button>
          <button onClick={() => setEdit(false)} className="rounded-lg border border-line px-3 py-1.5 text-sm font-bold text-fg">
            Ləğv et
          </button>
        </div>
      </div>
    );
  }

  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="flex items-center gap-2 rounded-xl px-1 py-2 text-sm hover:bg-panel-2">
      <ClipboardList size={15} className="shrink-0 text-brand" />
      <span className="flex-1 truncate font-bold text-fg">{a.title}</span>
      {progress && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-emerald-600" title="Tamamlayan şagird">
          <span className="h-1.5 w-10 overflow-hidden rounded-full bg-panel-2">
            <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
          </span>
          {progress.done}/{progress.total}
        </span>
      )}
      {a.due_date && (
        <span className="flex shrink-0 items-center gap-1 text-xs text-orange-500">
          <Clock size={12} /> {a.due_date}
        </span>
      )}
      <button onClick={() => setEdit(true)} aria-label="Redaktə et"
        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-panel-2 hover:text-fg">
        <Pencil size={13} />
      </button>
      <ConfirmButton
        label={<Trash2 size={13} />}
        question="Silinsin?"
        onConfirm={async () => { await deleteAssignment(a.id).catch(() => null); onChanged(); }}
        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
      />
    </div>
  );
}

/* ── Şagirdin fərdi mənzərəsi ── */
function StudentModal({ classId, uid, onClose }: { classId: string; uid: string; onClose: () => void }) {
  const [d, setD] = useState<StudentDetail | null | undefined>(undefined);

  useEffect(() => { classStudentDetail(classId, uid).then(setD); }, [classId, uid]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const doneCount = d?.assignments.filter((a) => a.done).length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-panel p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="truncate text-lg font-extrabold text-fg">{d?.name ?? "…"}</h2>
          <button onClick={onClose} aria-label="Bağla" className="rounded-lg p-1.5 text-muted hover:bg-panel-2">
            <X size={20} />
          </button>
        </div>

        {d === undefined ? (
          <p className="mt-6 text-center text-muted">Yüklənir…</p>
        ) : d === null ? (
          <p className="mt-6 text-center text-muted">Məlumat tapılmadı.</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MiniStat label="XP" value={String(d.total_xp)} />
              <MiniStat label="Streak" value={`🔥 ${d.streak_days}`} />
              <MiniStat label="Dərs" value={String(d.completed)} />
              <MiniStat label="Tapşırıq" value={`${doneCount}/${d.assignments.length}`} />
            </div>

            <div className="mt-4">
              <div className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">Tapşırıqlar</div>
              {d.assignments.length === 0 ? (
                <p className="text-sm text-muted">Bu sinifdə hələ tapşırıq yoxdur.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-line">
                  {d.assignments.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 border-b border-line px-3 py-2 text-sm last:border-b-0">
                      {a.done
                        ? <CircleCheck size={15} className="shrink-0 text-emerald-500" />
                        : <AlertTriangle size={15} className="shrink-0 text-amber-500" />}
                      <span className="flex-1 truncate font-bold text-fg">{a.title}</span>
                      {a.late && <span className="shrink-0 text-xs font-bold text-orange-500">gecikib</span>}
                      {a.due_date && <span className="shrink-0 text-xs text-muted">{a.due_date}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {d.weak_skills.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">Zəif bacarıqlar</div>
                <div className="flex flex-wrap gap-2">
                  {d.weak_skills.map((s) => {
                    const sk = getSkill(s.skill_id);
                    return (
                      <span key={s.skill_id} className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-sm font-bold text-rose-600">
                        {sk?.title ?? s.skill_id} <span className="tabular-nums">{s.mastery}%</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {d.recent.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">Son fəaliyyət</div>
                <div className="space-y-1">
                  {d.recent.map((r) => (
                    <div key={r.lesson_id + r.at} className="flex items-center gap-2 text-sm">
                      <CircleCheck size={14} className="shrink-0 text-emerald-500" />
                      <span className="flex-1 truncate text-fg">{r.title ?? r.lesson_id}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {new Date(r.at).toLocaleDateString("az-AZ", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <ConfirmButton
                label={<><Trash2 size={14} /> Sinifdən çıxar</>}
                question="Çıxarılsın?"
                onConfirm={async () => { await removeStudent(classId, uid).catch(() => null); onClose(); }}
                className="flex items-center gap-1.5 rounded-xl border-2 border-red-500/40 px-4 py-2 text-sm font-extrabold text-red-500 hover:bg-red-500/10"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-panel-2 px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="truncate font-extrabold text-fg">{value}</div>
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
