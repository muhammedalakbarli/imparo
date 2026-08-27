"use client";

// Analitikanı bir dəfə işə salır və hər SPA keçidində səhifə baxışı göndərir.
// Açar yoxdursa daxildə NO-OP-dur (bax lib/analytics.ts). layout-da mount olunur.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, capturePageview } from "@/lib/analytics";

export default function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (pathname) capturePageview(pathname);
  }, [pathname]);

  return null;
}
