import type { MetadataRoute } from "next";

// Veb tətbiq manifesti — brauzer bunu oxuyub saytı "ana ekrana əlavə et" ilə
// tam ekran, ikonlu tətbiq kimi quraşdırmağa imkan verir (PWA).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Imparo — 1–8-ci siniflər üçün interaktiv öyrənmə",
    short_name: "Imparo",
    description:
      "Riyaziyyat, Azərbaycan dili və İngilis dilini oyun kimi öyrən. 1–8-ci siniflər üçün pulsuz, interaktiv platforma.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff4df",
    theme_color: "#f47b3a",
    lang: "az",
    categories: ["education"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
