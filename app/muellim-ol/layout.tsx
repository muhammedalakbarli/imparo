import type { Metadata } from "next";

// Səhifənin özü "use client"-dir, metadata isə yalnız server faylından verilə bilər.
// Qeydiyyat axınıdır, axtarışda görünməsi lazım deyil — tanıtım səhifəsi /muellimler-dir.
export const metadata: Metadata = {
  title: "Müəllim hesabı",
  description: "Imparo-da müəllim hesabı yaradın: sinif, tapşırıq və şagird nəticələri bir yerdə.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/muellim-ol" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
