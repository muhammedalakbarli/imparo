"use client";

// Konfetti — xüsusi <canvas> particle burst (kənar asılılıq yox).
// Bir dəfə partlayır, yerçəkimi + fırlanma ilə düşür, sönür. `prefs.animations`
// söndürülübsə render olunmur. Tam ekran overlay (pointer-events yox).

import { useEffect, useRef } from "react";
import { loadPrefs } from "@/lib/prefs";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vrot: number;
  shape: "rect" | "circle";
}

const COLORS = ["#5b4bf5", "#ff9500", "#22c55e", "#ff6b6b", "#ffb84d", "#9b8cff"];

export default function Confetti({ count = 160 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animate = true;
    try {
      animate = loadPrefs().animations;
    } catch {
      animate = true;
    }
    if (!animate) return;

    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = (canvas.width = window.innerWidth * dpr);
    const H = (canvas.height = window.innerHeight * dpr);
    ctx.scale(dpr, dpr);
    const w = window.innerWidth;
    const h = window.innerHeight;

    // İki mənbədən (aşağı sol/sağ) yuxarı doğru partlayış.
    const parts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const fromLeft = i % 2 === 0;
      const originX = fromLeft ? w * 0.15 : w * 0.85;
      const angle = (fromLeft ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5);
      const speed = 9 + Math.random() * 9;
      parts.push({
        x: originX,
        y: h * 0.62,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 7,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3,
        shape: Math.random() > 0.4 ? "rect" : "circle",
      });
    }

    let raf = 0;
    let frame = 0;
    const gravity = 0.28;

    function tick() {
      frame++;
      ctx!.clearRect(0, 0, W, H);
      let alive = false;
      for (const p of parts) {
        p.vy += gravity;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        if (p.y < h + 40) alive = true;
        const fade = Math.max(0, 1 - frame / 150);
        ctx!.save();
        ctx!.globalAlpha = fade;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.restore();
      }
      if (alive && frame < 160) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx!.clearRect(0, 0, W, H);
      }
    }
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [count]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
