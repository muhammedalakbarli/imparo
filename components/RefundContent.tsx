"use client";

// Geri qaytarma siyasəti — Şərtlər/Məxfilik ilə eyni çərçivədə (LegalShell).
//
// Ayrıca səhifə olması təsadüfi deyil: ödəniş provayderləri (epoint, Payriff,
// LemonSqueezy) müqavilə üçün müstəqil geri qaytarma sənədi tələb edir, üstəlik
// istifadəçi "pulumu geri ala bilərəmmi?" sualının cavabını Şərtlərin 11-ci
// bəndində axtarmamalıdır.

import LegalShell, { Section } from "@/components/LegalShell";
import { formatLegalDate } from "@/lib/legal";
import { useT, useLang } from "@/lib/i18n";

const SECTIONS = Array.from({ length: 11 }, (_, i) => i + 1);

export default function RefundContent() {
  const t = useT();
  const lang = useLang();
  return (
    <LegalShell title={t("refund.title")} updated={t("legal.updated").replace("{d}", formatLegalDate(lang))}>
      <p className="whitespace-pre-line leading-relaxed text-muted">{t("refund.intro")}</p>
      {SECTIONS.map((n) => (
        <Section key={n} title={t(`refund.s${n}.t`)} body={t(`refund.s${n}.b`)} />
      ))}
    </LegalShell>
  );
}
