// Auth köməkçi funksiyaları (client tərəf) — Supabase email/parol.
// Frontend (login/signup səhifələri) bu funksiyaları çağırır.
// İstifadəçinin adı auth metadata-da (user_metadata.name) saxlanılır.

import { createClient } from "./supabase/client";
import type { User } from "@supabase/supabase-js";

export interface AuthResult {
  ok: boolean;
  error?: string;
  needsEmailConfirm?: boolean;
}

// Qeydiyyat: ad + email + parol + valideyn nəzarəti təsdiqi (checkbox, platforma uşaqlar üçündür).
// IP-ə görə saatlıq tavan (bax migration 0038) — Supabase-in öz email-rate-limit-i üzərinə əlavə qat.
export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
  guardianConsent: boolean,
  parentEmail?: string,
): Promise<AuthResult> {
  const supabase = createClient();

  let ip = "";
  try {
    const r = await fetch("/api/client-ip");
    ip = ((await r.json()) as { ip?: string }).ip ?? "";
  } catch {
    // IP alına bilmədi — rate-limit yoxlaması sükutla ötür (Supabase-in öz limiti hələ işləyir).
  }
  if (ip) {
    const { data: allowed } = await supabase.rpc("check_signup_rate", { p_ip: ip });
    if (allowed === false) {
      return { ok: false, error: "Çox sayda qeydiyyat cəhdi. Bir az sonra yenidən cəhd et." };
    }
    try {
      await supabase.rpc("log_security_event", { p_kind: "signup_attempt", p_ip: ip, p_detail: { email } });
    } catch {
      // sükutla ötür
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        guardianConsent,
        ...(parentEmail?.trim() ? { parentEmail: parentEmail.trim() } : {}),
      },
    },
  });
  if (error) return { ok: false, error: error.message };
  // Email təsdiqi aktivdirsə, session hələ null olur.
  const needsEmailConfirm = !data.session;
  return { ok: true, needsEmailConfirm };
}

// Giriş: email + parol.
// IP-ə görə saatlıq tavan (bax migration 0040) — brute-force giriş cəhdlərinə qarşı əlavə qat.
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = createClient();

  let ip = "";
  try {
    const r = await fetch("/api/client-ip");
    ip = ((await r.json()) as { ip?: string }).ip ?? "";
  } catch {
    // IP alına bilmədi — rate-limit yoxlaması sükutla ötür.
  }
  if (ip) {
    const { data: allowed } = await supabase.rpc("check_login_rate", { p_ip: ip });
    if (allowed === false) {
      return { ok: false, error: "Çox sayda giriş cəhdi. Bir az sonra yenidən cəhd et." };
    }
    try {
      await supabase.rpc("log_security_event", { p_kind: "login_attempt", p_ip: ip, p_detail: { email } });
    } catch {
      // sükutla ötür
    }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Google ilə giriş (OAuth). Brauzeri Google-a yönləndirir; qayıdış /auth/callback-ə.
export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      // Hər dəfə hesab seçimi göstər (birbaşa köhnə hesaba girməsin).
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Parol bərpası: email-ə bərpa linki göndər (link /parol-yenile-ə qayıdır).
export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/parol-yenile`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Yeni parol təyin et (bərpa linkindən gələn sessiya ilə).
export async function updatePassword(password: string): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Çıxış.
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

// Cari istifadəçi (yoxdursa null).
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// İstifadəçinin görünən adı (metadata-dan, yoxdursa email-in başlanğıcı).
export function displayName(user: User | null): string {
  if (!user) return "";
  const name = (user.user_metadata?.name as string | undefined)?.trim();
  return name || user.email?.split("@")[0] || "İstifadəçi";
}
