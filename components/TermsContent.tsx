"use client";

import LegalShell, { Section } from "@/components/LegalShell";
import { formatLegalDate } from "@/lib/legal";
import { useT, useLang } from "@/lib/i18n";

const SECTIONS = Array.from({ length: 18 }, (_, i) => i + 1);

export default function TermsContent() {
  const t = useT();
  const lang = useLang();
  return (
    <LegalShell title={t("terms.title")} updated={t("legal.updated").replace("{d}", formatLegalDate(lang))}>
      <p className="whitespace-pre-line leading-relaxed text-muted">{t("terms.intro")}</p>
      {SECTIONS.map((n) => (
        <Section key={n} title={t(`terms.s${n}.t`)} body={t(`terms.s${n}.b`)} />
      ))}
    </LegalShell>
  );
}
