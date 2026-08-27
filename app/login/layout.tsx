import type { Metadata } from "next";

// Səhifənin özü "use client"-dir (interaktivdir), client komponentdən isə
// `metadata` export etmək olmur — ona görə SEO başlığı bu server layout-dan verilir.
export const metadata: Metadata = {
  title: "Daxil ol",
  description: "Imparo hesabına daxil ol və öyrənmə yoluna qaldığın yerdən davam et.",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Daxil ol · Imparo",
    description: "Imparo hesabına daxil ol və öyrənmə yoluna qaldığın yerdən davam et.",
    url: "/login",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
