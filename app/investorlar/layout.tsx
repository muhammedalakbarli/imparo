import type { Metadata } from "next";

// Səhifənin özü "use client"-dir (interaktivdir), client komponentdən isə
// `metadata` export etmək olmur — ona görə SEO başlığı bu server layout-dan verilir.
export const metadata: Metadata = {
  title: "İnvestorlar",
  description: "Imparo-nun məhsulu, bazarı və inkişaf göstəriciləri haqqında investorlar üçün məlumat.",
  alternates: { canonical: "/investorlar" },
  openGraph: {
    title: "İnvestorlar · Imparo",
    description: "Imparo-nun məhsulu, bazarı və inkişaf göstəriciləri haqqında investorlar üçün məlumat.",
    url: "/investorlar",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
