"use client";

// Sessiyanı OXUYUR, amma giriş olmayanda /login-ə YÖNLƏNDİRMİR.
// İctimai səhifələr üçün (məs. /plus qiymətlər, /yardim yardım) — çıxış etmiş
// ziyarətçi də görə bilsin (useAuthUser məcburi login yönləndirməsi olmadan).

import { useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import type { User } from "@supabase/supabase-js";

export function useOptionalUser(): { user: User | null; ready: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, ready };
}
