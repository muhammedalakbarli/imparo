"use client";

// Müəllimlər üçün — tanıtım səhifəsi. Ana səhifə, footer və partnyorlar səhifəsindən
// bura gəlinir; buradan isə /muellim-ol qeydiyyat axınına.
//
// Rəqəmlər `subjectMeta`-dan HESABLANIR (partnyorlar səhifəsi ilə eyni məntiq):
// məzmun böyüyəndə müəllimə göstərilən rəqəm səssizcə köhnəlməsin.

import Link from "next/link";
import { Check, GraduationCap, Link2, Mail } from "lucide-react";
import InfoShell from "@/components/InfoShell";
import { useT } from "@/lib/i18n";
import { subjectMeta } from "@/lib/subjectMeta";

export default function TeachersPage() {
  const t = useT();

  const subjectCount = new Set(subjectMeta.map((s) => s.name)).size;
  const grades = subjectMeta.map((s) => s.grade);
  const gradeRange = `${Math.min(...grades)}–${Math.max(...grades)}`;
  const lessonCount = subjectMeta.reduce((n, s) => n + s.lessons, 0);

  const stats = [
    { value: String(subjectCount), label: t("partners.statSubjects") },
    { value: gradeRange, label: t("partners.statGrades") },
    { value: `${Math.floor(lessonCount / 50) * 50}+`, label: t("partners.statLessons") },
  ];
  const benefits = [t("teachers.get1"), t("teachers.get2"), t("teachers.get3"), t("teachers.get4"), t("teachers.get5")];
  const steps = [
    { title: t("teachers.how1.t"), body: t("teachers.how1.b") },
    { title: t("teachers.how2.t"), body: t("teachers.how2.b") },
    { title: t("teachers.how3.t"), body: t("teachers.how3.b") },
  ];

  return (
    <InfoShell title={t("teachers.title")} light>
      <p className="text-lg leading-relaxed text-muted">{t("teachers.intro")}</p>

      <div className="mt-6">
        <Link
          href="/muellim-ol"
          className="inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3.5 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
        >
          <GraduationCap size={20} /> {t("teachers.cta")}
        </Link>
        <p className="mt-2 text-sm font-semibold text-muted">{t("teachers.free")}</p>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-panel px-3 py-5 text-center">
            <div className="text-3xl font-extrabold text-brand sm:text-4xl">{s.value}</div>
            <div className="mt-1 text-xs font-bold text-muted sm:text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-extrabold text-fg">{t("teachers.getTitle")}</h2>
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

      <h2 className="mt-12 text-2xl font-extrabold text-fg">{t("teachers.howTitle")}</h2>
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

      <p className="mt-8 flex gap-3 rounded-2xl border border-line bg-panel-2 px-5 py-4 text-sm leading-relaxed text-muted">
        <Link2 size={18} className="mt-0.5 shrink-0 text-brand" />
        {t("teachers.invite")}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/muellim-ol"
          className="inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
        >
          {t("teachers.cta")}
        </Link>
        <a
          href="mailto:info@imparo.app?subject=M%C3%BC%C9%99llim"
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-line px-6 py-3 font-extrabold uppercase tracking-wide text-fg transition-colors hover:border-brand hover:text-brand"
        >
          <Mail size={18} /> {t("teachers.ask")}
        </a>
      </div>
    </InfoShell>
  );
}
