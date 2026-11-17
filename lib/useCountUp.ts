// Rəqəmləri 0-dan hədəf dəyərə qədər yumşaq canlandıran hook.
// requestAnimationFrame + ease-out; hədəf dəyişəndə yenidən başlayır.
//
// İlk dəyər HƏDƏFİN ÖZÜDÜR (0 yox): server HTML-i və JS işləməyən mühit (axtarış
// botları, yavaş şəbəkə) real rəqəmi görür. Əvvəl 0-dan başlayırdı və ana səhifə
// Google-a "0 fənn, 0+ dərs" kimi görünürdü. Animasiya brauzerdə 0-dan oynayır.

import { useEffect, useState } from "react";

export function useCountUp(target: number, durationMs = 1000): number {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (target <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(0);
      return;
    }
    let raf = 0;
    let startTime: number | null = null;

    function tick(now: number) {
      if (startTime === null) startTime = now;
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
