"use client";

// Dərs səhifəsi (immersiv, sidebar-sız): giriş (Zefi + balon + qaydalar) → tapşırıqlar.

import { use, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { notFound, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useContent } from "@/components/ContentProvider";
import ChestModal from "@/components/ChestModal";
import { completeLesson } from "@/lib/progress";
import { useRouter } from "next/navigation";
import type { ChestReward } from "@/lib/quests";
import { useAuthUser } from "@/lib/useAuthUser";
import { useT } from "@/lib/i18n";
import LessonRunner from "@/components/lesson/LessonRunner";
import QuitDialog from "@/components/lesson/QuitDialog";
import LessonVisual from "@/components/LessonVisual";
import Mascot from "@/components/Mascot";
import SpeechBubble from "@/components/SpeechBubble";
import { PageSkeleton } from "@/components/Skeleton";

export default function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  // Onboarding-də ilk dərs HESABSIZ oynanır (Duolingo modeli: əvvəl sına, sonra
  // qeydiyyat). Yalnız bu halda auth qapısı açılır — qalan bütün dərslər girişlidir.
  const onboarding = useSearchParams().get("onboarding") === "1";
  const { user, ready } = useAuthUser({ optional: onboarding });
  const guest = onboarding && !user;
  const { getLesson, orderedLessonIds, loading } = useContent();
  const [started, setStarted] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const t = useT();

  const found = getLesson(id);

  // DB hələ yüklənirsə (seed-də olmayan yeni dərs ola bilər) 404 vermə, gözlə.
  if (!found && loading) return <PageSkeleton />;
  if (!found) notFound();
  if (!ready) return <PageSkeleton />;
  if (!user && !guest) return <PageSkeleton />;

  const { subject, lesson } = found;
  const index = orderedLessonIds(subject.slug).indexOf(lesson.id);
  const bonusCount = lesson.bonusTasks?.length ?? 0;

  // Bölmə sandığı — tapşırıq yoxdur: açılanda zümrüd verilir (server hesablayır, bax 0041).
  if (lesson.kind === "chest") {
    return (
      <div className="min-h-screen bg-ink">
        <ChestModal
          onOpen={async (): Promise<ChestReward> => {
            const r = await completeLesson(lesson.id).catch(() => ({ xp: 0, gems: 0 }));
            return { kind: "gems", amount: r.gems };
          }}
          onClose={() => router.push(`/subjects/${subject.slug}${guest ? "?onboarding=1" : ""}`)}
          titleKey="chest.unitTitle"
          subtitleKey="chest.unitReady"
        />
      </div>
    );
  }

  if (started) {
    return (
      <LessonRunner
        slug={subject.slug}
        lesson={lesson}
        userId={user?.id ?? "guest"}
        guest={guest}
      />
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-28 pt-5">
        {/* Yuxarı: çıxış — dərsin İÇİNDƏKİ X kimi təsdiq soruşur.
            Dərsin hər yerində çıxış eyni davranmalıdır. */}
        <button
          type="button"
          onClick={() => setQuitOpen(true)}
          aria-label={t("run.quitLeave")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-panel-2 hover:text-fg"
        >
          <X size={26} />
        </button>

        <AnimatePresence>
          {quitOpen && (
            <QuitDialog
              answered={0}
              total={lesson.tasks.length}
              onStay={() => setQuitOpen(false)}
              onLeave={() =>
                router.push(`/subjects/${subject.slug}${guest ? "?onboarding=1" : ""}`)
              }
            />
          )}
        </AnimatePresence>

        {/* Zefi + danışıq balonu */}
        <div className="mt-4 flex items-end gap-3">
          <Mascot size={92} />
          <SpeechBubble className="mb-2 flex-1 font-semibold" tail="left">
            {lesson.intro}
          </SpeechBubble>
        </div>

        <div className="mt-2 text-sm font-bold uppercase tracking-wide text-brand">
          {t(`subject.${subject.slug}`)} · {t("run.task")} {index + 1}
        </div>
        <h1 className="mt-1 text-3xl font-bold text-fg">{lesson.title}</h1>

        {/* Şəkil */}
        <LessonVisual visual={lesson.visual} />

        {/* Qaydalar — dostyana kartlar */}
        {lesson.sections && lesson.sections.length > 0 && (
          <div className="mt-6 space-y-3">
            {lesson.sections.map((s, i) => (
              <div key={i} className="card-pop p-4">
                {s.heading && (
                  <h3 className="font-bold text-brand-soft">{s.heading}</h3>
                )}
                <p className="mt-1 leading-relaxed text-fg">{s.body}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-panel-2 px-4 py-2 text-sm font-bold text-muted">
          {lesson.tasks.length} {t("run.task").toLowerCase()}
          {bonusCount > 0 && (
            <span className="text-accent">+ {bonusCount} bonus</span>
          )}
        </div>
      </div>

      {/* Aşağı sabit BAŞLA çubuğu */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-panel">
        <div className="mx-auto max-w-xl px-4 py-4">
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="w-full rounded-2xl bg-brand px-5 py-4 text-lg font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
          >
            {t("dash.start")}
          </button>
        </div>
      </div>
    </div>
  );
}
