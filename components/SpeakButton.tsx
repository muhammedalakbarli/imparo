"use client";

// İngilis mətni səsləndirən kiçik dinləmə düyməsi.
// Tələffüzü eşitmək dil öyrənmənin əsas hissəsidir.

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { speakEnglish, ttsSupported } from "@/lib/tts";

interface Props {
  text: string; // səsləndiriləcək İngilis mətni
  className?: string;
}

export default function SpeakButton({ text, className = "" }: Props) {
  const [supported] = useState(() => ttsSupported());
  if (!supported) return null;

  return (
    <button
      type="button"
      aria-label="İngiliscə dinlə"
      title="Dinlə"
      onClick={(e) => {
        e.stopPropagation(); // variant seçimini tetikləməsin
        speakEnglish(text);
      }}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full
        text-brand transition hover:bg-brand/10 active:scale-90 ${className}`}
    >
      <Volume2 size={18} />
    </button>
  );
}
