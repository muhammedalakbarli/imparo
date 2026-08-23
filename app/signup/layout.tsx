import type { Metadata } from "next";

// Səhifənin özü "use client"-dir (interaktivdir), client komponentdən isə
// `metadata` export etmək olmur — ona görə SEO başlığı bu server layout-dan verilir.
export const metadata: Metadata = {
  title: "Qeydiyyat",
  description: "Pulsuz Imparo hesabı yarat — riyaziyyat, Azərbaycan dili və İngilis dilini oyun kimi öyrən.",
  alternates: { canonical: "/signup" },
  openGraph: {
    title: "Qeydiyyat · Imparo",
    description: "Pulsuz Imparo hesabı yarat — riyaziyyat, Azərbaycan dili və İngilis dilini oyun kimi öyrən.",
    url: "/signup",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
