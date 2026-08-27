"use client";

import InfoShell from "@/components/InfoShell";
import Mascot from "@/components/Mascot";
import { useT } from "@/lib/i18n";

export default function BlogPage() {
  const t = useT();
  return (
    <InfoShell title={t("blog.title")} light>
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-line bg-panel p-10 text-center">
        <Mascot size={130} mood="thinking" />
        <p className="max-w-md text-lg text-muted">{t("blog.body")}</p>
      </div>
    </InfoShell>
  );
}
