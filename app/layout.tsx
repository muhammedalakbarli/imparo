import type { Metadata, Viewport } from "next";
import { Nunito, Baloo_2, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import AppChrome from "@/components/AppChrome";
import { ContentProvider } from "@/components/ContentProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import ActivityTracker from "@/components/ActivityTracker";
import BanGate from "@/components/BanGate";
import LegalUpdateBanner from "@/components/LegalUpdateBanner";
import RecoveryRedirect from "@/components/RecoveryRedirect";
import { SITE_URL } from "@/lib/site";

// Gövdə şrifti — yumşaq, oxunaqlı.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800", "900"],
});

// Başlıq şrifti — şişkin, ağır, yuvarlaq (Feather hissi). Azərbaycan hərflərini (ə, ç, ş, ğ, ı) dəstəkləyir.
const baloo = Baloo_2({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// İdarəetmə paneli şrifti — neytral, korporativ qrotesk. Şagird tərəfindəki yumşaq
// Nunito/Baloo idarə panelində qeyri-ciddi görünürdü. Yalnız `.admin-theme` altında
// işlədilir (bax globals.css). latin-ext → ə/ç/ş/ğ/ı hərfləri dəstəklənir.
const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});



export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Imparo — 1–8-ci siniflər üçün interaktiv öyrənmə",
    template: "%s · Imparo",
  },
  description:
    "Riyaziyyat, Azərbaycan dili və İngilis dilini oyun kimi öyrən. Azərbaycan məktəbliləri üçün pulsuz, interaktiv platforma.",
  keywords: [
    "təhsil",
    "ibtidai sinif",
    "orta məktəb",
    "riyaziyyat",
    "Azərbaycan dili",
    "İngilis dili",
    "onlayn öyrənmə",
    "Imparo",
  ],
  applicationName: "Imparo",
  authors: [{ name: "Imparo" }],
  creator: "Imparo",
  publisher: "Imparo",
  category: "education",
  // Telefon nömrəsi kimi mətnləri avtomatik linkə çevirmə.
  formatDetection: { telephone: false, email: false, address: false },
  // Axtarış motorları: indeksləşdir + izlə (böyük önizləmələr).
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Kanonik ünvan + dil alternativləri (eyni səhifə, ?lang ilə).
  alternates: {
    canonical: "/",
    languages: {
      az: "/?lang=az",
      en: "/?lang=en",
      ru: "/?lang=ru",
      "x-default": "/",
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Imparo",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Imparo — öyrənməyi əyləncəyə çevir",
    description:
      "1–8-ci siniflər üçün Riyaziyyat, Azərbaycan dili və İngilis dili — oyun kimi, pulsuz.",
    url: "/",
    siteName: "Imparo",
    locale: "az_AZ",
    alternateLocale: ["en_US", "ru_RU"],
    type: "website",
    images: [
      {
        url: "/og.png?v=3",
        width: 1200,
        height: 630,
        alt: "Imparo — 1–8-ci siniflər üçün interaktiv öyrənmə",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Imparo — öyrənməyi əyləncəyə çevir",
    description:
      "1–8-ci siniflər üçün interaktiv öyrənmə platforması. Pulsuz və maraqlı.",
    images: ["/og.png?v=3"],
  },
};

// Axtarış motorları üçün strukturlaşdırılmış data (JSON-LD): təşkilat + veb-sayt.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": `${SITE_URL}/#organization`,
      name: "Imparo",
      url: SITE_URL,
      description:
        "Azərbaycan məktəbliləri (1–8-ci siniflər) üçün oyunlaşdırılmış öyrənmə platforması.",
      logo: `${SITE_URL}/apple-touch-icon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Imparo",
      inLanguage: ["az", "en", "ru"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

// Mobil brauzer üst zolağının rəngi (brend narıncı).
export const viewport: Viewport = {
  themeColor: "#f47b3a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="az"
      className={`${nunito.variable} ${baloo.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Strukturlaşdırılmış data (SEO / zəngin nəticələr) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ContentProvider>
          {/* Hüquqi dəyişiklik bildirişi — HƏR səhifədə (şərtlərdə vəd edilib).
              AppChrome-dan KƏNARDA: landing və hüquqi səhifələr "bare" rejimdədir
              və AppChrome-un içindəki bannerlər orada göstərilmir. */}
          <LegalUpdateBanner />
          <AppChrome>{children}</AppChrome>
        </ContentProvider>
        <BanGate />
        <AnalyticsProvider />
        <ActivityTracker />
        <RecoveryRedirect />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
