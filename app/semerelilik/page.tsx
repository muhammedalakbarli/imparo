"use client";

import InfoShell from "@/components/InfoShell";
import { Repeat, Gamepad2, Target } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function EfficacyPage() {
  const t = useT();
  const points = [
    { Icon: Repeat, title: t("efficacy.p1t"), body: t("efficacy.p1b") },
    { Icon: Gamepad2, title: t("efficacy.p2t"), body: t("efficacy.p2b") },
    { Icon: Target, title: t("efficacy.p3t"), body: t("efficacy.p3b") },
  ];
  return (
    <InfoShell title={t("efficacy.title")} light>
      <p className="text-lg leading-relaxed text-muted">{t("efficacy.intro")}</p>
      <div className="mt-6 space-y-4">
        {points.map((p) => (
          <div key={p.title} className="flex gap-4 rounded-3xl border border-line bg-panel p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <p.Icon size={24} />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-fg">{p.title}</h3>
              <p className="mt-1 text-muted">{p.body}</p>
            </div>
          </div>
        ))}
      </div>
    </InfoShell>
  );
}
