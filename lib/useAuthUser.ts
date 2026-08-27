"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { displayName } from "./auth";
import { ensureProfile } from "./progress";
import { createClient } from "./supabase/client";
import { identifyUser, resetAnalytics, track } from "./analytics";
import type { User } from "@supabase/supabase-js";

/**
 * `optional: true` — girişsiz istifadəçini /login-ə YÖNLƏNDİRMİR, sadəcə user=null
 * qaytarır. Onboarding-də ilk dərs hesabsız oynanır (Duolingo modeli), ona görə həmin
 * səhifə qapını özü idarə etməlidir. Bütün digər çağırışlar əvvəlki kimi qorunur.
 */
export function useAuthUser(opts?: { optional?: boolean }): { user: User | null; ready: boolean } {
  const optional = opts?.optional ?? false;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    
    // İlk yükləmə üçün mövcud sessiyanı oxu
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      if (!u) {
        if (!optional) router.replace("/login");
        setReady(true);
        return;
      }
      if (!optional && !u.user_metadata?.onboarded) {
        router.replace("/onboarding");
        setReady(true);
        return;
      }
      ensureProfile(u.id, displayName(u)).catch(() => {});
      identifyUser(u.id, { grade: u.user_metadata?.grade });
      setUser(u);
      setReady(true);
    });

    // Sonrakı dəyişiklikləri real-time izlə
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      if (event === "SIGNED_OUT" || !u) {
        resetAnalytics();
        setUser(null);
        setReady(optional);
        if (!optional) router.replace("/login");
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        identifyUser(u.id, { grade: u.user_metadata?.grade });
        if (event === "SIGNED_IN") track("session_start");
        if (!optional && !u.user_metadata?.onboarded) {
          router.replace("/onboarding");
          setReady(true);
          return;
        }
        ensureProfile(u.id, displayName(u)).catch(() => {});
        setUser(u);
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, optional]);

  return { user, ready };
}
