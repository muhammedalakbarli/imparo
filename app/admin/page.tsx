"use client";

// Admin paneli — məzmun idarəetməsi (fənn → bölmə → dərs → tapşırıq CRUD).
// Yalnız is_admin() olan istifadəçi girə bilir (əks halda /dashboard-a yönlənir).
// Yazılar RLS ilə qorunur; oxuma fetchContentTree ilə.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { fetchContentTree } from "@/lib/content/db";
import {
  checkIsAdmin,
  adminListTeacherRequests,
  genId,
  upsertSubject,
  deleteSubject,
  upsertUnit,
  deleteUnit,
  upsertLesson,
  deleteLesson,
  upsertTask,
  deleteTask,
  reorderLevel,
  type TaskForm,
} from "@/lib/adminApi";
import type { Subject, Unit, Lesson, Task, TaskType, RuleSection } from "@/lib/types";
import { PageSkeleton } from "@/components/Skeleton";

type Editing =
  | { kind: "subject"; mode: "new" | "edit"; data: Partial<Subject> }
  | { kind: "unit"; mode: "new" | "edit"; data: Partial<Unit> }
  | { kind: "lesson"; mode: "new" | "edit"; data: Partial<LessonForm> }
  | { kind: "task"; mode: "new" | "edit"; data: Partial<TaskForm> }
  | null;

export default function AdminPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tree, setTree] = useState<Subject[] | undefined>(undefined); // undefined = hələ yüklənməyib
  const [sel, setSel] = useState<{ s?: string; u?: string; l?: string }>({});
  const [editing, setEditing] = useState<Editing>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [pendingTeachers, setPendingTeachers] = useState(0);
  useEffect(() => {
    if (user) checkIsAdmin().then(setIsAdmin);
  }, [user]);
  useEffect(() => {
    if (isAdmin === true) adminListTeacherRequests().then((r) => setPendingTeachers(r.length));
  }, [isAdmin]);
  useEffect(() => {
    fetchContentTree().then((t) => setTree(t ?? []));
  }, []);
  useEffect(() => {
    if (isAdmin === false) router.replace("/dashboard");
  }, [isAdmin, router]);

  async function reload() {
    setTree((await fetchContentTree()) ?? []);
  }

  if (!ready || !user || isAdmin !== true || tree === undefined) return <PageSkeleton />;

  const subjects = tree;
  const subj = subjects.find((s) => s.slug === sel.s);
  const unit = subj?.units.find((u) => u.id === sel.u);
  const lesson = unit?.lessons.find((l) => l.id === sel.l);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setErr("");
    const r = await fn();
    setBusy(false);
    if (!r.ok) {
      setErr(r.error || "Xəta");
      return false;
    }
    await reload();
    setEditing(null);
    return true;
  }

  // ── Silmə (təsdiqlə) ──
  async function del(kind: string, id: string, cascadeWarn?: string) {
    if (!confirm(`Silinsin? ${cascadeWarn ?? ""}`)) return;
    if (kind === "subject") await run(() => deleteSubject(id));
    else if (kind === "unit") await run(() => deleteUnit(id));
    else if (kind === "lesson") await run(() => deleteLesson(id));
    else if (kind === "task") await run(() => deleteTask(id));
  }

  // ── Sıralama (yuxarı/aşağı) ──
  async function move(
    table: "subjects" | "units" | "lessons" | "tasks",
    ids: string[],
    index: number,
    dir: -1 | 1,
  ) {
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[index], next[j]] = [next[j], next[index]];
    await run(() => reorderLevel(table, next));
  }

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-fg">Admin · Məzmun</h1>
          <div className="flex items-center gap-4">
            <Link href="/admin/istifadeciler" className="text-sm font-semibold text-brand hover:underline">
              İstifadəçilər
            </Link>
            <Link href="/admin/analitika" className="text-sm font-semibold text-brand hover:underline">
              Analitika
            </Link>
            <Link href="/admin/mekteb" className="text-sm font-semibold text-brand hover:underline">
              Məktəb
            </Link>
            <Link href="/admin/muellimler" className="relative text-sm font-semibold text-brand hover:underline">
              Müəllimlər
              {pendingTeachers > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                  {pendingTeachers}
                </span>
              )}
            </Link>
            <Link href="/admin/elan" className="text-sm font-semibold text-brand hover:underline">
              Elanlar
            </Link>
            <Link href="/admin/feedback" className="text-sm font-semibold text-brand hover:underline">
              Rəylər
            </Link>
            <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
              ← Panelə qayıt
            </Link>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mt-3 flex flex-wrap items-center gap-1 text-sm text-muted">
          <button className="hover:text-fg" onClick={() => setSel({})}>
            Fənlər
          </button>
          {subj && (
            <>
              <ChevronRight size={14} />
              <button className="hover:text-fg" onClick={() => setSel({ s: subj.slug })}>
                {subj.icon} {subj.name}
              </button>
            </>
          )}
          {unit && (
            <>
              <ChevronRight size={14} />
              <button className="hover:text-fg" onClick={() => setSel({ s: subj!.slug, u: unit.id })}>
                {unit.title}
              </button>
            </>
          )}
          {lesson && (
            <>
              <ChevronRight size={14} />
              <span className="text-fg">{lesson.title}</span>
            </>
          )}
        </div>

        {err && (
          <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500">
            {err}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {/* LEVEL: Fənlər */}
          {!subj &&
            subjects.map((s, i) => (
              <Row
                key={s.slug}
                title={`${s.icon} ${s.name}`}
                sub={`${s.units.length} bölmə · ${s.grade}-ci sinif`}
                onOpen={() => setSel({ s: s.slug })}
                onEdit={() => setEditing({ kind: "subject", mode: "edit", data: s })}
                onDelete={() => del("subject", s.slug, "Bütün bölmə/dərs/tapşırıqları da silinəcək.")}
                onUp={() => move("subjects", subjects.map((x) => x.slug), i, -1)}
                onDown={() => move("subjects", subjects.map((x) => x.slug), i, 1)}
                first={i === 0}
                last={i === subjects.length - 1}
              />
            ))}
          {!subj && (
            <AddBtn label="Fənn əlavə et" onClick={() => setEditing({ kind: "subject", mode: "new", data: {} })} />
          )}

          {/* LEVEL: Bölmələr */}
          {subj &&
            !unit &&
            subj.units.map((u, i) => (
              <Row
                key={u.id}
                title={u.title}
                sub={`${u.lessons.length} dərs`}
                onOpen={() => setSel({ s: subj.slug, u: u.id })}
                onEdit={() => setEditing({ kind: "unit", mode: "edit", data: u })}
                onDelete={() => del("unit", u.id, "Dərslər və tapşırıqlar da silinəcək.")}
                onUp={() => move("units", subj.units.map((x) => x.id), i, -1)}
                onDown={() => move("units", subj.units.map((x) => x.id), i, 1)}
                first={i === 0}
                last={i === subj.units.length - 1}
              />
            ))}
          {subj && !unit && (
            <AddBtn label="Bölmə əlavə et" onClick={() => setEditing({ kind: "unit", mode: "new", data: {} })} />
          )}

          {/* LEVEL: Dərslər */}
          {unit &&
            !lesson &&
            unit.lessons.map((l, i) => (
              <Row
                key={l.id}
                title={l.title}
                sub={`${l.tasks.length} tapşırıq${l.bonusTasks?.length ? ` + ${l.bonusTasks.length} bonus` : ""}`}
                onOpen={() => setSel({ s: subj!.slug, u: unit.id, l: l.id })}
                onEdit={() => setEditing({ kind: "lesson", mode: "edit", data: lessonToForm(l) })}
                onDelete={() => del("lesson", l.id, "İstifadəçilərin bu dərsdəki proqresi də silinəcək!")}
                onUp={() => move("lessons", unit.lessons.map((x) => x.id), i, -1)}
                onDown={() => move("lessons", unit.lessons.map((x) => x.id), i, 1)}
                first={i === 0}
                last={i === unit.lessons.length - 1}
              />
            ))}
          {unit && !lesson && (
            <AddBtn label="Dərs əlavə et" onClick={() => setEditing({ kind: "lesson", mode: "new", data: {} })} />
          )}

          {/* LEVEL: Tapşırıqlar */}
          {lesson && (
            <>
              {taskList(lesson).map(({ t, bonus }, i, arr) => (
                <Row
                  key={t.id}
                  title={`${bonus ? "★ " : ""}${t.prompt}`}
                  sub={`${t.type} · ${t.xp} XP`}
                  onEdit={() =>
                    setEditing({ kind: "task", mode: "edit", data: taskToForm(t, bonus, lesson) })
                  }
                  onDelete={() => del("task", t.id)}
                  onUp={() => move("tasks", arr.map((x) => x.t.id), i, -1)}
                  onDown={() => move("tasks", arr.map((x) => x.t.id), i, 1)}
                  first={i === 0}
                  last={i === arr.length - 1}
                />
              ))}
              <AddBtn
                label="Tapşırıq əlavə et"
                onClick={() => setEditing({ kind: "task", mode: "new", data: { type: "multiple_choice" } })}
              />
            </>
          )}
        </div>
      </main>

      {/* Redaktə/əlavə formu */}
      {editing && (
        <EditForm
          editing={editing}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSave={(data) => saveEditing(editing, data, { subj, unit, lesson }, run)}
        />
      )}
    </div>
  );
}

// ── Tapşırıq siyahısı (əsas + bonus) ──
function taskList(l: Lesson): { t: Task; bonus: boolean }[] {
  return [
    ...l.tasks.map((t) => ({ t, bonus: false })),
    ...(l.bonusTasks ?? []).map((t) => ({ t, bonus: true })),
  ];
}

/**
 * Dərs formasının düz (flat) forması: `video` obyekti üç ayrı sətir sahəsinə
 * açılır ki, admin panelində sadə input-larla redaktə oluna bilsin. Saxlayanda
 * geri obyektə yığılır (bax upsertLesson çağırışı).
 */
type LessonForm = Omit<Lesson, "video"> & {
  videoSrc?: string;
  videoPoster?: string;
  videoCaptions?: string;
};

function lessonToForm(l: Lesson): Partial<LessonForm> {
  const { video, ...rest } = l;
  return {
    ...rest,
    videoSrc: video?.src ?? "",
    videoPoster: video?.poster ?? "",
    videoCaptions: video?.captions ?? "",
  };
}

function taskToForm(t: Task, bonus: boolean, l: Lesson): Partial<TaskForm> {
  const base: Partial<TaskForm> = {
    id: t.id,
    lesson_id: l.id,
    type: t.type,
    prompt: t.prompt,
    xp: t.xp,
    bonus,
    figure: t.figure,
  };
  if (t.type === "multiple_choice") return { ...base, options: t.options, correctIndex: t.correctIndex };
  if (t.type === "fill_blank") return { ...base, accepted: t.accepted };
  if (t.type === "word_order")
    return { ...base, words: t.words, sentence: t.answer, translation: t.translation };
  if (t.type === "listening")
    return { ...base, audioText: t.audioText, options: t.options, correctIndex: t.correctIndex };
  // Cütlər formada "sol|sağ" sətirləri kimi redaktə olunur — sadə textarea kifayətdir.
  if (t.type === "match_pairs")
    return { ...base, pairsText: t.pairs.map((x) => `${x.left}|${x.right}`).join("\n") };
  return { ...base, answer: t.answer, tolerance: t.tolerance };
}

// ── Saxlama (form → upsert) ──
async function saveEditing(
  editing: NonNullable<Editing>,
  data: Record<string, unknown>,
  ctx: { subj?: Subject; unit?: Unit; lesson?: Lesson },
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => Promise<boolean>,
) {
  const { subj, unit, lesson } = ctx;
  if (editing.kind === "subject") {
    const d = data as Partial<Subject>;
    await run(() =>
      upsertSubject({
        id: (d.slug || "").trim(),
        name: (d.name || "").trim(),
        grade: Number(d.grade) || 5,
        icon: (d.icon || "").trim(),
        color: (d.color || "").trim(),
        sort_order: editing.mode === "edit" ? 0 : 0,
      }),
    );
  } else if (editing.kind === "unit" && subj) {
    const d = data as Partial<Unit>;
    const id = editing.mode === "edit" ? (d.id as string) : genId(`${subj.slug}-u`);
    await run(() =>
      upsertUnit({
        id,
        subject_id: subj.slug,
        title: (d.title || "").trim(),
        description: (d.description || "").trim(),
        sort_order: editing.mode === "edit" ? subj.units.findIndex((u) => u.id === id) : subj.units.length,
      }),
    );
  } else if (editing.kind === "lesson" && unit && subj) {
    const d = data as Partial<LessonForm>;
    const id = editing.mode === "edit" ? (d.id as string) : genId(`${unit.id}-l`);
    await run(() =>
      upsertLesson({
        id,
        unit_id: unit.id,
        title: (d.title || "").trim(),
        intro: (d.intro || "").trim(),
        visual: (d.visual as string) || null,
        sections: (d.sections as RuleSection[])?.length ? (d.sections as RuleSection[]) : null,
        // Video: yalnız ünvan yazılır, qalanı könüllüdür. Ünvan boşdursa dərsdə
        // video yoxdur və giriş ekranında köhnəki kimi şəkil göstərilir.
        video: d.videoSrc?.trim()
          ? {
              src: d.videoSrc.trim(),
              poster: d.videoPoster?.trim() || undefined,
              captions: d.videoCaptions?.trim() || undefined,
            }
          : null,
        sort_order: editing.mode === "edit" ? unit.lessons.findIndex((l) => l.id === id) : unit.lessons.length,
      }),
    );
  } else if (editing.kind === "task" && lesson) {
    const d = data as Partial<TaskForm>;
    const id = editing.mode === "edit" ? (d.id as string) : genId(`${lesson.id}-t`);
    const combined = taskList(lesson);
    const idx = editing.mode === "edit" ? combined.findIndex((x) => x.t.id === id) : combined.length;
    await run(() =>
      upsertTask({
        id,
        lesson_id: lesson.id,
        type: d.type as TaskType,
        prompt: (d.prompt || "").trim(),
        xp: Number(d.xp) || 10,
        bonus: !!d.bonus,
        sort_order: idx < 0 ? combined.length : idx,
        options: d.options,
        correctIndex: d.correctIndex,
        accepted: d.accepted,
        answer: d.answer,
        tolerance: d.tolerance,
        words: d.words,
        sentence: d.sentence,
        translation: d.translation,
        audioText: d.audioText,
        figure: d.figure,
      }),
    );
  }
}

// ── Kiçik UI komponentləri ──
function Row({
  title,
  sub,
  onOpen,
  onEdit,
  onDelete,
  onUp,
  onDown,
  first,
  last,
}: {
  title: string;
  sub: string;
  onOpen?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUp?: () => void;
  onDown?: () => void;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-line bg-panel px-4 py-3">
      {/* Sıralama oxları */}
      <div className="flex flex-col">
        <button
          onClick={onUp}
          disabled={first}
          aria-label="Yuxarı"
          className="text-muted hover:text-fg disabled:opacity-25"
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={onDown}
          disabled={last}
          aria-label="Aşağı"
          className="text-muted hover:text-fg disabled:opacity-25"
        >
          <ChevronDown size={16} />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-fg">{title}</div>
        <div className="text-xs text-muted">{sub}</div>
      </div>
      {onOpen && (
        <button onClick={onOpen} className="rounded-lg px-2 py-1 text-sm font-bold text-brand hover:bg-panel-2">
          Aç
        </button>
      )}
      <button onClick={onEdit} aria-label="Redaktə" className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-fg">
        <Pencil size={16} />
      </button>
      <button onClick={onDelete} aria-label="Sil" className="rounded-lg p-2 text-red-500 hover:bg-red-500/10">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-line px-4 py-3 font-bold text-muted hover:border-brand hover:text-brand"
    >
      <Plus size={18} /> {label}
    </button>
  );
}

// ── Redaktə formu (modal) ──
function EditForm({
  editing,
  busy,
  onCancel,
  onSave,
}: {
  editing: NonNullable<Editing>;
  busy: boolean;
  onCancel: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>({ ...editing.data });
  const [formErr, setFormErr] = useState("");
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const titleMap = { subject: "Fənn", unit: "Bölmə", lesson: "Dərs", task: "Tapşırıq" };

  // Sadə validasiya — boş/yarımçıq məzmun DB-yə getməsin.
  function validate(): string | null {
    const s = (k: string) => String(form[k] ?? "").trim();
    if (editing.kind === "subject") {
      if (editing.mode === "new" && !/^[a-z0-9-]{2,}$/.test(s("slug")))
        return "Slug yalnız kiçik hərf/rəqəm/tire olmalıdır (ən az 2 simvol)";
      if (!s("name")) return "Ad boş ola bilməz";
      if (!s("icon")) return "İkon boş ola bilməz";
    }
    if (editing.kind === "unit" && !s("title")) return "Başlıq boş ola bilməz";
    if (editing.kind === "lesson" && !s("title")) return "Başlıq boş ola bilməz";
    if (editing.kind === "task") {
      if (!s("prompt")) return "Sual boş ola bilməz";
      const type = form.type as TaskType;
      if (type === "multiple_choice") {
        const opts = ((form.options as string[]) ?? []).filter((o) => o.trim());
        if (opts.length < 2) return "Ən azı 2 dolu variant lazımdır";
        const ci = (form.correctIndex as number) ?? 0;
        if (!((form.options as string[]) ?? [])[ci]?.trim()) return "Düzgün variant boş ola bilməz";
      }
      if (type === "fill_blank" && !((form.accepted as string[]) ?? []).length)
        return "Ən azı 1 qəbul olunan cavab lazımdır";
      if (type === "numeric" && form.answer === undefined) return "Cavab rəqəmi lazımdır";
      if (type === "word_order") {
        if (((form.words as string[]) ?? []).filter((w) => w.trim()).length < 2)
          return "Ən azı 2 söz lazımdır";
        if (!((form.sentence as string) ?? "").trim()) return "Düzgün cümlə boş ola bilməz";
      }
      if (type === "match_pairs") {
        const rows = ((form.pairsText as string) ?? "")
          .split("\n")
          .map((l) => l.split("|"))
          .filter((p) => p.length === 2 && p[0].trim() && p[1].trim());
        if (rows.length < 2) return "Ən azı 2 cüt lazımdır ('sol|sağ' formatında)";
        if (rows.length > 5) return "5 cütdən çox olmasın — kiçik ekranda sığmır";
        // Təkrarlanan sağ tərəf tapşırığı həll edilməz edir: eyni cavab iki
        // sola uyğun gəlsə uşaq düzgün cütü seçsə də səhv sayıla bilər.
        const rights = rows.map((p) => p[1].trim());
        if (new Set(rights).size !== rights.length) return "Sağ tərəflər təkrarlanmamalıdır";
      }
      if (type === "listening") {
        if (!((form.audioText as string) ?? "").trim()) return "Səsləndiriləcək mətn lazımdır";
        const opts = ((form.options as string[]) ?? []).filter((o) => o.trim());
        if (opts.length < 2) return "Ən azı 2 dolu variant lazımdır";
        const ci = (form.correctIndex as number) ?? 0;
        if (!((form.options as string[]) ?? [])[ci]?.trim()) return "Düzgün variant boş ola bilməz";
      }
    }
    return null;
  }

  function submit() {
    const e = validate();
    if (e) {
      setFormErr(e);
      return;
    }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onCancel}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-panel p-5 sm:rounded-[12px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-fg">
          {editing.mode === "new" ? "Yeni" : "Redaktə"} · {titleMap[editing.kind]}
        </h2>

        <div className="mt-4 space-y-3">
          {editing.kind === "subject" && (
            <>
              {editing.mode === "new" && (
                <Field label="Slug (id, məs. 'fizika')" value={form.slug} onChange={(v) => set("slug", v)} />
              )}
              <Field label="Ad" value={form.name} onChange={(v) => set("name", v)} />
              <Field label="İkon (emoji)" value={form.icon} onChange={(v) => set("icon", v)} />
              <Field label="Rəng (tailwind ton, məs. 'sky')" value={form.color} onChange={(v) => set("color", v)} />
              <Field label="Sinif" type="number" value={form.grade ?? 5} onChange={(v) => set("grade", v)} />
            </>
          )}

          {editing.kind === "unit" && (
            <>
              <Field label="Başlıq" value={form.title} onChange={(v) => set("title", v)} />
              <Field label="Təsvir" value={form.description} onChange={(v) => set("description", v)} textarea />
            </>
          )}

          {editing.kind === "lesson" && (
            <>
              <Field label="Başlıq" value={form.title} onChange={(v) => set("title", v)} />
              <Field label="Giriş (intro)" value={form.intro} onChange={(v) => set("intro", v)} textarea />
              <Field label="Şəkil açarı (visual, məs. 'place-value')" value={form.visual} onChange={(v) => set("visual", v)} />
              {/* Video — scripts/encode-video.sh çıxardığı ünvanı bura yazırsan.
                  Poster və altyazı könüllüdür. */}
              <Field label="Video ünvanı (məs. /videos/ry1-sayma-l1.mp4)" value={form.videoSrc as string} onChange={(v) => set("videoSrc", v)} />
              <Field label="Poster şəkli (könüllü, məs. /videos/ry1-sayma-l1.jpg)" value={form.videoPoster as string} onChange={(v) => set("videoPoster", v)} />
              <Field label="Altyazı .vtt (könüllü)" value={form.videoCaptions as string} onChange={(v) => set("videoCaptions", v)} />
              <SectionsEditor value={(form.sections as RuleSection[]) ?? []} onChange={(v) => set("sections", v)} />
            </>
          )}

          {editing.kind === "task" && (
            <TaskFields form={form} set={set} />
          )}
        </div>

        {formErr && (
          <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500">
            {formErr}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            disabled={busy}
            onClick={submit}
            className="flex-1 rounded-[10px] bg-brand px-5 py-3 font-semibold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? "..." : "Yadda saxla"}
          </button>
          <button onClick={onCancel} className="rounded-[10px] border border-line px-5 py-3 font-bold text-fg hover:border-brand">
            Ləğv et
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskFields({
  form,
  set,
}: {
  form: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  const type = (form.type as TaskType) ?? "multiple_choice";
  const options = (form.options as string[]) ?? ["", "", "", ""];
  return (
    <>
      <label className="block text-sm font-bold text-fg">Tip</label>
      <select
        value={type}
        onChange={(e) => set("type", e.target.value)}
        className="w-full rounded-md border border-line bg-panel-2 px-3 py-2 text-fg"
      >
        <option value="multiple_choice">Çoxseçimli</option>
        <option value="fill_blank">Boşluq doldurma</option>
        <option value="numeric">Rəqəm</option>
        <option value="listening">Dinləmə (dinlə-seç)</option>
        <option value="word_order">Cümlə quran</option>
        <option value="match_pairs">Cütləri tap</option>
      </select>

      <Field label="Sual (prompt)" value={form.prompt} onChange={(v) => set("prompt", v)} textarea />

      {type === "match_pairs" && (
        <Field
          label="Cütlər — hər sətir 'sol|sağ'. Sətir sırası DÜZGÜN cavabdır (ekranda sağ sütun qarışdırılır)."
          value={(form.pairsText as string) ?? ""}
          onChange={(v) => set("pairsText", v)}
          textarea
        />
      )}

      {type === "listening" && (
        <Field
          label="Səsləndiriləcək İngilis mətni"
          value={(form.audioText as string) ?? ""}
          onChange={(v) => set("audioText", v)}
        />
      )}

      {(type === "multiple_choice" || type === "listening") && (
        <>
          <label className="block text-sm font-bold text-fg">Variantlar (düzgünü seç)</label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={(form.correctIndex ?? 0) === i}
                onChange={() => set("correctIndex", i)}
              />
              <input
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  set("options", next);
                }}
                className="flex-1 rounded-md border border-line bg-panel-2 px-3 py-2 text-fg"
              />
            </div>
          ))}
        </>
      )}

      {type === "fill_blank" && (
        <Field
          label="Qəbul olunan cavablar (vergüllə)"
          value={(form.accepted as string[])?.join(", ") ?? ""}
          onChange={(v) => set("accepted", v.split(",").map((s) => s.trim()).filter(Boolean))}
        />
      )}

      {type === "numeric" && (
        <>
          <Field label="Cavab (rəqəm)" type="number" value={form.answer ?? 0} onChange={(v) => set("answer", Number(v))} />
          <Field label="Tolerans (istəyə bağlı)" type="number" value={form.tolerance ?? ""} onChange={(v) => set("tolerance", v === "" ? undefined : Number(v))} />
        </>
      )}

      {type === "word_order" && (
        <>
          <Field
            label="Sözlər (vergüllə — qarışıq söz bankı)"
            value={(form.words as string[])?.join(", ") ?? ""}
            onChange={(v) => set("words", v.split(",").map((s) => s.trim()).filter(Boolean))}
          />
          <Field
            label="Düzgün cümlə"
            value={(form.sentence as string) ?? ""}
            onChange={(v) => set("sentence", v)}
          />
          <Field
            label="Tərcümə (istəyə bağlı ipucu)"
            value={(form.translation as string) ?? ""}
            onChange={(v) => set("translation", v)}
          />
        </>
      )}

      <Field label="XP" type="number" value={form.xp ?? 10} onChange={(v) => set("xp", Number(v))} />
      <label className="flex items-center gap-2 text-sm font-bold text-fg">
        <input type="checkbox" checked={!!form.bonus} onChange={(e) => set("bonus", e.target.checked)} />
        Bonus tapşırıq
      </label>
    </>
  );
}

function SectionsEditor({
  value,
  onChange,
}: {
  value: RuleSection[];
  onChange: (v: RuleSection[]) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-fg">Qayda bölmələri</label>
      {value.map((s, i) => (
        <div key={i} className="mt-2 space-y-1 rounded-md border border-line p-2">
          <input
            placeholder="Alt başlıq"
            value={s.heading ?? ""}
            onChange={(e) => {
              const n = [...value];
              n[i] = { ...n[i], heading: e.target.value };
              onChange(n);
            }}
            className="w-full rounded-lg border border-line bg-panel-2 px-2 py-1 text-sm text-fg"
          />
          <textarea
            placeholder="Mətn"
            value={s.body}
            onChange={(e) => {
              const n = [...value];
              n[i] = { ...n[i], body: e.target.value };
              onChange(n);
            }}
            className="w-full rounded-lg border border-line bg-panel-2 px-2 py-1 text-sm text-fg"
          />
          <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-xs text-red-500">
            Bölməni sil
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...value, { heading: "", body: "" }])}
        className="mt-2 text-sm font-bold text-brand"
      >
        + Bölmə əlavə et
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  textarea = false,
}: {
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-fg">{label}</label>
      {textarea ? (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-panel-2 px-3 py-2 text-fg"
        />
      ) : (
        <input
          type={type}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-panel-2 px-3 py-2 text-fg"
        />
      )}
    </div>
  );
}
