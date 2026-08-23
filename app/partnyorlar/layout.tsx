import type { Metadata } from "next";

// Səhifənin özü "use client"-dir (interaktivdir), client komponentdən isə
// `metadata` export etmək olmur — ona görə SEO başlığı bu server layout-dan verilir.
export const metadata: Metadata = {
  title: "Partnyorluq",
  description:
    "Məktəb, repetitor mərkəzi, fond və ya şirkət — Imparo ilə birgə işləmə yolları, pilot şərtləri və başlama addımları.",
  alternates: { canonical: "/partnyorlar" },
  openGraph: {
    title: "Partnyorluq · Imparo",
    description:
      "Məktəb, repetitor mərkəzi, fond və ya şirkət — Imparo ilə birgə işləmə yolları və pilot şərtləri.",
    url: "/partnyorlar",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
