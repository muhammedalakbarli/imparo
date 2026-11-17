"use client";

import { Volume2 } from "lucide-react";
import { speakText, useSpeaking, type TtsLang } from "@/lib/tts";

interface Props {
  text: string;
  lang?: TtsLang;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "brand" | "soft" | "ghost" | "sheet";
  className?: string;
  title?: string;
}

/**
 * İbtidai sinif şagirdləri üçün səsli oxuma düyməsi.
 * Basıldıqda mətni (riyazi işarələr və boş xanalar çevrilməklə) ucadan oxuyur.
 */
export default function SpeakButton({
  text,
  lang = "az",
  label,
  size = "md",
  variant = "soft",
  className = "",
  title = "Səsli dinlə",
}: Props) {
  const speaking = useSpeaking();

  if (!text || !text.trim()) return null;

  const sizeCls =
    size === "lg"
      ? label
        ? "px-4 py-2.5 text-sm gap-2 rounded-2xl"
        : "h-11 w-11 rounded-2xl"
      : size === "sm"
        ? label
          ? "px-2.5 py-1 text-xs gap-1.5 rounded-xl"
          : "h-8 w-8 rounded-xl"
        : label
          ? "px-3.5 py-2 text-xs gap-1.5 rounded-xl"
          : "h-9 w-9 rounded-xl";

  const variantCls =
    variant === "brand"
      ? "bg-brand text-white shadow-[0_3px_0_0_rgba(0,0,0,0.18)] hover:brightness-105"
      : variant === "sheet"
        ? "bg-white/80 dark:bg-black/25 text-current border border-current/20 hover:bg-white dark:hover:bg-black/40"
        : variant === "ghost"
          ? "bg-transparent text-brand hover:bg-brand-soft/60"
          : "bg-brand-soft text-brand border-2 border-brand/25 shadow-[0_2px_0_0_rgba(249,115,22,0.18)] hover:border-brand/50";

  const iconSize = size === "lg" ? 20 : size === "sm" ? 15 : 18;

  return (
    <button
      type="button"
      title={title}
      aria-label={label ?? title}
      onClick={(e) => {
        e.stopPropagation();
        speakText(text, lang);
      }}
      className={`inline-flex shrink-0 items-center justify-center font-extrabold transition active:translate-y-[1px] active:scale-95 ${sizeCls} ${variantCls} ${className}`}
    >
      <Volume2
        size={iconSize}
        className={speaking ? "animate-pulse" : ""}
      />
      {label && <span>{label}</span>}
    </button>
  );
}
