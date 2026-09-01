import type { Metadata } from "next";
import RefundContent from "@/components/RefundContent";

export const metadata: Metadata = {
  title: "Geri qaytarma siyasəti",
  description:
    "Imparo geri qaytarma siyasəti — abunə ödənişlərinin qaytarılması, ləğvetmə, sponsorluq və kart köçürmələri üzrə qaydalar.",
};

export default function RefundPage() {
  return <RefundContent />;
}
