"use client";

// Sıralama nişanı — altıbucaqlı 3D fiqur, içində yer nömrəsi (1/2/3).
// Qızıl / gümüş / bürünc rəng + qalınlıq hissi (alt üz + üst parıltı).

import { useId } from "react";

const PALETTE: Record<number, { light: string; main: string; deep: string }> = {
  1: { light: "#FFE68A", main: "#FFC93C", deep: "#C9880A" }, // qızıl
  2: { light: "#EEF2F8", main: "#C7D0DE", deep: "#8B97AB" }, // gümüş
  3: { light: "#F3B884", main: "#E08E4C", deep: "#A65C2B" }, // bürünc
};

// Pointy-top altıbucaqlı (44×48 viewBox).
const HEX = "22,2.5 40.5,13.25 40.5,34.75 22,45.5 3.5,34.75 3.5,13.25";

export default function RankBadge({ rank, size = 40 }: { rank: 1 | 2 | 3; size?: number }) {
  const id = useId();
  const c = PALETTE[rank] ?? PALETTE[3];

  return (
    <svg
      width={size}
      height={(size * 48) / 44}
      viewBox="0 0 44 50"
      fill="none"
      aria-label={`${rank}-ci yer`}
      role="img"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset="1" stopColor={c.main} />
        </linearGradient>
      </defs>

      {/* 3D qalınlıq — tünd alt üz */}
      <polygon points={HEX} fill={c.deep} transform="translate(0,3.5)" />

      {/* üst üz */}
      <polygon
        points={HEX}
        fill={`url(#${id})`}
        stroke={c.deep}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* üst parıltı */}
      <polyline
        points="9,13.5 22,6 35,13.5"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* nömrə */}
      <text
        x="22"
        y="31"
        textAnchor="middle"
        fontSize="21"
        fontWeight="800"
        fill="#ffffff"
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        {rank}
      </text>
    </svg>
  );
}
