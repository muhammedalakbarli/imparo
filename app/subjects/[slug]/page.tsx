"use client";

// Fənn səhifəsi: hər bölmə üçün öyrənmə yolu (node path).

import { use, useEffect, useState } from "react";
import { notFound, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useContent } from "@/components/ContentProvider";
import { loadProgress, lessonState, type ProgressState } from "@/lib/progress";
import { useAuthUser } from "@/lib/useAuthUser";
import { useT } from "@/lib/i18n";
import LearningPath, { type PathNode } from "@/components/LearningPath";
import { PageSkeleton } from "@/components/Skeleton";
import { getGuest } from "@/lib/guest";

export default function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  // Onboarding-dən "Sonra" seçən şagird hesabsız yolda gəzə bilir: tərəqqi qonaq
  // anbarından oxunur, dərs linkləri isə ?onboarding=1 daşıyır ki, dərs də qonaq
  // rejimində açılsın. Adi ziyarətçi üçün heç nə dəyişmir.
  const onboarding = useSearchParams().get("onboarding") === "1";
  const { user, ready } = useAuthUser({ optional: onboarding });
  const { getSubject, loading } = useContent();
  const [state, setState] = useState<ProgressState | null>(null);
  const t = useT();
  const guest = onboarding && ready && !user;

  const subject = getSubject(slug);

  useEffect(() => {
    if (user) loadProgress(user.id).then(setState);
  }, [user]);

  // DB yüklənənə qədər gözlə: əks halda koddakı (bəlkə köhnə) struktur göstərilib
  // sonra DB-dəkinə dəyişir — səhifə "yanıb-sönür".
  if (loading) return <PageSkeleton />;
  if (!subject) notFound();
  if (!ready) return <PageSkeleton />;
  if (!guest && !state) return <PageSkeleton />;

  const g = guest ? getGuest() : null;
  const completed = guest
    ? [...(g?.lessons ?? []), ...(g?.knownLessons ?? [])]
    : state!.completedLessons;
  const order = subject.units.flatMap((u) => u.lessons.map((l) => l.id));

  return (
    <div className="min-h-screen bg-ink">
      <main className="mx-auto max-w-4xl px-4 py-6">
        {guest ? (
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="text-sm text-muted hover:text-fg">
              ← Ana səhifə
            </Link>
            <Link
              href="/signup?from=onboarding"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-extrabold text-white btn-pop hover:bg-brand-dark"
            >
              Profil yarat
            </Link>
          </div>
        ) : (
          <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
            ← Öyrənmə yolun
          </Link>
        )}

        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
            {subject.icon}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-fg">{t(`subject.${subject.slug}`)}</h1>
            <p className="text-sm text-muted">{subject.grade}-ci sinif</p>
          </div>
        </div>

        {/* Bütün bölmələrin dərsləri tək, birləşmiş yolda (yuxarıdan aşağıya) */}
        {(() => {
          const nodes: PathNode[] = subject.units.flatMap((u) =>
            u.lessons.map((l, li) => ({
              id: l.id,
              title: l.title,
              state: lessonState(order, l.id, completed),
              href: guest ? `/lessons/${l.id}?onboarding=1` : `/lessons/${l.id}`,
              unitTitle: li === 0 ? u.title : undefined,
              unitGoal: li === 0 ? u.description || undefined : undefined,
            })),
          );

          return (
            <section className="mt-6 rounded-2xl border border-line bg-panel p-5">
              <h2 className="text-lg font-bold text-fg">Öyrənmə yolu</h2>
              <p className="text-sm text-muted">
                Yuxarıdan başla — aşağı endikcə yeni mövzular açılır.
              </p>

              <div className="mt-4">
                <LearningPath nodes={nodes} />
              </div>
            </section>
          );
        })()}
      </main>
    </div>
  );
}
