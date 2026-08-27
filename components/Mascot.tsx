"use client";

// "Zefi" — Imparo mascotu. Bu nazik wrapper köhnə `mood` API-ni ZefiMascot-un
// `emotion`-una çevirir ki, bütün çağırış yerləri dəyişmədən işləsin.
// ANİMASİYA YOX — maskot artıq havada üzmür/tərpənmir (statik peşəkar vektor).

import ZefiMascot, { type ZefiEmotion } from "./ZefiMascot";

export type MascotMood = "happy" | "celebrate" | "sad" | "thinking" | "wave" | "love";

const MOOD_TO_EMOTION: Record<MascotMood, ZefiEmotion> = {
  happy: "happy",
  celebrate: "celebrating",
  love: "celebrating",
  sad: "worried",
  thinking: "thinking",
  wave: "welcome",
};

export default function Mascot({
  size = 120,
  mood = "happy",
  badge,
  disk,
}: {
  size?: number;
  mood?: MascotMood;
  // köhnə proplar qəbul edilir amma istifadə olunmur (statik):
  animate?: boolean;
  speaking?: boolean;
  badge?: string;
  /** Tünd rejimdə arxa ağ disk (default açıq) — bax ZefiMascot. */
  disk?: boolean;
}) {
  return <ZefiMascot emotion={MOOD_TO_EMOTION[mood]} size={size} badge={badge} disk={disk} />;
}
