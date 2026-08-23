import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// sitemap.xml — yalnız açıq (public) səhifələr. Girişdən sonrakı səhifələr
// robots.ts-də onsuz da bağlıdır, buraya da salınmır.
//
// Fənn səhifələri DİNAMİK idxal olunur: `@/lib/content` statik idxal ediləndə
// bütün seed məzmunu Worker-in başlanğıc yoluna düşür və CPU limitini keçirdi
// (Error 1102). `await import(...)` onu yalnız bu route çağırılanda yükləyir.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  let subjectPaths: string[] = [];
  try {
    const { subjects } = await import("@/lib/content");
    subjectPaths = [...new Set(subjects.map((s) => `/subjects/${s.slug}`))];
  } catch {
    // Məzmun yüklənməsə sitemap yenə də statik səhifələrlə qaytarılsın —
    // boş/500 sitemap Google-da bütün səhifələrin düşməsinə səbəb olur.
  }

  return [
    ...staticRoutes.map((r) => ({
      url: `${SITE_URL}${r.path}`,
      lastModified: now,
      changeFrequency: r.freq,
      priority: r.priority,
    })),
    ...subjectPaths.map((p) => ({
      url: `${SITE_URL}${p}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
