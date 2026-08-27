"use client";

// Imparo Məktəb — hub. Şagird: kodla sinfə qoşulur + tapşırıqlarını görür.
// Müəllim: panelə keçir. (Duolingo for Schools məntiqi, AZ 1–8 kurikuluma uyğun.)

import { useEffect, useState } from "react";
import Link from "next/link";
import { School, KeyRound, ClipboardList, ChevronRight, Check, Clock } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  studentClasses,
  myAssignments,
  joinClass,
  type StudentClass,
  type MyAssignment,
} from "@/lib/schools";
import { PageSkeleton } from "@/components/Skeleton";
import Mascot from "@/components/Mascot";

export default function SchoolPage() {
  const { user, ready } = useAuthUser();
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [tasks, setTasks] = useState<MyAssignment[]>([]);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  function refresh() {
    Promise.all([studentClasses(), myAssignments()])
      .then(([c, a]) => {
        setClasses(c);
        setTasks(a);
      })
      .finally(() => setLoaded(true));
  }
  useEffect(() => {
    if (user) refresh();
  }, [user]);

  async function join() {
    const c = code.trim();
    if (!c || joining) return;
    setJoining(true);
    setMsg(null);
    const res = await joinClass(c).catch(() => null);
    if (res) {
      setMsg({ ok: true, text: `"${res.name}" sinfinə qoşuldun!` });
      setCode("");
      refresh();
    } else {
      setMsg({ ok: false, text: "Belə kod tapılmadı. Yenidən yoxla." });
    }
    setJoining(false);
  }

  if (!ready || (user && !loaded)) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Hero */}
        <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-lg">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm">
            <Mascot size={64} mood="happy" disk={false} />
          </span>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/80">
              <School size={14} /> Imparo Məktəb
            </div>
            <h1 className="mt-1 text-2xl font-extrabold">Sinifdə birlikdə öyrən</h1>
          </div>
        </div>

        {/* Müəllim keçidi */}
        <Link
          href="/mekteb/muellim"
          className="mt-5 flex items-center gap-4 rounded-2xl border border-line bg-panel p-5 transition hover:bg-panel-2"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <ClipboardList size={24} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-extrabold text-fg">Müəlliməm</span>
            <span className="block text-sm text-muted">Sinif yarat, tapşırıq ver, nəticələrə bax</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-muted" />
        </Link>

        {/* Kodla qoşul */}
        <div className="mt-4 rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-center gap-2 font-extrabold text-fg">
            <KeyRound size={18} className="text-brand" /> Sinfə qoşul
          </div>
          <p className="mt-1 text-sm text-muted">Müəllimin verdiyi sinif kodunu daxil et.</p>
          <div className="mt-3 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="MƏS: AZ1234"
              maxLength={6}
              className="flex-1 rounded-2xl border-2 border-line bg-ink px-4 py-2.5 font-bold uppercase tracking-widest text-fg outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={join}
              disabled={joining || !code.trim()}
              className="rounded-2xl bg-brand px-5 py-2.5 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-50"
            >
              Qoşul
            </button>
          </div>
          {msg && (
            <p className={`mt-2 text-sm font-bold ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>
              {msg.text}
            </p>
          )}
        </div>

        {/* Mənim siniflərim */}
        {classes.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Siniflərim</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {classes.map((c) => (
                <span key={c.id} className="rounded-2xl border border-line bg-panel px-4 py-2 text-sm font-bold text-fg">
                  {c.name} · {c.teacher}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mənim tapşırıqlarım */}
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Tapşırıqlarım</h2>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Hələ tapşırıq yoxdur.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {tasks.map((a) => (
                <Link
                  key={a.id}
                  href={`/lessons/${a.lesson_id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-4 transition hover:bg-panel-2"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      a.done ? "bg-emerald-500 text-white" : "bg-brand/10 text-brand"
                    }`}
                  >
                    {a.done ? <Check size={20} strokeWidth={3} /> : <ClipboardList size={20} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-fg">{a.title}</span>
                    <span className="block text-xs text-muted">{a.class_name}</span>
                  </span>
                  {a.due_date && !a.done && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-orange-500">
                      <Clock size={13} /> {a.due_date}
                    </span>
                  )}
                  {a.done && <span className="shrink-0 text-xs font-bold text-emerald-600">Bitdi</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
