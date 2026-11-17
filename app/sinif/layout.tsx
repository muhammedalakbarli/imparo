import type { Metadata } from "next";

// Səhifənin özü "use client"-dir, metadata isə server faylından verilir.
export const metadata: Metadata = {
  title: "Sinif girişi",
  description: "E-poçtu olmayan şagirdlər üçün: müəllimin verdiyi sinif kodu və 4 rəqəmli PIN ilə daxil ol.",
  alternates: { canonical: "/sinif" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
