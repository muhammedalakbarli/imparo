import type { Metadata } from "next";

// Səhifənin özü "use client"-dir (interaktivdir), client komponentdən isə
// `metadata` export etmək olmur — ona görə SEO başlığı bu server layout-dan verilir.
export const metadata: Metadata = {
  title: "Yardım mərkəzi",
  description: "Imparo haqqında tez-tez verilən suallar: hesab, tərəqqi, zümrüd, seriya, Plus abunəliyi və dəstək.",
  alternates: { canonical: "/yardim" },
  openGraph: {
    title: "Yardım mərkəzi · Imparo",
    description: "Imparo haqqında tez-tez verilən suallar: hesab, tərəqqi, zümrüd, seriya, Plus abunəliyi və dəstək.",
    url: "/yardim",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
