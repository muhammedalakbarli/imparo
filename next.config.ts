import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// `next dev` (yerli inkişaf) daxilində Cloudflare kontekstini (getCloudflareContext())
// simulyasiya edir — olmasa API route-larda process.env ƏVƏZİNƏ işlədilən Worker
// secret-ləri (CRON_SECRET və s.) yalnız `wrangler dev`-də görünərdi, `npm run dev`-də yox.
initOpenNextCloudflareForDev();

// CSP-də istifadə olunan xarici mənbələr: Supabase (DB/auth/REST), PostHog (analitika, EU host),
// LemonSqueezy (ödəniş checkout — tam səhifə keçidi, iframe DEYİL, ona görə connect-src-ə lazım deyil).
const SUPABASE_HOST = "https://*.supabase.co";
const POSTHOG_HOST = "https://*.posthog.com";

// Dəyərlər Next.js-in öz inline bootstrap script/style-larına görə 'unsafe-inline' saxlayır
// (nonce-əsaslı CSP daha sərt olardı, amma bu layihədə middleware-əsaslı nonce infrastrukturu
// yoxdur — səhifənin qırılma riski ilə "faydasız sərtlik" arasında balans seçilib).
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${POSTHOG_HOST}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE_HOST} wss://*.supabase.co ${POSTHOG_HOST}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.lemonsqueezy.com",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Bütün səhifələrə əsas müdafiə başlıqları.
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
      {
        // Service worker həmişə təzə yüklənsin, düzgün tip alsın.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
