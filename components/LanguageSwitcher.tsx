"use client";

// Kompakt dil dəyişdirici (AZ / EN / RU) — landing header və s. üçün.
// Dili prefs-ə yazır və mətnlərin yenilənməsi üçün səhifəni təzələyir (ayarlarla eyni davranış).

import { loadPrefs, savePrefs, type Lang } from "@/lib/prefs";
import { useLang } from "@/lib/i18n";

const LANGS: { code: Lang; label: string }[] = [
  { code: "az", label: "AZ" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
];

export default function LanguageSwitcher() {
  const lang = useLang();

  function change(l: Lang) {
    if (l === lang) return;
    savePrefs({ ...loadPrefs(), lang: l });
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-0.5 rounded-2xl border-2 border-line bg-panel p-1">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => change(l.code)}
          aria-label={l.label}
          aria-pressed={lang === l.code}
          className={`rounded-xl px-2.5 py-1 text-sm font-bold transition ${
            lang === l.code ? "bg-brand text-white" : "text-muted hover:text-fg"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
