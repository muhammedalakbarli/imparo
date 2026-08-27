"use client";

// Hüquqi sənəd dəyişikliyi bildirişi.
//
// İstifadə şərtləri söz verir: "Dəyişiklik olduqda saytda ƏN AZI 7 GÜN bildiriş
// yerləşdiririk". Bu komponent həmin öhdəliyi yerinə yetirir — əvvəl belə bir
// mexanizm yox idi, yəni sənəd öz vədini pozurdu.
//
// Bütün səhifələrdə görünür (root layout-dadır), çünki şagird sayta istənilən
// səhifədən girə bilər. Bağlana bilər — vəd "göstərmək"dir, "məcbur oxutmaq" deyil.

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, FileText } from "lucide-react";
import { useT } from "@/lib/i18n";
import { legalNoticeOpen, LEGAL_DISMISS_KEY } from "@/lib/legal";

export default function LegalUpdateBanner() {
  // SSR-də göstərilmir: localStorage yalnız brauzerdə oxunur, əks halda
  // hidrasiya uyğunsuzluğu yaranır və banner bir an yanıb-sönür.
  const [show, setShow] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!legalNoticeOpen()) return;
    try {
      if (localStorage.getItem(LEGAL_DISMISS_KEY) === "1") return;
    } catch {
      /* localStorage bağlıdırsa banner yenə göstərilsin */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(true);
  }, []);

  if (!show) return null;

  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(LEGAL_DISMISS_KEY, "1");
    } catch {
      /* yazıla bilməsə də bağlanma cari sessiyada işləyir */
    }
  };

  return (
    <div className="relative z-40 border-b border-line bg-panel-2 px-4 py-2.5 text-center text-sm text-fg">
      <FileText size={15} className="mr-1.5 inline-block align-[-2px] text-brand" />
      <span>{t("legal.notice.body")} </span>
      <Link href="/sertler" className="font-bold text-brand underline underline-offset-2">
        {t("legal.notice.terms")}
      </Link>
      <span> · </span>
      <Link href="/mexfilik" className="font-bold text-brand underline underline-offset-2">
        {t("legal.notice.privacy")}
      </Link>
      <button
        type="button"
        onClick={close}
        aria-label={t("legal.notice.close")}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition hover:bg-panel hover:text-fg"
      >
        <X size={16} />
      </button>
    </div>
  );
}
