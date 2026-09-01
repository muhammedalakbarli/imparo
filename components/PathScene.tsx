"use client";

// Öyrənmə xəritəsinin FONU — çəmən, təpələr, çay, ağaclar və buludlar.
//
// Niyə SVG, şəkil yox: fon hər ekran enində uzanmalı, tünd rejimdə rəng dəyişməli
// və heç bir şəbəkə sorğusu tələb etməməlidir. Şəkil olsaydı, hər ikisi üçün ayrı
// fayl və mobil internetdə əlavə yük olardı.
//
// Rənglər `currentColor` yox, birbaşa token dəyərləri ilə verilir ki, açıq və
// tünd rejimdə səhnə bütövlükdə uyğun qalsın (bax `.path-scene` — globals.css).

export default function PathScene() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 800 1200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--scene-sky-1)" />
          <stop offset="100%" stopColor="var(--scene-sky-2)" />
        </linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--scene-river-1)" />
          <stop offset="100%" stopColor="var(--scene-river-2)" />
        </linearGradient>
      </defs>

      <rect width="800" height="1200" fill="url(#sky)" />

      {/* Uzaq təpələr — dərinlik hissi üçün iki qat */}
      <path d="M0 210 Q 120 140 260 195 T 540 180 T 800 205 L800 0 L0 0Z" fill="var(--scene-hill-far)" opacity="0.5" />
      <path d="M0 260 Q 160 200 320 250 T 620 240 T 800 268 L800 0 L0 0Z" fill="var(--scene-hill-near)" opacity="0.4" />

      {/* Çay — xəritəni aşağıdan kəsib keçir */}
      <path
        d="M-40 980 C 140 940, 200 1080, 360 1040 S 620 900, 860 960 L860 1240 L-40 1240 Z"
        fill="url(#river)"
        opacity="0.55"
      />

      {/* Ağaclar — sadə konus formaları, təsadüfi görünsün deyə əl ilə yerləşdirilib */}
      {[
        [60, 330, 1], [120, 300, 0.8], [700, 320, 1.1], [745, 290, 0.75],
        [40, 620, 0.9], [90, 660, 1.15], [720, 640, 1], [770, 600, 0.8],
        [55, 900, 1.05], [735, 880, 0.9], [660, 1130, 1.1], [110, 1120, 0.85],
      ].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <ellipse cx="0" cy="34" rx="20" ry="5" fill="var(--scene-shadow)" opacity="0.18" />
          <rect x="-3.5" y="14" width="7" height="20" rx="3" fill="var(--scene-trunk)" />
          <path d="M0 -30 L18 8 L-18 8 Z" fill="var(--scene-tree-1)" />
          <path d="M0 -14 L22 22 L-22 22 Z" fill="var(--scene-tree-2)" />
        </g>
      ))}

      {/* Buludlar */}
      {[[130, 90, 1], [610, 140, 0.85], [420, 60, 0.7]].map(([x, y, s], i) => (
        <g key={`c-${i}`} transform={`translate(${x} ${y}) scale(${s})`} opacity="0.75">
          <circle cx="0" cy="0" r="18" fill="var(--scene-cloud)" />
          <circle cx="22" cy="6" r="14" fill="var(--scene-cloud)" />
          <circle cx="-20" cy="7" r="12" fill="var(--scene-cloud)" />
          <rect x="-20" y="2" width="44" height="14" rx="7" fill="var(--scene-cloud)" />
        </g>
      ))}
    </svg>
  );
}
