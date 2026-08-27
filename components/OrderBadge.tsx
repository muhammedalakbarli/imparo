"use client";

// Achievement medalı/ordeni — pilləyə görə metal rəng (0 kilidli · 1 bürünc · 2 gümüş · 3 qızıl).
// İçində achievement ikonu, üstündə parıltı.

import type { LucideIcon } from "lucide-react";

const TIERS: Record<
  number,
  { from: string; to: string; ring: string; ic: string }
> = {
  0: { from: "#eceaf6", to: "#d7d3ea", ring: "#c7c3dd", ic: "#a3a0b5" },
  1: { from: "#F3B884", to: "#C77B3B", ring: "#9C5A28", ic: "#ffffff" },
  2: { from: "#F1F4F9", to: "#B9C2D2", ring: "#8B97AB", ic: "#5a6577" },
  3: { from: "#FFE68A", to: "#F0A800", ring: "#C9880A", ic: "#7a5200" },
};

export default function OrderBadge({
  Icon,
  tier,
  size = 56,
}: {
  Icon: LucideIcon;
  tier: number;
  size?: number;
}) {
  const c = TIERS[tier] ?? TIERS[0];
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg, ${c.from}, ${c.to})`,
        boxShadow: `inset 0 0 0 3px ${c.ring}, 0 2px 4px rgba(0,0,0,0.12)`,
      }}
    >
      <Icon size={Math.round(size * 0.44)} color={c.ic} strokeWidth={2.4} />
      <span
        className="pointer-events-none absolute inset-[3px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.55), transparent 46%)",
        }}
      />
    </span>
  );
}
