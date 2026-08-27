import type { Metadata } from "next";
import TermsContent from "@/components/TermsContent";

export const metadata: Metadata = {
  title: "İstifadə şərtləri",
  description: "Imparo istifadə şərtləri — platformadan istifadə qaydaları, hesab, abunəlik və ödənişlər.",
};

export default function TermsPage() {
  return <TermsContent />;
}
