"use client";

// İstifadəçi avatarı — SVG (storage yox). Konfiq: { char, bg }.
// Konfiq yoxdursa seed-dən (ad/username) deterministik default seçilir.

export interface AvatarConfig {
  char: string;
  bg: string;
}

export const AVATAR_CHARS = ["star", "blob", "cat", "robot", "heart", "gem"];
export const AVATAR_BGS = [
  "#5b4bf5",
  "#ff9500",
  "#22c55e",
  "#ff5d73",
  "#38bdf8",
  "#a855f7",
  "#f59e0b",
  "#14b8a6",
];

export function defaultAvatar(seed: string): AvatarConfig {
  let h = 0;
  for (const c of seed || "?") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return {
    char: AVATAR_CHARS[h % AVATAR_CHARS.length],
    bg: AVATAR_BGS[(h >> 3) % AVATAR_BGS.length],
  };
}

// Ağ personaj forması (100×100 viewBox mərkəzli).
function Shape({ char }: { char: string }) {
  const face = (
    <>
      <circle cx="42" cy="52" r="3.4" fill="#2a2340" />
      <circle cx="58" cy="52" r="3.4" fill="#2a2340" />
      <path d="M43 60 q7 7 14 0" stroke="#2a2340" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  );
  switch (char) {
    case "blob":
      return (
        <g fill="#fff">
          <circle cx="50" cy="52" r="30" />
          {face}
        </g>
      );
    case "cat":
      return (
        <g fill="#fff">
          <path d="M28 34 L38 50 L26 52 Z" />
          <path d="M72 34 L62 50 L74 52 Z" />
          <circle cx="50" cy="56" r="26" />
          {face}
        </g>
      );
    case "robot":
      return (
        <g fill="#fff">
          <rect x="52" y="18" width="4" height="12" rx="2" />
          <circle cx="54" cy="16" r="4" />
          <rect x="26" y="30" width="48" height="44" rx="12" />
          {face}
        </g>
      );
    case "heart":
      return (
        <g fill="#fff">
          <path d="M50 78 C18 56 26 30 44 34 C49 35 50 40 50 42 C50 40 51 35 56 34 C74 30 82 56 50 78 Z" />
          <circle cx="43" cy="50" r="3" fill="#2a2340" />
          <circle cx="57" cy="50" r="3" fill="#2a2340" />
          <path d="M44 58 q6 5 12 0" stroke="#2a2340" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </g>
      );
    case "gem":
      return (
        <g fill="#fff">
          <polygon points="50,20 78,40 68,78 32,78 22,40" />
          {face}
        </g>
      );
    case "star":
    default:
      return (
        <g fill="#fff">
          <polygon
            points="50,16 60,40 86,42 65,60 72,86 50,71 28,86 35,60 14,42 40,40"
            stroke="#fff"
            strokeWidth="9"
            strokeLinejoin="round"
          />
          {face}
        </g>
      );
  }
}

export default function Avatar({
  config,
  seed,
  size = 64,
}: {
  config?: AvatarConfig | null;
  seed?: string;
  size?: number;
}) {
  const cfg = config ?? defaultAvatar(seed ?? "?");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl"
      style={{ width: size, height: size, background: cfg.bg }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        <Shape char={cfg.char} />
      </svg>
    </span>
  );
}
