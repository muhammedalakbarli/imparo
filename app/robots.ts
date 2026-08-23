import type { MetadataRoute } from "next";

// robots.txt — axtarış motorlarına indeksləşdirmə qaydaları + sitemap ünvanı.
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Girişdən sonrakı (login arxası) və şəxsi səhifələr. Bunları indeksləmək
        // faydasızdır: Google-a ya boş qabıq, ya da yönləndirmə düşür — nəticədə
        // saytın "keyfiyyətsiz səhifə" nisbəti artır.
        disallow: [
          "/admin",
          "/api/",
          "/auth/",
          "/dashboard",
          "/profil",
          "/ayarlar",
          "/onboarding",
          "/lessons/",
          "/dost/",
          "/mekteb/sinif/",
          "/parol-unutdum",
          "/parol-yenile",
          "/gorevler",
          "/liqa",
          "/praktika",
          "/semerelilik",
          "/streak",
          "/magaza",
          "/daha",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
