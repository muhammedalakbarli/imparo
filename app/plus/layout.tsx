import type { Metadata } from "next";

// Səhifənin özü "use client"-dir (interaktivdir), client komponentdən isə
// `metadata` export etmək olmur — ona görə SEO başlığı bu server layout-dan verilir.
export const metadata: Metadata = {
  title: "Imparo Plus",
  description: "Limitsiz can, iki dəfə çox zümrüd və reklamsız öyrənmə. Imparo Plus abunəliyinin qiyməti və üstünlükləri.",
  alternates: { canonical: "/plus" },
  openGraph: {
    title: "Imparo Plus · Imparo",
    description: "Limitsiz can, iki dəfə çox zümrüd və reklamsız öyrənmə. Imparo Plus abunəliyinin qiyməti və üstünlükləri.",
    url: "/plus",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
