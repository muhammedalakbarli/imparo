import type { Metadata } from "next";
import PrivacyContent from "@/components/PrivacyContent";

export const metadata: Metadata = {
  title: "Məxfilik siyasəti",
  description: "Imparo məxfilik siyasəti — hansı məlumatları topladığımız, necə istifadə etdiyimiz və hüquqların.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
