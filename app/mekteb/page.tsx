"use client";

// Imparo Məktəb — hub. Şagird: kodla sinfə qoşulur + tapşırıqlarını görür.
// Müəllim: panelə keçir. (Duolingo for Schools məntiqi, AZ 1–8 kurikuluma uyğun.)
//
// Girişsiz ziyarətçi login divarına ATILMIR: bu ünvan sitemap-dadır və footer-dən
// gəlinir — məhsulu tanımayan müəllim birbaşa login görüb gedirdi. Ona iki yol
// göstərilir: müəllim → /muellimler tanıtımı, şagird → giriş + kodla qoşulma.
//
// Sinif hesabı (müəllimin yaratdığı, sinif kodu + PIN ilə girən 1–4-cü sinif
// şagirdi): "Müəlliməm" və "Sinfə qoşul" kartları GÖRÜNMÜR — uşaq yalnız öz sinfini,
// müəllimin tapşırıqlarını və videolarını görür.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  School,
  KeyRound,
  ClipboardList,
  ChevronRight,
  Check,
  Clock,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { isManagedAccount } from "@/lib/managedStudents";
import { gradeLabel } from "@/lib/grade";
import {
  studentClasses,
  myAssignments,
  joinClass,
  type StudentClass,
  type MyAssignment,
} from "@/lib/schools";
import { PageSkeleton } from "@/components/Skeleton";
import ClassVideos from "@/components/mekteb/ClassVideos";
import Mascot from "@/components/Mascot";
import SubjectBadge from "@/components/SubjectBadge";
import { azShortDate } from "@/lib/azDate";

const CARD = "rounded-2xl border-2 border-line bg-card shadow-[0_4px_0_0_var(--color-line)]";

export default function SchoolPage() {
  const { user, ready } = useAuthUser({ optional: true });
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
  if (!user) return <PublicSchool />;

  const managed = isManagedAccount(user);
  const open = tasks.filter((a) => !a.done).length;

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Hero subtitle={open > 0 ? `${open} tapşırıq səni gözləyir` : undefined} />

        {!managed && (
          <>
            {/* Müəllim keçidi */}
            <LinkCard
              href="/mekteb/muellim"
              Icon={ClipboardList}
              tile="bg-violet-500/12 text-violet-600 dark:text-violet-300"
              title="Müəlliməm"
              body="Sinif yarat, tapşırıq ver, nəticələrə bax"
              className="mt-5"
            />

            {/* Kodla qoşul */}
            <div className={`mt-4 p-5 ${CARD}`}>
              <div className="flex items-center gap-3">
                <Tile Icon={KeyRound} tile="bg-brand/12 text-brand" />
                <div className="min-w-0">
                  <div className="font-extrabold text-fg">Sinfə qoşul</div>
                  <p className="text-sm text-muted">Müəllimin verdiyi sinif kodunu daxil et.</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="MƏS: AZ1234"
                  maxLength={6}
                  aria-label="Sinif kodu"
                  className="min-w-0 flex-1 rounded-2xl border-2 border-line bg-panel px-4 py-2.5 font-bold uppercase tracking-widest text-fg outline-none placeholder:tracking-normal placeholder:text-muted/70 focus:border-brand"
                />
                <button
                  type="button"
                  onClick={join}
                  disabled={joining || !code.trim()}
                  className="shrink-0 rounded-2xl bg-brand px-5 py-2.5 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark disabled:opacity-50"
                >
                  Qoşul
                </button>
              </div>
              {msg && (
                <p
                  className={`mt-3 rounded-xl px-3.5 py-2 text-sm font-bold ${
                    msg.ok ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {msg.text}
                </p>
              )}
            </div>
          </>
        )}

        {/* Mənim siniflərim */}
        {classes.length > 0 && (
          <>
            <SectionTitle>{managed ? "Sinfim" : "Siniflərim"}</SectionTitle>
            <div className={`overflow-hidden ${CARD}`}>
              {classes.map((c, i) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i < classes.length - 1 ? "border-b border-line" : ""}`}
                >
                  <SubjectBadge slug={c.subject_slug} fallback="📚" size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold text-fg">{c.name}</div>
                    <div className="truncate text-sm text-muted">{c.teacher}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-panel-2 px-2.5 py-1 text-xs font-extrabold text-muted">
                    {gradeLabel(c.grade)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Mənim tapşırıqlarım */}
        <SectionTitle>Tapşırıqlarım</SectionTitle>
        {tasks.length === 0 ? (
          <div className={`flex items-center gap-3 p-4 ${CARD}`}>
            <Tile Icon={ClipboardList} tile="bg-panel-2 text-muted" />
            <p className="text-sm font-semibold text-muted">
              Hələ tapşırıq yoxdur. Müəllim tapşırıq verəndə burada görünəcək.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((a) => (
              <Link
                key={a.id}
                href={`/lessons/${a.lesson_id}`}
                className={`flex items-center gap-3.5 p-4 transition hover:border-brand/60 ${CARD}`}
              >
                <span
                  className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    a.done ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : "bg-brand/12 text-brand"
                  }`}
                >
                  <ClipboardList size={24} strokeWidth={2.4} />
                  {a.done && (
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-card">
                      <Check size={12} strokeWidth={3.5} />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 font-extrabold leading-snug text-fg">{a.title}</span>
                  <span className="block truncate text-xs text-muted">{a.class_name}</span>
                </span>
                {a.done ? (
                  <span className="shrink-0 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    Bitdi
                  </span>
                ) : a.due_date ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-orange-500/12 px-2.5 py-1 text-xs font-extrabold text-orange-600 dark:text-orange-300">
                    <Clock size={12} strokeWidth={2.6} /> {azShortDate(a.due_date)}
                  </span>
                ) : (
                  <ChevronRight size={18} className="shrink-0 text-muted" />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Sinfimin video dərsləri — müəllimin yüklədikləri (0056).
            Hər sinif üçün ayrıca blok: şagird bir neçə sinifdə ola bilər. */}
        {classes.map((c) => (
          <div key={`v-${c.id}`}>
            {classes.length > 1 && <SectionTitle>{c.name}</SectionTitle>}
            <ClassVideos classId={c.id} />
          </div>
        ))}
      </main>
    </div>
  );
}

function Hero({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-[0_5px_0_0_#b4461a] sm:p-6">
      <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/95 shadow-sm">
        <Mascot size={64} mood="happy" disk={false} />
      </span>
      <div className="min-w-0">
        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/85">
          <School size={14} /> Imparo Məktəb
        </div>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight">Sinifdə birlikdə öyrən</h1>
        {subtitle && (
          <div className="mt-2 inline-flex max-w-full items-center rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
            <span className="truncate">{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-7 px-1 text-xs font-extrabold uppercase tracking-wide text-muted">{children}</h2>;
}

function Tile({ Icon, tile }: { Icon: LucideIcon; tile: string }) {
  return (
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tile}`}>
      <Icon size={24} strokeWidth={2.4} />
    </span>
  );
}

function LinkCard({
  href,
  Icon,
  tile,
  title,
  body,
  className = "",
}: {
  href: string;
  Icon: LucideIcon;
  tile: string;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`flex items-center gap-4 p-5 transition hover:border-brand/60 ${CARD} ${className}`}>
      <Tile Icon={Icon} tile={tile} />
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold text-fg">{title}</span>
        <span className="block text-sm text-muted">{body}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </Link>
  );
}

// Girişsiz ziyarətçi üçün — iki aydın yol, login divarı yox.
function PublicSchool() {
  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Hero />

        <LinkCard
          href="/muellimler"
          Icon={GraduationCap}
          tile="bg-violet-500/12 text-violet-600 dark:text-violet-300"
          title="Müəllimsiniz?"
          body="Sinif yaradın, tapşırıq verin, sinfin harada ilişdiyini görün — pulsuz"
          className="mt-5"
        />

        <LinkCard
          href="/sinif"
          Icon={KeyRound}
          tile="bg-brand/12 text-brand"
          title="Müəllimin sinif kodu var?"
          body="Kodu, adını və PIN-i yaz — e-poçt lazım deyil"
          className="mt-4"
        />

        <p className="mt-6 text-center text-sm text-muted">
          Hesabın yoxdur?{" "}
          <Link href="/onboarding" className="font-bold text-brand hover:underline">
            Əvvəl pulsuz sına
          </Link>
        </p>
      </main>
    </div>
  );
}
