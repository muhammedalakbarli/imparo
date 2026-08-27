"use client";

// İstifadəçi girişli olduqda platformada aktiv keçirilən vaxtı izləyir (foreground heartbeat).
// layout-da mount olunur; anonim ziyarətçilər üçün heç nə göndərmir.

import { useEffect } from "react";
import { useOptionalUser } from "@/lib/useOptionalUser";
import { startActivityTracking } from "@/lib/activity";

export default function ActivityTracker() {
  // Qlobal mount — çıxış etmiş ziyarətçini login-ə YÖNLƏNDİRMƏMƏLİDİR (useOptionalUser).
  const { user } = useOptionalUser();

  useEffect(() => {
    if (!user) return;
    const stop = startActivityTracking();
    return stop;
  }, [user]);

  return null;
}
