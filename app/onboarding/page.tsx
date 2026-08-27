"use client";

// Onboarding — Duolingo modeli: şagird ƏVVƏL sınayır, SONRA qeydiyyatdan keçir.
// Ona görə bu səhifə GİRİŞ TƏLƏB ETMİR: cavablar brauzerdə (lib/guest.ts) saxlanılır
// və hesab yaradılanda köçürülür. Giriş etmiş istifadəçi buraya düşsə, cavablar
// eyni zamanda user_metadata-ya da yazılır.
//
// Skript: sinif → Zefi salamı → nə bacaracaqsan → gündəlik məqsəd → mənbə →
// başlanğıc nöqtəsi → ilk dərs.
//
// Addım sayı 12-dən 6-ya salınıb. Çıxarılanlar və səbəbi:
//   • "start" — "hello" ilə eyni şeyi deyirdi (iki ardıcıl salam ekranı).
//   • "reason", "level" — cavabları heç yerdə oxunmurdu; "level" özü-özünü
//     qiymətləndirmə idi, dərhal sonrakı "placement" testi onu onsuz da ölçür.
//   • "motivate1/2" — məhz ilk dərsdən əvvəl, dəyərə çatmağa iki toxunuş qalmış.
//   • "notify" — brauzerin BİRDƏFƏLİK icazə pəncərəsini yandırırdı, üstəlik
//     lib/push.ts abunəliyini yaratmırdı (yəni icazə alınsa da bildiriş getmirdi).
//     Real abunəlik Ayarlardakı keçiddədir; istifadəçi dəyəri görməmiş soruşmuruq.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, BookOpen, Flame } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import Logo from "@/components/Logo";
import { GRADES_WITH_CONTENT, gradeLabel } from "@/lib/grade";
import { useContent } from "@/components/ContentProvider";
import { getGuest, setGuest } from "@/lib/guest";
import { ZefiSay, QuestionScreen, ChoiceButton, ContinueBar } from "@/components/onboarding/Screens";
import Diagnostic, {
  type DiagnosticItem,
  type DiagnosticResult,
} from "@/components/onboarding/Diagnostic";
import { completeLesson } from "@/lib/progress";
import { addWrong } from "@/lib/srs";
import type { Subject, Task } from "@/lib/types";

type Option = { value: string | number; label: string; note?: string };
type StepKey = "grade" | "hello" | "achieve" | "goal" | "source" | "placement";

// Sual addımları (dialoq ekranlarının variantı yoxdur).
const QUESTIONS: Partial<Record<StepKey, { q: string; options: Option[] }>> = {
  grade: {
    q: "Neçənci sinifdə oxuyursan?",
    options: GRADES_WITH_CONTENT.map((g) => ({ value: g, label: gradeLabel(g) })),
  },
  source: {
    q: "Imparo haqqında haradan eşitdin?",
    options: [
      { value: "google", label: "Google axtarışı" },
      { value: "instagram", label: "Instagram / Facebook" },
      { value: "tiktok", label: "TikTok" },
      { value: "youtube", label: "YouTube" },
      { value: "dost", label: "Dost və ya ailə" },
      { value: "muellim", label: "Müəllimimdən" },
      { value: "xeber", label: "Xəbər, məqalə və ya bloq" },
      { value: "diger", label: "Digər" },
    ],
  },
  goal: {
    q: "Gündəlik məqsədin nədir?",
    options: [
      { value: 5, label: "Rahat", note: "5 dəq / gün" },
      { value: 10, label: "Normal", note: "10 dəq / gün" },
      { value: 15, label: "Ciddi", note: "15 dəq / gün" },
      { value: 20, label: "İntensiv", note: "20 dəq / gün" },
    ],
  },
  placement: {
    q: "Haradan başlayaq?",
    options: [
      { value: "scratch", label: "Sıfırdan başla", note: "ən asan dərs" },
      { value: "test", label: "Səviyyəmi tap", note: "qısa test" },
    ],
  },
};

// Diaqnostik nümunə sualları — fokus fənnin ilk dərslərindən (bax köhnə versiya).
function buildDiagnosticItems(subjects: Subject[], grade: number, focus: string): DiagnosticItem[] {
  const gradeSubjects = subjects.filter((s) => s.grade === grade);
  const repTask = (tasks: Task[]) => tasks.find((t) => t.type === "multiple_choice") ?? tasks[0];
  const lessonsOf = (s: Subject) => s.units.flatMap((u) => u.lessons).filter((l) => (l.kind ?? "lesson") === "lesson");
  const items: DiagnosticItem[] = [];
  const pushFrom = (s: Subject | undefined, n: number) => {
    if (!s) return;
    for (const lesson of lessonsOf(s).slice(0, n)) {
      const task = repTask(lesson.tasks);
      if (task) items.push({ task, lessonId: lesson.id });
    }
  };
  if (focus && focus !== "hamisi") pushFrom(gradeSubjects.find((s) => s.slug.startsWith(focus)), 6);
  else for (const s of gradeSubjects.slice(0, 3)) pushFrom(s, 2);
  return items.slice(0, 6);
}

// Sıra qəsdən belədir: "grade" ilk gəlir ki, qalan hər şey konkretləşsin;
// "source" (marketinq sualı, şagirdə faydası yoxdur) məqsəd seçildikdən sonraya
// qoyulub; "placement" sonuncudur və birbaşa ilk dərsə açılır.
const ORDER: StepKey[] = ["grade", "hello", "achieve", "goal", "source", "placement"];

export default function OnboardingPage() {
  const router = useRouter();
  const { subjects } = useContent();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [busy, setBusy] = useState(false);
  const [diag, setDiag] = useState<DiagnosticItem[] | null>(null);

  const key = ORDER[i];
  const question = QUESTIONS[key];
  const selected = question ? answers[key] : undefined;

  // Artıq onboarding keçmiş istifadəçini burada saxlamağın mənası yoxdur.
  // (Cavablar hər seçimdə qonaq anbarına yazılır — səhifə yenilənsə suallar
  // təzədən başlayır, amma heç bir cavab itmir.)
  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u?.user_metadata?.onboarded) router.replace("/dashboard");
    });
  }, [router]);

  // Şagirdin sinfinə uyğun ilk dərs — onboarding-in sonunda ora keçirik.
  const firstLesson = useMemo(() => {
    const grade = Number(answers.grade ?? getGuest().grade ?? 5);
    const pool = subjects.filter((s) => s.grade === grade);
    const subject = pool[0];
    if (!subject) return null;
    const lesson = subject.units
      .flatMap((u) => u.lessons)
      .find((l) => (l.kind ?? "lesson") === "lesson");
    return lesson ? { slug: subject.slug, id: lesson.id } : null;
  }, [subjects, answers.grade]);

  const progress = Math.round(((i + (question ? (selected != null ? 1 : 0) : 1)) / ORDER.length) * 100);

  function choose(v: string | number) {
    setAnswers((a) => ({ ...a, [key]: v }));
    setGuest({ [key]: v } as Record<string, never>);
  }

  async function finish() {
    setBusy(true);
    setGuest({ ...answers } as Record<string, never>);
    track("onboarding_completed", answers);
    // Giriş etmiş istifadəçi varsa cavabları hesabına da yaz.
    const u = await getCurrentUser().catch(() => null);
    if (u) {
      await createClient()
        .auth.updateUser({ data: { ...answers, onboarded: true } })
        .catch(() => {});
    }
    if (firstLesson) router.replace(`/lessons/${firstLesson.id}?onboarding=1`);
    else router.replace("/dashboard");
  }

  function next() {
    if (question && selected == null) return;
    // "Səviyyəmi tap" seçilibsə, ilk dərsdən əvvəl qısa diaqnostika.
    if (key === "placement" && selected === "test") {
      const items = buildDiagnosticItems(subjects, Number(answers.grade ?? 5), "");
      if (items.length) {
        setDiag(items);
        return;
      }
    }
    if (i < ORDER.length - 1) {
      // Onboarding 6 addımdır və bir vaxtlar yalnız SONU ölçülürdü: 3-cü addımda
      // çıxan istifadəçi haqqında heç nə bilmirdik. Addım adı ilə bir hadisə
      // ayrı-ayrı hadisələrdən yaxşıdır — funnel eyni cür qurulur, ad şişmir.
      const nextKey = ORDER[i + 1];
      track("onboarding_step", { step: nextKey, index: i + 1, total: ORDER.length });
      setI((s) => s + 1);
    } else void finish();
  }

  async function onDiagnostic(r: DiagnosticResult) {
    setBusy(true);
    try {
      // Giriş etmiş istifadəçi üçün dərhal serverə yazırıq; qonaq üçün nəticə
      // saxlanılır və qeydiyyat anında hesaba köçürülür (bax app/signup).
      const u = await getCurrentUser().catch(() => null);
      if (u) {
        for (const id of r.knownLessonIds) await completeLesson(id, false).catch(() => {});
        for (const t of r.wrongTaskIds) await addWrong(t).catch(() => {});
      } else {
        setGuest({ knownLessons: r.knownLessonIds, wrongTasks: r.wrongTaskIds });
      }
      track("diagnostic_completed", { known: r.knownLessonIds.length });
    } finally {
      // "placement" sonuncu addımdır — diaqnostika bitəndə birbaşa ilk dərsə.
      // setDiag(null) QƏSDƏN çağırılmır: diaqnostika ekranı router keçidinə qədər
      // ekranda qalsın, yoxsa artıq cavablanmış "Haradan başlayaq?" sualı bir an
      // yenidən görünür. busy də true qalır — ikiqat toxunuş bloklanır.
      void finish();
    }
  }

  if (diag) return <Diagnostic items={diag} onFinish={onDiagnostic} />;

  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="mx-auto flex w-full max-w-xl items-center gap-4 px-5 py-5">
        <button
          type="button"
          onClick={() => setI((s) => Math.max(0, s - 1))}
          disabled={i === 0}
          aria-label="Geri"
          className="text-2xl font-bold text-muted transition hover:text-fg disabled:opacity-0"
        >
          ←
        </button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-panel-2">
          <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <Logo size={28} />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-8">
        {question && (
          <QuestionScreen question={question.q}>
            {question.options.map((o) => (
              <ChoiceButton
                key={String(o.value)}
                label={o.label}
                note={o.note}
                selected={selected === o.value}
                onClick={() => choose(o.value)}
              />
            ))}
          </QuestionScreen>
        )}

        {key === "hello" && <ZefiSay mood="wave" text={<>Salam! Mən <span className="text-brand">Zefi</span>yəm 👋</>} />}

        {key === "achieve" && <AchieveScreen />}

        <ContinueBar
          onClick={next}
          disabled={busy || (!!question && selected == null)}
          label={busy ? "Hazırlanır..." : "Davam et"}
        />
      </main>
    </div>
  );
}

// ── "Bunları bacaracaqsan" ─────────────────────────────────────────────────────
const ACHIEVE = [
  { icon: MessageCircle, title: "Özünə güvənlə cavab ver", body: "Stressiz məşqlərlə addım-addım irəlilə" },
  { icon: BookOpen, title: "Güclü bilik bazası qur", body: "Məktəb proqramına uyğun mövzular və tapşırıqlar" },
  { icon: Flame, title: "Vərdiş yarat", body: "Xatırlatmalar, seriya və gündəlik hədəflər" },
];

function AchieveScreen() {
  return (
    <div className="flex flex-1 flex-col justify-center py-6">
      <h1 className="text-center text-2xl font-extrabold text-fg sm:text-3xl">Bunları bacaracaqsan!</h1>
      <div className="mt-8 flex flex-col gap-4">
        {ACHIEVE.map((a, n) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 * n }}
            className="flex items-start gap-4 rounded-2xl border-2 border-line bg-panel px-5 py-4"
          >
            <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand">
              <a.icon size={22} strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-lg font-extrabold text-fg">{a.title}</span>
              <span className="block text-sm text-muted">{a.body}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
