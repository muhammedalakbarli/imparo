"use client";

import { useEffect } from "react";

// Service worker-i qeydiyyatdan keçirir (PWA offline + quraşdırma). Yeni versiya
// hazır olanda SƏSSİZ tətbiq olunur — banner/düymə göstərmir, məcburi reload etmir.
// Yeni SW arxa planda aktivləşir və istifadəçi tətbiqi növbəti dəfə açanda ən son
// versiya avtomatik yüklənir (köhnə keşdə ilişib qalmır).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // dev-də SW yükləmir

    let reg: ServiceWorkerRegistration | undefined;

    // Yeni SW nəzarəti ələ alanda səhifəni bir dəfə səssizcə təzələ — bannersiz.
    // Beləliklə hər deploy-dan sonra açıq səhifə avtomatik ən son koda keçir.
    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // Gözləyən (installed) yeni SW-i səssizcə aktivləşdir — bannersiz.
    const activate = (r: ServiceWorkerRegistration) => {
      if (r.waiting) r.waiting.postMessage({ type: "SKIP_WAITING" });
      r.addEventListener("updatefound", () => {
        const sw = r.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && r.waiting) {
            r.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    };

    // Skript URL-inə build kimliyi əlavə olunur ki, hər deploy-da SW YENİ sayılsın.
    // Bunsuz sw.js dəyişmədiyi üçün brauzer yeniləmə axtarmır və istifadəçi köhnə
    // paketdə qalır (bax public/sw.js başlığı). /BUILD_ID hər build-də dəyişir.
    const swUrl = async (): Promise<string> => {
      try {
        const res = await fetch("/BUILD_ID", { cache: "no-store" });
        const id = (await res.text()).trim();
        if (id) return `/sw.js?v=${encodeURIComponent(id.slice(0, 64))}`;
      } catch {
        /* alınmasa versiyasız qeydiyyat — köhnə davranış, sayt yenə işləyir */
      }
      return "/sw.js";
    };

    const register = async () =>
      navigator.serviceWorker
        .register(await swUrl(), { scope: "/" })
        .then((r) => {
          reg = r;
          activate(r);
          // Açıq qalan tətbiqdə də vaxtaşırı yenilik yoxla (səssiz).
          setInterval(() => r.update().catch(() => {}), 60 * 60 * 1000);
        })
        .catch(() => {
          /* qeydiyyat alınmasa səssiz keç — sayt onsuz da işləyir */
        });

    // Səhifə yüklənməsini ləngitməmək üçün load-dan sonra.
    const start = () => void register();
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      void reg;
    };
  }, []);

  return null;
}
