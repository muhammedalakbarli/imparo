"use client";

// Hüquqi səhifələr üçün sadə çərçivə (Şərtlər, Məxfilik) — çoxdilli (useT).
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import { useT } from "@/lib/i18n";
import { legalNoticeOpen } from "@/lib/legal";

export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <main className="min-h-screen bg-ink">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-lg font-extrabold text-brand">Imparo</span>
          </Link>
          <Link href="/haqqimizda" className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-fg">
            <ArrowLeft size={15} /> {t("ft.about")}
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-extrabold text-fg sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">{updated}</p>

        {/* Son dəyişikliyin xülasəsi — şərtlərdə vəd edilən 7 gün ərzində görünür.
            "Nəyisə dəyişdik" demək azdır; nəyi dəyişdiyimiz də göstərilməlidir. */}
        {legalNoticeOpen() && (
          <div className="mt-5 rounded-2xl border border-brand/30 bg-brand/5 px-5 py-4">
            <div className="text-sm font-extrabold text-fg">{t("legal.changed")}</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t("legal.changedBody")}</p>
          </div>
        )}
        <div className="mt-8 space-y-6">{children}</div>

        <div className="mt-12 border-t border-line pt-6 text-sm text-muted">
          {t("legal.contactLine")}{" "}
          <a href="mailto:mexfilik@imparo.app" className="font-bold text-brand hover:underline">
            mexfilik@imparo.app
          </a>
        </div>
      </article>
    </main>
  );
}

// Bölmə: başlıq + mətn (siyahılar "\n" ilə — whitespace-pre-line).
export function Section({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="text-xl font-extrabold text-fg">{title}</h2>
      <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{body}</p>
    </section>
  );
}
