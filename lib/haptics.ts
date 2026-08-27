// Haptik (vibrasiya) — mobil dəstəklənirsə. Animasiya tərcihi/reduced-motion söndürülübsə susur.

import { loadPrefs } from "./prefs";

function allowed(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return false;
  }
  try {
    if (!loadPrefs().animations) return false;
  } catch {
    /* davam */
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return false;
  }
  return true;
}

export function vibrateCorrect() {
  if (allowed()) navigator.vibrate(18);
}

export function vibrateWrong() {
  if (allowed()) navigator.vibrate([0, 30, 40, 30]);
}

export function vibrateCelebrate() {
  if (allowed()) navigator.vibrate([0, 20, 30, 20, 30, 40]);
}
