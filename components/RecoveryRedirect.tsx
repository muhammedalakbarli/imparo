"use client";

// Parol bərpası linki — Supabase redirect_to allowlist-ə düşməsə, ana səhifəyə (Site URL)
// düşə bilər. Bu qlobal komponent URL-də bərpa tokenini (hash #type=recovery və ya ?code)
// tutur, sessiya qurulan kimi istifadəçini /parol-yenile səhifəsinə keçirir — beləliklə
// allowlist yol-uyğunluğundan asılı olmadan parol bərpası həmişə işləyir.

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname === "/parol-yenile") return; // artıq düzgün səhifədə

    const hash = window.location.hash || "";
    const params = new URLSearchParams(window.location.search);
    const isRecovery =
      hash.includes("type=recovery") ||
      (params.has("code") && pathname !== "/auth/callback");
    if (!isRecovery) return;

    const supabase = createClient();
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      router.replace("/parol-yenile");
    };

    // Bərpa sessiyası qurulan kimi keç (SIGNED_IN / PASSWORD_RECOVERY / mövcud sessiya).
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || session) go();
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });

    // Token etibarsız/vaxtı keçibsə də /parol-yenile-ə keç (orada "etibarsız link" göstərilir).
    const timer = setTimeout(go, 6000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [pathname, router]);

  return null;
}
