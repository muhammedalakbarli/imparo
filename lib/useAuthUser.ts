"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { displayName } from "./auth";
import { ensureProfile } from "./progress";
import { createClient } from "./supabase/client";
import { identifyUser, resetAnalytics, track } from "./analytics";
import { getTeacherIntent, teacherFlowPath } from "./teacher";
import { allowRedirect } from "./redirectGuard";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * `optional: true` — girişsiz istifadəçini /login-ə YÖNLƏNDİRMİR, sadəcə user=null
 * qaytarır. Onboarding-də ilk dərs hesabsız oynanır (Duolingo modeli), ona görə həmin
 * səhifə qapını özü idarə etməlidir. Bütün digər çağırışlar əvvəlki kimi qorunur.
 */
// Onboarding keçməmiş hesab hara getsin: müəllim axınına başlayıbsa (niyyət var) —
// müəllim qeydiyyatına, əks halda şagird onboardinginə. Bax lib/teacher.ts.
function onboardingPath(): string {
  const intent = getTeacherIntent();
  return intent ? teacherFlowPath(intent) : "/onboarding";
}

/**
 * Sessiyadakı `user_metadata` KÖHNƏ ola bilər: başqa cihazda onboarding bitəndə (və ya
 * müəllim dəvəti götürüləndə) bu brauzerin sessiyası token təzələnənə qədər (~1 saat)
 * hələ "onboarded deyil" deyir. /onboarding isə serverdən (getUser) oxuyur və geri
 * /dashboard-a atır — nəticədə sonsuz dövrə yaranırdı (4 Noy 2026: Windows Chrome-da
 * saniyədə ~10 yönləndirmə, istifadəçi "kompüter donur" kimi gördü).
 *
 * Ona görə "onboarded deyil" hökmü yönləndirmədən ƏVVƏL serverdə təsdiqlənir. Server
 * onboarded deyirsə sessiya təzələnir ki, səhifənin qalan oxucuları da təzə məlumat
 * görsün. Bu yol yalnız onboarded OLMAYAN sessiyada işləyir — adi girişə əlavə sorğu yoxdur.
 */
async function freshIfOnboarded(supabase: SupabaseClient): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  const fresh = data.user;
  if (error || !fresh?.user_metadata?.onboarded) return null;
  await supabase.auth.refreshSession().catch(() => null);
  return fresh;
}

export function useAuthUser(opts?: { optional?: boolean }): { user: User | null; ready: boolean } {
  const optional = opts?.optional ?? false;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let alive = true;

    const accept = (u: User) => {
      if (!alive) return;
      ensureProfile(u.id, displayName(u)).catch(() => {});
      identifyUser(u.id, { grade: u.user_metadata?.grade });
      setUser(u);
      setReady(true);
    };

    // Sessiya "onboarded deyil" deyir — serverdə təsdiqlə, sonra qərar ver.
    const checkOnboarding = (u: User) => {
      freshIfOnboarded(supabase).then((fresh) => {
        if (!alive) return;
        if (fresh) return accept(fresh);
        // Sığorta: həddən çox yönləndirmə olubsa dövrəni qır, səhifəni göstər.
        if (!allowRedirect()) {
          track("redirect_loop_blocked", { from: window.location.pathname, to: onboardingPath() });
          return accept(u);
        }
        router.replace(onboardingPath());
        setReady(true);
      });
    };

    // İlk yükləmə üçün mövcud sessiyanı oxu
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      if (!u) {
        if (!optional) router.replace("/login");
        setReady(true);
        return;
      }
      if (!optional && !u.user_metadata?.onboarded) return checkOnboarding(u);
      accept(u);
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
        if (event === "SIGNED_IN") track("session_start");
        if (!optional && !u.user_metadata?.onboarded) {
          // Bu callback daxilində başqa auth çağırışını gözləmək Supabase kilidini
          // tıxaya bilər (sənədlərdəki xəbərdarlıq) — ona görə növbəti tick-ə keçirilir.
          setTimeout(() => checkOnboarding(u), 0);
          return;
        }
        accept(u);
      }
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [router, optional]);

  return { user, ready };
}
