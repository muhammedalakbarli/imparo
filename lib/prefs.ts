// İstifadəçi tərcihləri (localStorage). Animasiyalar tərcihi bütün app-a tətbiq olunur.

export type DarkMode = "system" | "light" | "dark";
export type Lang = "az" | "en" | "ru";

export interface Prefs {
  sound: boolean;
  animations: boolean;
  motivational: boolean;
  listening: boolean;
  darkMode: DarkMode;
  lang: Lang;
}

export const DEFAULT_PREFS: Prefs = {
  sound: true,
  animations: true,
  motivational: true,
  listening: true,
  darkMode: "system",
  lang: "az",
};

const KEY = "imparo-prefs";

export function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(p: Prefs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
  applyPrefs(p);
}

// Tərcihləri DOM-a tətbiq et: animasiyalar + tünd rejim.
export function applyPrefs(p: Prefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("no-anim", !p.animations);

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = p.darkMode === "dark" || (p.darkMode === "system" && prefersDark);
  root.classList.toggle("dark", dark);
}
