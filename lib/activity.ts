// Platformada aktiv keçirilən vaxtın izlənməsi (foreground heartbeat).
// Yalnız tab görünən (visible) və istifadəçi girişli olduqda saniyələr toplanır.
// Admin panelində "Vaxt" sütununda göstərilir. Server tərəf hər çağırışı ≤120s ilə məhdudlaşdırır.

import { createClient } from "./supabase/client";

const BEAT_MS = 30_000; // hər 30 saniyədə bir heartbeat

let started = false;

export function startActivityTracking(): () => void {
  if (started || typeof window === "undefined") return () => {};
  started = true;

  let acc = 0; // yığılmış, hələ göndərilməmiş saniyələr
  let last = Date.now();

  async function flush() {
    const secs = Math.round(acc);
    if (secs <= 0) return;
    acc = 0;
    try {
      await createClient().rpc("bump_active_seconds", { p_seconds: secs });
    } catch {
      // sükutla keç — izləmə kritik deyil
    }
  }

  function tick() {
    const now = Date.now();
    // Yalnız tab görünəndə vaxtı hesabla (arxa fonda dayanır).
    if (document.visibilityState === "visible") {
      acc += Math.min((now - last) / 1000, BEAT_MS / 1000 + 5);
    }
    last = now;
    if (acc >= BEAT_MS / 1000) flush();
  }

  const iv = window.setInterval(tick, BEAT_MS);

  // Tab gizlənəndə/bağlananda qalanı göndər.
  const onHide = () => {
    tick();
    void flush();
  };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onHide);

  return () => {
    window.clearInterval(iv);
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", onHide);
    started = false;
  };
}
