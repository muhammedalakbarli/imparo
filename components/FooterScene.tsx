"use client";

// Futerin üstündəki böyük illüstrasiyalı səhnə — sofatutor.kids-dəki kimi:
// təpələr, ağaclar və qarşıda maskot. Səhifənin sonu "bitdi" yox, "davam edir"
// hissi versin deyə.
//
// NİYƏ İNLİNE SVG, ŞƏKİL YOX:
//   • Səhnə TAM ENDİR (full-bleed) və hər ekran enində kəsilmədən uzanmalıdır —
//     raster şəkil ya kəsilir, ya dartılır. viewBox + preserveAspectRatio="none"
//     yalnız fon qatlarını uzadır, ağaclar isə öz nisbətini saxlayır.
//   • Fayl yoxdur, əlavə sorğu yoxdur, Worker yükünə əlavə bayt düşmür.
//   • Rənglər tema tokenlərinə bağlıdır → tünd rejimdə özü uyğunlaşır.
//
// Zefi PNG-dir və səhnənin QARŞISINDA dayanır: onu SVG ilə çəkmək cəhdi əl-kodlanmış
// maskot səviyyəsində olardı, mövcud peşəkar render isə hazırdır.

import Image from "next/image";
import { useT } from "@/lib/i18n";

export default function FooterScene() {
  const t = useT();

  return (
    <div className="relative isolate w-full select-none" aria-hidden="false">
      {/* Səhnə hündürlüyü ekranla artır: telefonda yer yeməsin, masaüstündə əzəmətli olsun. */}
      <div className="relative h-[240px] w-full sm:h-[300px] lg:h-[360px]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          role="img"
          aria-label={t("scene.alt")}
        >
          <defs>
            {/* Səma — yuxarıda səhifə fonu ilə birləşir ki, kəsik xətt görünməsin. */}
            <linearGradient id="fs-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-ink)" />
              <stop offset="100%" stopColor="var(--color-panel-2)" />
            </linearGradient>
          </defs>

          <rect width="1440" height="320" fill="url(#fs-sky)" />

          {/* Arxa təpə — solğun, dərinlik üçün */}
          <path
            d="M0 196 C 200 148, 360 210, 560 186 C 760 162, 900 214, 1090 190 C 1240 171, 1340 206, 1440 184 L1440 320 L0 320 Z"
            className="fill-[#8FCB6B] dark:fill-[#2f5d33]"
          />
          {/* Ön təpə — Zefi bunun üstündə dayanır */}
          <path
            d="M0 244 C 240 200, 460 262, 700 240 C 950 216, 1140 268, 1330 244 C 1380 238, 1414 242, 1440 238 L1440 320 L0 320 Z"
            className="fill-[#6FB447] dark:fill-[#25492a]"
          />
        </svg>

        {/* Ağaclar — nisbətini qorusun deyə ayrıca SVG-lərdir, fon kimi dartılmır.
            Kiçik ekranda kənardakılar gizlənir: 375px-də səhnə sıxlaşmasın. */}
        <Tree className="absolute bottom-[19%] left-[1%] h-[64%]" kind="pine" />
        <Tree className="absolute bottom-[21%] left-[11%] hidden h-[52%] sm:block" kind="round" />
        <Tree className="absolute bottom-[23%] left-[21%] hidden h-[40%] lg:block" kind="pine" />
        <Tree className="absolute bottom-[19%] right-[2%] h-[68%]" kind="round" />
        <Tree className="absolute bottom-[22%] right-[13%] hidden h-[50%] sm:block" kind="pine" />
        <Tree className="absolute bottom-[24%] right-[23%] hidden h-[38%] lg:block" kind="round" />

        {/* Buludlar */}
        <Cloud className="absolute left-[24%] top-[10%] h-[13%]" />
        <Cloud className="absolute right-[28%] top-[19%] hidden h-[10%] sm:block" />

        {/* Zefi — səhnənin qarşısında, təpənin üstündə. `zefi_welcome` əl qaldırıb
            salamlayır: səhifənin sonu üçün doğru poza. */}
        <div className="absolute bottom-[1%] left-1/2 h-[92%] w-auto -translate-x-1/2">
          <Image
            src="/assets/images/zefi/zefi_welcome.png"
            alt={t("scene.zefi")}
            width={512}
            height={512}
            className="h-full w-auto drop-shadow-[0_10px_18px_rgba(0,0,0,0.18)]"
            sizes="(max-width: 640px) 190px, 320px"
          />
        </div>
      </div>
    </div>
  );
}

/** Sadə, yumşaq formalı ağac — claymorphism üslubuna uyğun (iti künc yoxdur). */
function Tree({ kind, className }: { kind: "pine" | "round"; className?: string }) {
  if (kind === "pine") {
    return (
      <svg className={className} viewBox="0 0 80 140" fill="none" aria-hidden>
        <rect x="35" y="96" width="10" height="42" rx="5" className="fill-[#8a5a3b] dark:fill-[#4a3020]" />
        <path d="M40 6 C 54 34, 62 46, 66 56 C 50 60, 30 60, 14 56 C 18 46, 26 34, 40 6 Z" className="fill-[#3f8f43] dark:fill-[#2b5730]" />
        <path d="M40 42 C 56 74, 66 86, 72 98 C 52 104, 28 104, 8 98 C 14 86, 24 74, 40 42 Z" className="fill-[#4CA04F] dark:fill-[#31663a]" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 90 130" fill="none" aria-hidden>
      <rect x="40" y="82" width="11" height="46" rx="5.5" className="fill-[#8a5a3b] dark:fill-[#4a3020]" />
      <circle cx="45" cy="50" r="34" className="fill-[#4CA04F] dark:fill-[#31663a]" />
      <circle cx="24" cy="64" r="20" className="fill-[#3f8f43] dark:fill-[#2b5730]" />
      <circle cx="67" cy="62" r="22" className="fill-[#3f8f43] dark:fill-[#2b5730]" />
    </svg>
  );
}

function Cloud({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 50" fill="none" aria-hidden>
      <g className="fill-panel">
        <circle cx="34" cy="30" r="18" />
        <circle cx="60" cy="22" r="22" />
        <circle cx="88" cy="31" r="16" />
        <rect x="30" y="32" width="62" height="17" rx="8.5" />
      </g>
    </svg>
  );
}
