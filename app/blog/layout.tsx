import type { Metadata } from "next";

// Səhifənin özü "use client"-dir (interaktivdir), client komponentdən isə
// `metadata` export etmək olmur — ona görə SEO başlığı bu server layout-dan verilir.
export const metadata: Metadata = {
  title: "Bloq",
  description: "Öyrənmə, motivasiya və məktəb proqramı haqqında yazılar — Imparo komandasından.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Bloq · Imparo",
    description: "Öyrənmə, motivasiya və məktəb proqramı haqqında yazılar — Imparo komandasından.",
    url: "/blog",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
