"use client";

// Web Push abunəsi — istifadəçini re-engagement bildirişlərinə yazır.
// Abunə Supabase `push_subscriptions` cədvəlində saxlanılır; server (GitHub Actions cron)
// oradan oxuyub push göndərir. VAPID public açarı NEXT_PUBLIC env-dədir.

import { createClient } from "./supabase/client";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Brauzer web-push-u dəstəkləyirmi?
export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Cari icazə vəziyyəti: "granted" | "denied" | "default" | "unsupported".
export function pushPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

// Hazırda abunəyəmi? (SW-də aktiv PushSubscription var?)
export async function isSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

// base64url VAPID açarını Uint8Array-a çevir (PushManager.subscribe tələb edir).
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

// İcazə istə + abunə ol + Supabase-ə yaz. Uğur/uğursuzluq qaytarır.
export async function subscribeToPush(): Promise<{ ok: boolean; error?: string }> {
  if (!pushSupported()) return { ok: false, error: "unsupported" };
  if (!VAPID_PUBLIC) return { ok: false, error: "no_vapid" };
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, error: "denied" };

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "auth" };

    const json = sub.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      },
      { onConflict: "endpoint" },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

// Abunəni ləğv et (brauzerdə + Supabase-dən sil).
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    const supabase = createClient();
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return true;
  } catch {
    return false;
  }
}
