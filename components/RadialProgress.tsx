"use client";

// İndigo dairəvi progress halqası (rəqəm count-up ilə canlanır).

import { useCountUp } from "@/lib/useCountUp";

interface Props {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
}

export default function RadialProgress({
  value,
  size = 120,
  stroke = 10,
  label,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  const shown = useCountUp(clamped);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e2f4"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#5b4bf5"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-2xl font-bold text-fg">{shown}%</span>
        {label && <span className="mt-1 text-xs text-muted">{label}</span>}
      </div>
    </div>
  );
}
