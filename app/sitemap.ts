import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { subjectMeta } from "@/lib/subjectMeta";

// sitemap.xml — yalnız açıq (public) səhifələr. Girişdən sonrakı səhifələr
// robots.ts-də onsuz da bağlıdır, buraya da salınmır.
//
// Fənn siyahısı `@/lib/subjectMeta`-dan gəlir, `@/lib/content`-dən YOX: content
// bütün seed məzmunudur və Worker paketini 3 MiB limitindən keçirir (dinamik
// import da kömək etmir — bundler onu yenə paketə salır).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: { path: string; priority: number; freq: "daily" | "weekly" | "monthly" }[] = [
    { path: "", priority: 1.0, freq: "daily" },
    { path: "/haqqimizda", priority: 0.6, freq: "monthly" },
    { path: "/yardim", priority: 0.7, freq: "weekly" },
    { path: "/plus", priority: 0.8, freq: "weekly" },
    { path: "/blog", priority: 0.6, freq: "weekly" },
    { path: "/karyera", priority: 0.4, freq: "monthly" },
    { path: "/investorlar", priority: 0.4, freq: "monthly" },
    { path: "/mekteb", priority: 0.6, freq: "monthly" },
    { path: "/login", priority: 0.5, freq: "monthly" },
    { path: "/signup", priority: 0.7, freq: "monthly" },
    { path: "/sertler", priority: 0.3, freq: "monthly" },
    { path: "/mexfilik", priority: 0.3, freq: "monthly" },
  ];

  return [
    ...staticRoutes.map((r) => ({
      url: `${SITE_URL}${r.path}`,
      lastModified: now,
      changeFrequency: r.freq,
      priority: r.priority,
    })),
    ...subjectMeta.map((s) => ({
      url: `${SITE_URL}/subjects/${s.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
