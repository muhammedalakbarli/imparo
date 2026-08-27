"use client";

// Sadə marketing/info səhifə çərçivəsi (Bloq, Karyera, İnvestorlar, Səmərəlilik).
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";

export default function InfoShell({
  title,
  children,
  light = false,
}: {
  title: string;
  children: React.ReactNode;
  light?: boolean; // qlobal tünd rejimdən asılı olmayaraq işıqlı göstər
}) {
  const t = useT();
  return (
    <main className={`min-h-screen bg-ink${light ? " force-light" : ""}`}>
      <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-lg font-extrabold text-brand">Imparo</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />
            <Link href="/haqqimizda" className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-fg">
              <ArrowLeft size={15} /> {t("ft.about")}
            </Link>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <h1 className="text-4xl font-extrabold text-fg sm:text-5xl">{title}</h1>
        <div className="mt-6">{children}</div>
      </article>
    </main>
  );
}
