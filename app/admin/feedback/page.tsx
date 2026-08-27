"use client";

// Admin · Rəylər — istifadəçilərin sualla bağlı göndərdiyi rəylər (task_feedback).
// Yalnız is_admin() girə bilir. Rəyi "həll olundu" işarələ və ya sil.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Trash2 } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { checkIsAdmin } from "@/lib/adminApi";
import { createClient } from "@/lib/supabase/client";
import { FEEDBACK_LABELS, type FeedbackCategory } from "@/lib/feedback";
import { useContent } from "@/components/ContentProvider";
import type { Subject, Task } from "@/lib/types";
import { PageSkeleton } from "@/components/Skeleton";

// task_id-yə görə sualı və yerini (fənn/bölmə/dərs) tap.
function findTaskInfo(subjects: Subject[], taskId: string) {
  for (const s of subjects)
    for (const u of s.units)
      for (const l of u.lessons) {
        const task = [...l.tasks, ...(l.bonusTasks ?? [])].find((x) => x.id === taskId);
        if (task) return { task, subject: s, unit: u, lesson: l };
      }
  return undefined;
}

// Rəydəki sualın mətni + variantları + düz cavabı + yeri.
function TaskDetail({ subjects, taskId }: { subjects: Subject[]; taskId: string }) {
  const info = findTaskInfo(subjects, taskId);
  if (!info) {
    return (
      <div className="mt-2 rounded-md border border-dashed border-line bg-panel-2 px-3 py-2 text-xs text-muted">
        Sual məzmunda tapılmadı (silinmiş və ya köhnə id).
      </div>
    );
  }
  const { task, subject, unit, lesson } = info;
  return (
    <div className="mt-2 rounded-md border border-line bg-panel-2 px-3 py-2.5">
      <div className="text-[11px] font-semibold text-muted">
        {subject.name} · {unit.title} · {lesson.title}
      </div>
      <p className="mt-1 text-sm font-bold text-fg">{task.prompt}</p>
      <TaskAnswer task={task} />
    </div>
  );
}

function TaskAnswer({ task }: { task: Task }) {
  if (task.type === "multiple_choice" || task.type === "listening") {
    return (
      <div className="mt-1.5 space-y-0.5">
        {task.type === "listening" && (
          <div className="text-xs italic text-muted">🔊 “{task.audioText}”</div>
        )}
        {task.options.map((o, i) => (
          <div
            key={i}
            className={`text-xs ${i === task.correctIndex ? "font-bold text-emerald-600" : "text-muted"}`}
          >
            {i === task.correctIndex ? "✓ " : "• "}
            {o}
          </div>
        ))}
      </div>
    );
  }
  const answer =
    task.type === "fill_blank"
      ? task.accepted.join(" / ")
      : task.type === "numeric"
        ? String(task.answer)
        : task.type === "word_order"
          ? task.answer
          : "";
  return <div className="mt-1.5 text-xs font-bold text-emerald-600">Cavab: {answer}</div>;
}

interface FeedbackRow {
  id: string;
  task_id: string;
  category: string;
  message: string | null;
  resolved: boolean;
  created_at: string;
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const { subjects } = useContent();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<FeedbackRow[] | undefined>(undefined);
  const [showResolved, setShowResolved] = useState(false);

  async function fetchRows(): Promise<FeedbackRow[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from("task_feedback")
      .select("*")
      .order("created_at", { ascending: false });
    return (data as FeedbackRow[]) ?? [];
  }

  useEffect(() => {
    if (user) checkIsAdmin().then(setIsAdmin);
  }, [user]);
  useEffect(() => {
    if (isAdmin === false) router.replace("/dashboard");
  }, [isAdmin, router]);
  useEffect(() => {
    if (isAdmin === true) fetchRows().then(setRows);
  }, [isAdmin]);

  async function markResolved(id: string, resolved: boolean) {
    const supabase = createClient();
    await supabase.from("task_feedback").update({ resolved }).eq("id", id);
    setRows((r) => r?.map((x) => (x.id === id ? { ...x, resolved } : x)));
  }

  async function remove(id: string) {
    if (!confirm("Bu rəy silinsin?")) return;
    const supabase = createClient();
    await supabase.from("task_feedback").delete().eq("id", id);
    setRows((r) => r?.filter((x) => x.id !== id));
  }

  if (!ready || !user || isAdmin !== true || rows === undefined) return <PageSkeleton />;

  const visible = showResolved ? rows : rows.filter((r) => !r.resolved);
  const openCount = rows.filter((r) => !r.resolved).length;

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-fg">Admin · Rəylər</h1>
          <div className="flex gap-3 text-sm text-muted">
            <Link href="/admin/analitika" className="hover:text-fg">Analitika</Link>
            <Link href="/admin" className="hover:text-fg">Məzmun</Link>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted">
            {openCount} həll olunmamış · {rows.length} ümumi
          </span>
          <button
            onClick={() => setShowResolved((v) => !v)}
            className="text-sm font-semibold text-brand hover:underline"
          >
            {showResolved ? "Yalnız açıqları göstər" : "Hamısını göstər"}
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="mt-10 text-center text-muted">Hələ rəy yoxdur.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {visible.map((r) => (
              <div
                key={r.id}
                className={`rounded-[10px] border px-4 py-3 ${
                  r.resolved ? "border-line bg-panel opacity-60" : "border-line bg-panel"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-bold text-brand-soft">
                        {FEEDBACK_LABELS[r.category as FeedbackCategory] ?? r.category}
                      </span>
                      <span className="font-mono text-xs text-muted">{r.task_id}</span>
                    </div>
                    <TaskDetail subjects={subjects} taskId={r.task_id} />
                    {r.message && (
                      <p className="mt-1.5 text-sm text-fg">
                        <span className="text-muted">İstifadəçi qeydi: </span>
                        {r.message}
                      </p>
                    )}
                    <div className="mt-1 text-xs text-muted">
                      {new Date(r.created_at).toLocaleString("az-AZ")}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => markResolved(r.id, !r.resolved)}
                      title={r.resolved ? "Açıq et" : "Həll olundu"}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                        r.resolved
                          ? "text-muted hover:bg-panel-2"
                          : "text-emerald-600 hover:bg-emerald-500/10"
                      }`}
                    >
                      <Check size={18} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      title="Sil"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
