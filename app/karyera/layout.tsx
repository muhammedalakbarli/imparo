import type { Metadata } from "next";

// Səhifənin özü "use client"-dir (interaktivdir), client komponentdən isə
// `metadata` export etmək olmur — ona görə SEO başlığı bu server layout-dan verilir.
export const metadata: Metadata = {
  title: "Karyera",
  description: "Imparo komandasına qoşul. Azərbaycan məktəbliləri üçün təhsil məhsulu quran komandada açıq vakansiyalar.",
  alternates: { canonical: "/karyera" },
  openGraph: {
    title: "Karyera · Imparo",
    description: "Imparo komandasına qoşul. Azərbaycan məktəbliləri üçün təhsil məhsulu quran komandada açıq vakansiyalar.",
    url: "/karyera",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
