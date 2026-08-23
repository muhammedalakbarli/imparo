"use client";

import InfoShell from "@/components/InfoShell";
import { Mail } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function InvestorsPage() {
  const t = useT();
  return (
    <InfoShell title={t("investors.title")} light>
      <p className="text-lg leading-relaxed text-muted">{t("investors.body")}</p>
      <a
        href="mailto:investor@imparo.app"
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3 font-extrabold uppercase tracking-wide text-white btn-pop hover:bg-brand-dark"
      >
        <Mail size={18} /> {t("info.contactBtn")}
      </a>
    </InfoShell>
  );
}
