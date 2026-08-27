import type { Metadata } from "next";
import AboutContent from "@/components/AboutContent";

export const metadata: Metadata = {
  title: "Haqqımızda",
  description:
    "Imparo — Azərbaycan məktəbliləri üçün oyunlaşdırılmış təhsil platforması. Missiyamız: ən yaxşı təhsili qurmaq və hamıya çatdırmaq.",
};

export default function AboutPage() {
  return <AboutContent />;
}
