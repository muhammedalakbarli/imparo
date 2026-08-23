"use client";

// Duolingo üslubu böyük çoxsütunlu footer (landing + Haqqımızda). Çoxdilli.
// Funksional səhifələr (Məktəb/Mağaza) çıxış etmiş ziyarətçini login-ə atmasın deyə /signup-a gedir.
import Link from "next/link";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n";

export default function SiteFooter() {
  const t = useT();
  const cols: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: "Imparo",
      links: [
        { label: t("ft.about"), href: "/haqqimizda" },
        { label: t("ft.mission"), href: "/haqqimizda" },
        { label: t("ft.efficacy"), href: "/semerelilik" },
        { label: t("ft.blog"), href: "/blog" },
        { label: t("ft.careers"), href: "/karyera" },
      ],
    },
    {
      title: t("ft.col.products"),
      links: [
        { label: "Imparo", href: "/" },
        { label: "Imparo Plus", href: "/plus" },
        { label: t("ft.school"), href: "/signup" },
        { label: t("ft.shop"), href: "/signup" },
      ],
    },
    {
      title: t("ft.col.support"),
      links: [
        { label: t("ft.help"), href: "/yardim" },
        { label: t("ft.contact"), href: "/haqqimizda" },
        { label: t("ft.partners"), href: "/partnyorlar" },
        { label: t("ft.investors"), href: "/investorlar" },
      ],
    },
    {
      title: t("ft.col.legal"),
      links: [
        { label: t("ft.terms"), href: "/sertler" },
        { label: t("ft.privacy"), href: "/mexfilik" },
      ],
    },
  ];

  return (
    <footer className="relative z-10 border-t border-line">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-12 sm:grid-cols-4">
        {cols.map((c) => (
          <div key={c.title}>
            <div className="text-xs font-extrabold uppercase tracking-wider text-fg">{c.title}</div>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.label + l.href}>
                  <Link href={l.href} className="text-sm text-muted transition hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-10">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <Logo size={26} />
            <span className="text-sm font-bold text-muted">
              © {new Date().getFullYear()} Imparo. {t("ft.rights")}
            </span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
