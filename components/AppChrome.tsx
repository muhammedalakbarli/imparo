"use client";

// Tətbiq çərçivəsi: giriş səhifəsində (/) sadəcə uşaqları göstərir;
// digər bütün səhifələrdə solda sabit Sidebar + sol boşluqlu əsas sahə.
// MotionConfig: Ayarlar "animations" söndürülübsə framer-motion animasiyaları da dayanır.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import Sidebar from "./Sidebar";
import AnnouncementBanner from "./AnnouncementBanner";
import { loadPrefs, applyPrefs } from "@/lib/prefs";

const BARE_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/parol-unutdum",
  "/parol-yenile",
  "/onboarding",
  "/haqqimizda",
  "/sertler",
  "/mexfilik",
  "/blog",
  "/karyera",
  "/investorlar",
  "/partnyorlar",
  "/semerelilik",
]);

const BARE_PREFIXES = ["/lessons/", "/u/", "/dost/", "/hesabat/", "/admin"];

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [animEnabled, setAnimEnabled] = useState(true);

  // İstifadəçi tərcihlərini (animasiya və s.) tətbiq et.
  useEffect(() => {
    const p = loadPrefs();
    applyPrefs(p);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnimEnabled(p.animations);
  }, [pathname]);

  // Sidebar-sız ("bare") səhifələr: marketing/hüquqi səhifələr öz başlığını
  // özləri gətirir (InfoShell/SiteFooter), giriş və dərs ekranı isə immersivdir.
  //
  // ⚠️ YENİ MARKETING SƏHİFƏSİ ƏLAVƏ EDƏNDƏ ONU BURAYA DA YAZ — yoxsa səhifə
  // tətbiq səhifəsi sayılır və solunda şagird sidebar-ı görünür.
  const bare = BARE_ROUTES.has(pathname) || BARE_PREFIXES.some((p) => pathname.startsWith(p));

  const body = bare ? (
    <>{children}</>
  ) : (
    <>
      <Sidebar />
      <div className="pb-20 lg:pb-0 lg:pl-56">
        <AnnouncementBanner />
        {children}
      </div>
    </>
  );

  // animasiya söndürülübsə "always" (framer-motion son halı dərhal tətbiq edir),
  // əks halda "user" (yalnız prefers-reduced-motion olanlarda azaldır).
  return (
    <MotionConfig reducedMotion={animEnabled ? "user" : "always"}>{body}</MotionConfig>
  );
}
