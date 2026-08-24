"use client";

import LegalShell, { Section } from "@/components/LegalShell";
import { formatLegalDate } from "@/lib/legal";
import { useT, useLang } from "@/lib/i18n";

const SECTIONS = Array.from({ length: 15 }, (_, i) => i); // 0..14

export default function PrivacyContent() {
  const t = useT();
  const lang = useLang();
  return (
    <LegalShell title={t("privacy.title")} updated={t("legal.updated").replace("{d}", formatLegalDate(lang))}>
      {SECTIONS.map((n) => (
        <Section key={n} title={t(`privacy.s${n}.t`)} body={t(`privacy.s${n}.b`)} />
      ))}
    </LegalShell>
  );
}
