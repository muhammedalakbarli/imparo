"use client";

// Məhsul analitikası (PostHog) — funnel + retensiya ölçmək üçün nazik örtük.
// NEXT_PUBLIC_POSTHOG_KEY YOXDURSA hər şey NO-OP olur → lokal/dev və açar qoyulmayınca
// heç nə sınmır, heç bir şəbəkə sorğusu getmir. Bütün çağırışçılar client komponentlərdir.

import posthog from "posthog-js";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

let started = false;

function on(): boolean {
  return typeof window !== "undefined" && !!KEY;
}

// Bir dəfə brauzerdə işə sal (AnalyticsProvider-dən çağırılır).
export function initAnalytics(): void {
  if (started || !on()) return;
  started = true;
  posthog.init(KEY as string, {
    api_host: HOST,
    capture_pageview: false, // App Router-də əl ilə (aşağıda capturePageview)
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
    respect_dnt: true,
  });
}

// Hadisə göndər (məs. "lesson_completed").
export function track(event: string, props?: Record<string, unknown>): void {
  if (!started || !on()) return;
  posthog.capture(event, props);
}

// İstifadəçini kimliklə bağla (retensiya kohortları üçün) — giriş zamanı.
export function identifyUser(id: string, props?: Record<string, unknown>): void {
  if (!started || !on()) return;
  posthog.identify(id, props);
}

// Çıxışda kimliyi sıfırla ki, növbəti istifadəçi qarışmasın.
export function resetAnalytics(): void {
  if (!started || !on()) return;
  posthog.reset();
}

// Səhifə baxışı (SPA keçidləri) — yalnız yol (pathname), searchParams olmadan.
export function capturePageview(path: string): void {
  if (!started || !on()) return;
  posthog.capture("$pageview", { $current_url: window.location.origin + path });
}
