import type { Metadata } from "next";

// Səhifənin özü "use client"-dir (dil dəyişdirici), metadata isə server layout-dan verilir.
export const metadata: Metadata = {
  title: "Müəllimlər üçün",
  description:
    "Sinif yaradın, kurikuluma uyğun dərslərdən tapşırıq verin və sinfin hansı bacarıqda ilişdiyini görün. Müəllim hesabı pulsuzdur.",
  alternates: { canonical: "/muellimler" },
  openGraph: {
    title: "Imparo — müəllimlər üçün",
    description:
      "Sinif yaradın, kurikuluma uyğun dərslərdən tapşırıq verin və sinfin hansı bacarıqda ilişdiyini görün.",
    url: "/muellimler",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
