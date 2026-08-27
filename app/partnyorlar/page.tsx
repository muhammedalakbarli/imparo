"use client";

// Partnyorluq səhifəsi — B2B/qrant istiqamətinin giriş nöqtəsi.
//
// Rəqəmlər `subjectMeta`-dan HESABLANIR, əl ilə yazılmır: partnyora göstərilən
// "neçə dərs var" rəqəmi məzmun böyüyəndə səssizcə köhnəlsəydi, ilk görüşdə
// yanlış vəd kimi görünərdi.

import InfoShell from "@/components/InfoShell";
import Link from "next/link";
import {
  School,
  GraduationCap,
  HeartHandshake,
  Building2,
  Puzzle,
  Check,
  Mail,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { subjectMeta } from "@/lib/subjectMeta";

export default function PartnersPage() {
  const t = useT();

  // Fənn sayı ADINA görə təkrarsızdır (bazada hər sinif ayrıca sətirdir) —
  // ana səhifədəki hesablama ilə eyni məntiq.
  const subjectCount = new Set(subjectMeta.map((s) => s.name)).size;
  const grades = subjectMeta.map((s) => s.grade);
  const gradeRange = `${Math.min(...grades)}–${Math.max(...grades)}`;
  const lessonCount = subjectMeta.reduce((n, s) => n + s.lessons, 0);

  const tracks = [
    { Icon: School, title: t("partners.schools.t"), body: t("partners.schools.b") },
    { Icon: GraduationCap, title: t("partners.tutors.t"), body: t("partners.tutors.b") },
    { Icon: HeartHandshake, title: t("partners.ngo.t"), body: t("partners.ngo.b") },
    { Icon: Building2, title: t("partners.csr.t"), body: t("partners.csr.b") },
    { Icon: Puzzle, title: t("partners.content.t"), body: t("partners.content.b") },
  ];

  const benefits = [t("partners.get1"), t("partners.get2"), t("partners.get3"), t("partners.get4")];

  const steps = [
    { title: t("partners.how1.t"), body: t("partners.how1.b") },
    { title: t("partners.how2.t"), body: t("partners.how2.b") },
    { title: t("partners.how3.t"), body: t("partners.how3.b") },
  ];

  const stats = [
    { value: String(subjectCount), label: t("partners.statSubjects") },
    { value: gradeRange, label: t("partners.statGrades") },
    { value: `${Math.floor(lessonCount / 50) * 50}+`, label: t("partners.statLessons") },
  ];

  return (
    <InfoShell title={t("partners.title")} light>
      <p className="text-lg leading-relaxed text-muted">{t("partners.intro")}</p>

      {/* Rəqəmlər — partnyorun ilk sualı "nə qədər hazır məzmun var" olur */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-panel px-3 py-5 text-center">
            <div className="text-3xl font-extrabold text-brand sm:text-4xl">{s.value}</div>
            <div className="mt-1 text-xs font-bold text-muted sm:text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Əməkdaşlıq istiqamətləri */}
      <h2 className="mt-12 text-2xl font-extrabold text-fg">{t("partners.whoTitle")}</h2>
      <div className="mt-5 space-y-4">
        {tracks.map((track) => (
          <div key={track.title} className="flex gap-4 rounded-3xl border border-line bg-panel p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <track.Icon size={24} />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-fg">{track.title}</h3>
              <p className="mt-1 leading-relaxed text-muted">{track.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Partnyor nə alır */}
      <h2 className="mt-12 text-2xl font-extrabold text-fg">{t("partners.getTitle")}</h2>
      <ul className="mt-5 space-y-3">
        {benefits.map((b) => (
          <li key={b} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Check size={15} strokeWidth={3} />
            </span>
            <span className="leading-relaxed text-muted">{b}</span>
          </li>
        ))}
      </ul>

      {/* Necə başlayır */}
      <h2 className="mt-12 text-2xl font-extrabold text-fg">{t("partners.howTitle")}</h2>
      <ol className="mt-5 space-y-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-3xl border border-line bg-panel p-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand text-lg font-extrabold text-white">
              {i + 1}
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-fg">{step.title}</h3>
              <p className="mt-1 leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Dürüstlük qeydi — erkən mərhələni gizlətmək ilk görüşdə onsuz da üzə çıxır */}
      <p className="mt-10 rounded-2xl border border-line bg-panel-2 px-5 py-4 text-sm leading-relaxed text-muted">
        {t("partners.honest")}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href="mailto:info@imparo.app?subject=Partnyorluq"
          className="inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
        >
          <Mail size={18} /> {t("partners.cta")}
        </a>
        <Link
          href="/mekteb"
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-line px-6 py-3 font-extrabold uppercase tracking-wide text-fg transition-colors hover:border-brand hover:text-brand"
        >
          {t("ft.school")}
        </Link>
      </div>
    </InfoShell>
  );
}
