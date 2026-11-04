"use client";

// Müəllim axınına qayıdış — Google/e-poçt girişindən sonra istifadəçi harada
// düşürsə düşsün (/dashboard, ana səhifə, /login), müəllim niyyəti varsa onu
// /muellim-ol-a qaytarır. Niyyət 2 saat sonra öz-özünə unudulur (lib/teacher.ts).
//
// Onboarding keçməmiş hesabı `useAuthUser` onsuz da birbaşa ora göndərir; bu
// komponent artıq onboarded olan (məs. əvvəl şagird kimi qeydiyyatdan keçmiş)
// hesabın dəvət linki ilə gəldiyi halı tutur.

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getTeacherIntent, teacherFlowPath } from "@/lib/teacher";

const SKIP = ["/muellim-ol", "/auth/", "/parol-yenile", "/parol-unutdum", "/signup", "/login"];

export default function TeacherIntentRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (SKIP.some((p) => pathname === p || pathname.startsWith(p))) return;
    const intent = getTeacherIntent();
    if (!intent) return;

    const supabase = createClient();
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      router.replace(teacherFlowPath(intent));
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) go();
    });
    return () => sub.subscription.unsubscribe();
  }, [pathname, router]);

  return null;
}
