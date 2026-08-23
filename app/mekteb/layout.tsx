import type { Metadata } from "next";

// Səhifənin özü "use client"-dir (interaktivdir), client komponentdən isə
// `metadata` export etmək olmur — ona görə SEO başlığı bu server layout-dan verilir.
export const metadata: Metadata = {
  title: "Imparo Məktəb",
  description: "Müəllimlər üçün: sinif yarat, şagirdlərə tapşırıq təyin et və tərəqqini bir ekrandan izlə.",
  alternates: { canonical: "/mekteb" },
  openGraph: {
    title: "Imparo Məktəb · Imparo",
    description: "Müəllimlər üçün: sinif yarat, şagirdlərə tapşırıq təyin et və tərəqqini bir ekrandan izlə.",
    url: "/mekteb",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
