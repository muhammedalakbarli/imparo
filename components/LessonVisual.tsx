// Dərs izahlarını uşaqlar üçün canlandıran illüstrasiyalar (emojisiz — SVG/CSS).
// Hər dərsin `visual` açarına görə uyğun şəkil göstərilir.

import type { ReactNode } from "react";

// Kəsr zolağı: `parts` bərabər hissə, ilk `filled` qırmızı rənglənir.
function FractionBar({ parts, filled }: { parts: number; filled: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: parts }).map((_, i) => (
        <div
          key={i}
          className={`h-11 flex-1 rounded-md border-2 ${
            i < filled ? "border-brand bg-brand" : "border-line bg-panel-2"
          }`}
        />
      ))}
    </div>
  );
}

function Fraction({ top, bottom }: { top: number | string; bottom: number | string }) {
  return (
    <span className="inline-flex flex-col items-center leading-none">
      <span className="px-2 font-bold text-fg">{top}</span>
      <span className="my-0.5 h-0.5 w-full bg-fg" />
      <span className="px-2 font-bold text-fg">{bottom}</span>
    </span>
  );
}

// Söz kartı (rəngli üst zolaqla).
function WordCard({ word, tag }: { word: string; tag?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel-2 text-center">
      <div className="h-1.5 w-full bg-brand" />
      <div className="flex flex-col items-center gap-1 px-5 py-3">
        <span className="text-lg font-semibold text-fg">{word}</span>
        {tag && <span className="text-xs text-brand-soft">{tag}</span>}
      </div>
    </div>
  );
}

// Kiçik dairə (say nümunələri üçün).
function Dot({ tone }: { tone: "brand" | "green" }) {
  return (
    <span
      className={`inline-block h-4 w-4 rounded-full ${
        tone === "brand" ? "bg-brand" : "bg-emerald-500"
      }`}
    />
  );
}

// Sadə alma illüstrasiyası (SVG).
function Apple({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M24 15c-4-6-15-4-15 7 0 10 8 17 15 17s15-7 15-17c0-11-11-13-15-7z"
        fill="#5b4bf5"
      />
      <rect x="22.7" y="7" width="2.6" height="9" rx="1.3" fill="#7a4a2b" />
      <path d="M25 9c3-3 8-2 8-2s-1 6-8 4z" fill="#4caf50" />
    </svg>
  );
}

// Kitab illüstrasiyası (SVG düzbucaqlı).
function Book({ w = 34, h = 46 }: { w?: number; h?: number }) {
  return (
    <div
      className="rounded-md bg-brand/70 ring-1 ring-brand"
      style={{ width: w, height: h }}
    />
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 rounded-xl border border-line bg-ink/60 p-4">
      {children}
    </div>
  );
}

// 1-dən 10-a sayma — oxumağı yenicə öyrənən uşaq üçün mətn əvəzinə şəkil:
// hər rəqəm öz rəngində, altında o qədər ulduz (miqdarı GÖRÜR), sonra "3 → 4" sırası.
const COUNT_COLORS = [
  "#f47b3a", "#e9a23b", "#2fb170", "#38bdf8", "#8b5cf6",
  "#ff6b5e", "#0ea5e9", "#f59e0b", "#10b981", "#ec4899",
];

function CountingCards({ from, to }: { from: number; to: number }) {
  const nums = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  return (
    <div className="mt-5 rounded-2xl border border-line bg-card p-3 sm:p-4">
      <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
        {nums.map((n, i) => {
          const c = COUNT_COLORS[i % COUNT_COLORS.length];
          return (
            <div
              key={n}
              className="flex flex-col items-center rounded-xl border-2 bg-white px-1 pb-2 pt-1.5"
              style={{ borderColor: `${c}55` }}
            >
              <span className="text-3xl font-extrabold leading-none sm:text-4xl" style={{ color: c }}>
                {n}
              </span>
              {/* n ulduz — sıralar QƏSDƏN 5-lik: 7 = 5 + 2, uşaq beşliklə sayır */}
              <span className="mt-1.5 flex flex-col items-center gap-[2px]" aria-hidden>
                {[Math.min(n, 5), Math.max(n - 5, 0)].filter(Boolean).map((cnt, row) => (
                  <span key={row} className="flex gap-[2px]">
                    {Array.from({ length: cnt }).map((_, k) => (
                      <svg key={k} width="8" height="8" viewBox="0 0 24 24" fill={c}>
                        <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7L12 17.8 5.8 21.2l1.6-7L2 9.5l7.1-.6z" />
                      </svg>
                    ))}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2" aria-label="3-dən sonra 4 gəlir">
        {[3, 4, 5].map((n, i) => (
          <div key={n} className="flex items-center gap-2">
            {i > 0 && (
              <span className="flex flex-col items-center text-[11px] font-bold text-muted">
                <span className="text-2xl leading-none text-brand">→</span>
                sonra
              </span>
            )}
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-[0_3px_0_0_rgba(0,0,0,0.12)]"
              style={{ background: COUNT_COLORS[n - 1] }}
            >
              {n}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function resolveLessonVisual(raw: string): string {
  // Əgər artıq birbaşa visual açarıdırsa və aşağıda varsa, olduğu kimi saxla
  if (raw === "count-1-10") return "count-1-10";

  // ── Riyaziyyat 1–4 dərs id-lərinə görə uyğun визуal ──
  if (/^ry1-sayma-l1$|^ry1-eded10-mesq$/.test(raw)) return "count-1-10";
  if (/^ry1-sayma-l2$|^ry1-olcme-l3$|^ry2-yuzluk-l2$/.test(raw)) return "compare-1-10";
  if (/^ry[12]-toplama-/.test(raw)) return "add-10";
  if (/^ry[12]-cixma-|^ry1-hesab10-mesq$/.test(raw)) return "sub-10";
  if (/^ry1-onluq-|^ry1-yirmi-|^ry1-eded20-mesq$|^ry2-yuzluk-l[13]$/.test(raw)) return "count-11-20";
  if (/^ry3-min-|^ry4-boyuk-/.test(raw)) return "place-value";
  if (/^ry3-toplama-/.test(raw)) return "column-add";
  if (/^ry1-fiqur-l1$|^ry1-fiqur-mesq$|^ry2-olcme-l4$|^ry3-hendese-l[13]$|^ry4-sahe-l1$/.test(raw)) return "shapes-basic";
  if (/^ry1-fiqur-l2$|^ry2-olcme-l2$|^ry3-hendese-l2$|^ry4-sahe-l2$/.test(raw)) return "word-problems";
  if (/^ry1-olcme-l1$|^ry2-olcme-l1$/.test(raw)) return "measure-length";
  if (/^ry1-olcme-l2$/.test(raw)) return "measure-weight";
  if (/^ry1-zaman-l1$/.test(raw)) return "time-days";
  if (/^ry1-zaman-l2$|^ry2-olcme-l3$/.test(raw)) return "time-clock";
  if (/^ry1-zaman-l3$/.test(raw)) return "money-azn";
  if (/^ry[234]-vurma-/.test(raw)) return "mul-groups";
  if (/^ry3-bolme-l2$/.test(raw)) return "remainder";
  if (/^ry[234]-bolme-/.test(raw)) return "div-groups";
  if (/^ry3-kesr-l1$|^ry4-kesr-l1$|^ry4-onluq-/.test(raw)) return "fraction-basic";
  if (/^ry3-kesr-l2$/.test(raw)) return "fraction-compare";
  if (/^ry4-kesr-l2$/.test(raw)) return "fraction-add";
  if (/^ry4-sahe-l3$/.test(raw)) return "order-ops";

  // ── Azərbaycan dili 1–4 ──
  if (/^az1-ses-l1$|^az1-yazi-l[12]$|^az2-elifba-|^az3-qurulus-|^az4-soz-/.test(raw)) return "az-letters";
  if (/^az1-sait-|^az1-qalinince-|^az1-ses-mesq$|^az2-sait-l1$|^az3-fonetika-/.test(raw)) return "az-vowels";
  if (/^az1-samit-/.test(raw)) return "az-consonants";
  if (/^az1-heca-|^az2-sait-l2$/.test(raw)) return "az-syllables";
  if (/^az1-soz-|^az1-yazi-l3$|^az3-cumle-|^az4-uzvler-/.test(raw)) return "az-sentence";
  if (/^az1-kimne-|^az[234]-isim-|^az4-evezlik-/.test(raw)) return "noun-cards";
  if (/^az2-sifet-|^az3-sifetsay-|^az4-zerf-/.test(raw)) return "adjective-apple";
  if (/^az[23]-feil-/.test(raw)) return "verb-timeline";
  if (/^az2-mena-/.test(raw)) return "leksika";
  if (/^az1-oxu-|^az1-nezaket-|^az1-nagil-|^az4-metn-/.test(raw)) return "az-reading";

  // ── İngilis dili 1–4 ──
  if (/^en1-greetings-|^en1-hello-/.test(raw)) return "en-greetings";
  if (/^en1-numbers-|^en2-numbers-/.test(raw)) return "en-numbers";
  if (/^en1-colors-|^en1-numcolor-/.test(raw)) return "en-colors";
  if (/^en1-animals-/.test(raw)) return "en-animals";
  if (/^en1-family-/.test(raw)) return "en-family";
  if (/^en1-school-|^en1-famschool-|^en2-things-vocab$/.test(raw)) return "en-school";
  if (/^en2-things-plural$/.test(raw)) return "plural-books";
  if (/^en1-body-vocab$|^en1-body-listen$/.test(raw)) return "en-body";
  if (/^en1-body-clothes$|^en2-body-/.test(raw)) return "en-clothes";
  if (/^en[12]-food-/.test(raw)) return "en-food";
  if (/^en2-days-|^en3-routine-/.test(raw)) return "en-days";
  // ── Bölmə məşqi / sınaq dərsləri və ümumi ehtiyat (1–4-cü sinif) ──
  if (/^ry1-eded10-/.test(raw)) return "count-1-10";
  if (/^ry1-hesab10-/.test(raw)) return "add-10";
  if (/^ry1-eded20-/.test(raw)) return "count-11-20";
  if (/^ry1-fiqur-/.test(raw)) return "shapes-basic";
  if (/^ry1-olcme-/.test(raw)) return "measure-length";
  if (/^ry1-zaman-/.test(raw)) return "time-clock";
  if (/^ry1-/.test(raw)) return "count-1-10";
  if (/^ry2-/.test(raw)) return "count-11-20";
  if (/^ry3-/.test(raw)) return "mul-groups";
  if (/^ry4-/.test(raw)) return "place-value";
  if (/^az1-/.test(raw)) return "az-letters";
  if (/^az2-/.test(raw)) return "az-syllables";
  if (/^az3-/.test(raw)) return "az-sentence";
  if (/^az4-/.test(raw)) return "az-reading";
  if (/^en1-/.test(raw)) return "en-greetings";
  if (/^en[234]-/.test(raw)) return "en-actions";

  return raw;
}

export default function LessonVisual({ visual }: { visual?: string }) {
  if (!visual) return null;
  const resolved = resolveLessonVisual(visual);

  switch (resolved) {
    // ── 1-ci sinif: sayma ───────────────────────────────────────
    case "count-1-10":
      return <CountingCards from={1} to={10} />;

    case "compare-1-10":
      return (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
              <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">7 &gt; 3</div>
              <div className="mt-1 text-xs font-bold text-fg">Böyükdür</div>
              <div className="mt-1 text-[11px] text-muted">Açıq ağız böyüyə baxır</div>
            </div>
            <div className="rounded-2xl border-2 border-sky-300 bg-sky-50/80 p-3 dark:border-sky-500/30 dark:bg-sky-500/10">
              <div className="text-2xl font-extrabold text-sky-700 dark:text-sky-300">3 &lt; 7</div>
              <div className="mt-1 text-xs font-bold text-fg">Kiçikdir</div>
              <div className="mt-1 text-[11px] text-muted">İti ucu kiçiyə baxır</div>
            </div>
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/80 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">4 = 4</div>
              <div className="mt-1 text-xs font-bold text-fg">Bərabərdir</div>
              <div className="mt-1 text-[11px] text-muted">İki tərəf eynidir</div>
            </div>
          </div>
        </div>
      );

    case "add-10":
      return (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4">
          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-3.5 py-2.5 dark:bg-amber-500/10">
              <div className="text-2xl">🍎🍎</div>
              <div className="mt-1 text-lg font-extrabold text-fg">2</div>
            </div>
            <span className="text-2xl font-extrabold text-brand">+</span>
            <div className="rounded-2xl border-2 border-sky-300 bg-sky-50 px-3.5 py-2.5 dark:bg-sky-500/10">
              <div className="text-2xl">🍎🍎🍎</div>
              <div className="mt-1 text-lg font-extrabold text-fg">3</div>
            </div>
            <span className="text-2xl font-extrabold text-muted">=</span>
            <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-3.5 py-2.5 dark:bg-emerald-500/10">
              <div className="text-2xl">🍎🍎🍎🍎🍎</div>
              <div className="mt-1 text-lg font-extrabold text-emerald-700 dark:text-emerald-300">5</div>
            </div>
          </div>
        </div>
      );

    case "sub-10":
      return (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[0, 1, 2, 3, 4].map((i) => {
              const crossed = i >= 3;
              return (
                <span
                  key={i}
                  className={`relative inline-flex h-11 w-11 items-center justify-center rounded-2xl text-2xl ${
                    crossed
                      ? "border-2 border-dashed border-red-300 bg-red-50/70 opacity-45"
                      : "border-2 border-amber-300 bg-amber-50"
                  }`}
                >
                  🍎
                  {crossed && (
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-red-600">
                      ✕
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          <div className="mt-3 text-lg font-extrabold text-fg">
            5 − <span className="text-red-500">2</span> = <span className="text-emerald-600">3</span>
          </div>
        </div>
      );

    case "count-11-20":
      return (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4">
          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-2.5 dark:bg-amber-500/10">
              <div className="text-xs font-extrabold uppercase text-amber-700 dark:text-amber-300">1 onluq (10)</div>
              <div className="mt-1 grid grid-cols-5 gap-1 text-lg">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i}>⭐</span>
                ))}
              </div>
            </div>
            <span className="text-2xl font-extrabold text-brand">+</span>
            <div className="rounded-2xl border-2 border-sky-300 bg-sky-50 px-4 py-2.5 dark:bg-sky-500/10">
              <div className="text-xs font-extrabold uppercase text-sky-700 dark:text-sky-300">5 təklik (5)</div>
              <div className="mt-1 flex justify-center gap-1 text-lg">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>⭐</span>
                ))}
              </div>
            </div>
            <span className="text-2xl font-extrabold text-muted">=</span>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-3xl font-extrabold text-white shadow-sm">
              15
            </div>
          </div>
        </div>
      );

    case "shapes-basic":
      return (
        <div className="mt-5 grid grid-cols-2 gap-2.5 rounded-2xl border border-line bg-card p-4 sm:grid-cols-4">
          {[
            { name: "Dairə", desc: "0 künc", color: "#10B981", svg: <circle cx="32" cy="32" r="24" fill="#10B981" /> },
            { name: "Üçbucaq", desc: "3 tərəf", color: "#F97316", svg: <polygon points="32,8 58,56 6,56" fill="#F97316" /> },
            { name: "Kvadrat", desc: "4 bərabər tərəf", color: "#3B82F6", svg: <rect x="10" y="10" width="44" height="44" rx="4" fill="#3B82F6" /> },
            { name: "Düzbucaqlı", desc: "2 uzun, 2 qısa", color: "#8B5CF6", svg: <rect x="4" y="16" width="56" height="32" rx="4" fill="#8B5CF6" /> },
          ].map((s) => (
            <div key={s.name} className="flex flex-col items-center rounded-xl border border-line bg-panel p-2.5 text-center">
              <svg viewBox="0 0 64 64" className="h-14 w-14">{s.svg}</svg>
              <div className="mt-1 text-sm font-extrabold text-fg">{s.name}</div>
              <div className="text-[11px] font-semibold text-muted">{s.desc}</div>
            </div>
          ))}
        </div>
      );

    case "word-problems":
      return (
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-card p-4">
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/70 p-3 text-center dark:bg-emerald-500/10">
            <div className="text-2xl font-extrabold text-emerald-600">+ Toplama</div>
            <div className="mt-1 text-xs font-bold text-fg">aldı · gəldi · əlavə etdi · cəmi</div>
            <div className="mt-2 text-lg">🍎🍎🍎 + 🍎🍎 = 5</div>
          </div>
          <div className="rounded-xl border-2 border-rose-300 bg-rose-50/70 p-3 text-center dark:bg-rose-500/10">
            <div className="text-2xl font-extrabold text-rose-600">− Çıxma</div>
            <div className="mt-1 text-xs font-bold text-fg">uçdu · verdi · düşdü · qaldı</div>
            <div className="mt-2 text-lg">🐦🐦🐦🐦🐦 − 2 = 3</div>
          </div>
        </div>
      );

    case "measure-length":
      return (
        <div className="mt-5 space-y-2.5 rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="w-16 text-xs font-extrabold text-fg">Uzun</span>
            <div className="h-5 flex-1 rounded-full bg-brand" />
            <span className="text-xs font-bold text-muted">7 sm</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 text-xs font-extrabold text-fg">Qısa</span>
            <div className="h-5 w-2/5 rounded-full bg-sky-400" />
            <span className="text-xs font-bold text-muted">3 sm</span>
          </div>
          <div className="pt-1 text-center text-xs font-extrabold text-muted">
            📏 Uzunluğu xətkeşlə ölçürük · 1 metr = 100 santimetr
          </div>
        </div>
      );

    case "measure-weight":
      return (
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-card p-4 text-center">
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50/80 p-3 dark:bg-amber-500/10">
            <div className="text-3xl">🪨</div>
            <div className="mt-1 text-sm font-extrabold text-fg">Ağır (Daş)</div>
            <div className="text-xs text-muted">Tərəzinin gözü aşağı enir</div>
          </div>
          <div className="rounded-xl border-2 border-sky-300 bg-sky-50/80 p-3 dark:bg-sky-500/10">
            <div className="text-3xl">🪶</div>
            <div className="mt-1 text-sm font-extrabold text-fg">Yüngül (Lələk)</div>
            <div className="text-xs text-muted">1 kq = 1000 qram</div>
          </div>
        </div>
      );

    case "time-days":
      return (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { e: "🌅", t: "Səhər" },
              { e: "☀️", t: "Günorta" },
              { e: "🌇", t: "Axşam" },
              { e: "🌙", t: "Gecə" },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border border-line bg-panel p-2.5">
                <div className="text-2xl">{x.e}</div>
                <div className="mt-1 text-xs font-extrabold text-fg">{x.t}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center text-xs font-extrabold text-muted">
            📅 1 həftə = 7 gün · 1 il = 12 ay = 4 fəsil
          </div>
        </div>
      );

    case "time-clock":
      return (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-5 rounded-2xl border border-line bg-card p-4">
          <svg viewBox="0 0 100 100" className="h-24 w-24">
            <circle cx="50" cy="50" r="44" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="4" />
            <text x="50" y="18" textAnchor="middle" fontSize="10" fontWeight="800" fill="#78350F">12</text>
            <text x="84" y="53" textAnchor="middle" fontSize="10" fontWeight="800" fill="#78350F">3</text>
            <text x="50" y="88" textAnchor="middle" fontSize="10" fontWeight="800" fill="#78350F">6</text>
            <text x="16" y="53" textAnchor="middle" fontSize="10" fontWeight="800" fill="#78350F">9</text>
            <line x1="50" y1="50" x2="50" y2="22" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="50" x2="72" y2="50" stroke="#EF4444" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="3.5" fill="#78350F" />
          </svg>
          <div className="space-y-1.5 text-sm font-bold">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <span className="h-3 w-3 rounded-full bg-red-500" /> Qısa əqrəb → Saatı göstərir
            </div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <span className="h-3 w-3 rounded-full bg-blue-600" /> Uzun əqrəb → Dəqiqəni göstərir
            </div>
            <div className="text-xs text-muted">1 saat = 60 dəqiqə · Saat 3 tamam</div>
          </div>
        </div>
      );

    case "money-azn":
      return (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {["10 qəpik", "20 qəpik", "50 qəpik"].map((c) => (
              <span
                key={c}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-100 text-xs font-extrabold text-amber-900 shadow-xs"
              >
                {c}
              </span>
            ))}
            <span className="text-xl font-extrabold text-brand">=</span>
            <span className="inline-flex items-center gap-1 rounded-2xl border-2 border-emerald-500 bg-emerald-100 px-4 py-3 text-base font-extrabold text-emerald-900 shadow-xs">
              💵 1 Manat (100 qəpik)
            </span>
          </div>
        </div>
      );

    case "mul-groups":
      return (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {[1, 2, 3].map((g) => (
              <div key={g} className="rounded-xl border-2 border-violet-300 bg-violet-50 px-3 py-2 text-xl dark:bg-violet-500/10">
                ⭐⭐⭐⭐
              </div>
            ))}
          </div>
          <div className="mt-2.5 text-sm font-extrabold text-fg">
            4 + 4 + 4 = <span className="text-brand">3 × 4 = 12</span>
          </div>
        </div>
      );

    case "div-groups":
      return (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4 text-center">
          <div className="text-sm font-extrabold text-fg">12 almanı 3 səbətə bərabər bölək:</div>
          <div className="mt-2.5 flex flex-wrap justify-center gap-3">
            {[1, 2, 3].map((b) => (
              <div key={b} className="rounded-xl border-2 border-sky-300 bg-sky-50 px-3 py-2 dark:bg-sky-500/10">
                <div className="text-lg">🍎🍎🍎🍎</div>
                <div className="text-xs font-bold text-sky-800 dark:text-sky-200">4 alma</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm font-extrabold text-brand">12 : 3 = 4</div>
        </div>
      );

    case "az-letters":
      return (
        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-card p-3.5 text-center">
          {[
            { l: "A a", w: "alma", e: "🍎" },
            { l: "K k", w: "kitab", e: "📖" },
            { l: "D d", w: "dovşan", e: "🐰" },
            { l: "G g", w: "gül", e: "🌸" },
          ].map((x) => (
            <div key={x.l} className="rounded-xl border border-line bg-panel p-2">
              <div className="text-2xl">{x.e}</div>
              <div className="mt-1 text-base font-extrabold text-brand">{x.l}</div>
              <div className="text-xs font-bold text-fg">{x.w}</div>
            </div>
          ))}
        </div>
      );

    case "az-vowels":
      return (
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-line bg-card p-4 text-center">
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50/80 p-3 dark:bg-amber-500/10">
            <div className="text-sm font-extrabold text-amber-800 dark:text-amber-300">Qalın saitlər (4)</div>
            <div className="mt-2 flex justify-center gap-1.5">
              {["a", "ı", "o", "u"].map((v) => (
                <span key={v} className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-lg font-extrabold text-white">
                  {v}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border-2 border-sky-300 bg-sky-50/80 p-3 dark:bg-sky-500/10">
            <div className="text-sm font-extrabold text-sky-800 dark:text-sky-300">İncə saitlər (5)</div>
            <div className="mt-2 flex justify-center gap-1">
              {["e", "ə", "i", "ö", "ü"].map((v) => (
                <span key={v} className="flex h-9 w-8 items-center justify-center rounded-xl bg-sky-500 text-lg font-extrabold text-white">
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      );

    case "az-consonants":
      return (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4 text-center">
          <div className="text-sm font-extrabold text-fg">23 Samit səs + Sait səs = Heca</div>
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-xl bg-violet-500 px-3.5 py-2 text-lg font-extrabold text-white">b, d, k, l, m, n, r, s, ş, t...</span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-base font-extrabold">
            <span className="rounded-xl border-2 border-violet-300 bg-violet-50 px-3 py-1 text-violet-800">k (samit)</span>
            <span className="text-brand">+</span>
            <span className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-1 text-amber-800">a (sait)</span>
            <span className="text-brand">→</span>
            <span className="rounded-xl bg-emerald-500 px-3.5 py-1 text-white">ka</span>
          </div>
        </div>
      );

    case "az-syllables":
      return (
        <div className="mt-5 grid grid-cols-3 gap-2.5 rounded-2xl border border-line bg-card p-4 text-center">
          {[
            { e: "💧", w: "su", s: ["su"], c: "1 heca" },
            { e: "🍎", w: "al-ma", s: ["al", "ma"], c: "2 heca" },
            { e: "🏫", w: "mək-təb-li", s: ["mək", "təb", "li"], c: "3 heca" },
          ].map((x) => (
            <div key={x.w} className="rounded-xl border border-line bg-panel p-2.5">
              <div className="text-2xl">{x.e}</div>
              <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                {x.s.map((part, i) => (
                  <span key={i} className="rounded-lg bg-brand-soft px-2 py-0.5 text-xs font-extrabold text-brand">
                    {part}
                  </span>
                ))}
              </div>
              <div className="mt-1 text-[11px] font-bold text-muted">{x.c}</div>
            </div>
          ))}
        </div>
      );

    case "az-sentence":
      return (
        <div className="mt-5 rounded-2xl border border-line bg-card p-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-base font-extrabold">
            <span className="rounded-xl border-2 border-emerald-400 bg-emerald-50 px-3 py-2 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
              <span className="text-emerald-600 underline">U</span>şaq
            </span>
            <span className="rounded-xl border-2 border-sky-300 bg-sky-50 px-3 py-2 text-sky-800 dark:bg-sky-500/10 dark:text-sky-200">
              kitab
            </span>
            <span className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              oxuyur<span className="text-red-600">.</span>
            </span>
          </div>
          <div className="mt-2.5 text-xs font-bold text-muted">
            ✍️ Cümlə <b className="text-fg">BÖYÜK hərflə</b> başlayır və <b className="text-fg">nöqtə (. ? !)</b> ilə bitir
          </div>
        </div>
      );

    case "az-reading":
      return (
        <div className="mt-5 grid grid-cols-3 gap-2.5 rounded-2xl border border-line bg-card p-4 text-center">
          <div className="rounded-xl border border-line bg-panel p-2.5">
            <div className="text-2xl">🧚</div>
            <div className="mt-1 text-xs font-extrabold text-fg">Nağıl</div>
            <div className="text-[11px] text-muted">Biri var idi...</div>
          </div>
          <div className="rounded-xl border border-line bg-panel p-2.5">
            <div className="text-2xl">🎵</div>
            <div className="mt-1 text-xs font-extrabold text-fg">Şeir</div>
            <div className="text-[11px] text-muted">gül — bülbül</div>
          </div>
          <div className="rounded-xl border border-line bg-panel p-2.5">
            <div className="text-2xl">🧩</div>
            <div className="mt-1 text-xs font-extrabold text-fg">Tapmaca</div>
            <div className="text-[11px] text-muted">Düşün və tap</div>
          </div>
        </div>
      );

    case "en-greetings":
      return (
        <div className="mt-5 grid grid-cols-2 gap-2.5 rounded-2xl border border-line bg-card p-4 sm:grid-cols-4">
          {[
            { e: "👋", en: "Hello", az: "Salam" },
            { e: "🌅", en: "Good morning", az: "Sabahın xeyir" },
            { e: "🙏", en: "Thank you", az: "Təşəkkür" },
            { e: "👋", en: "Goodbye", az: "Sağ ol" },
          ].map((x) => (
            <div key={x.en} className="rounded-xl border border-line bg-panel p-2.5 text-center">
              <div className="text-2xl">{x.e}</div>
              <div className="mt-1 text-sm font-extrabold text-brand">{x.en}</div>
              <div className="text-xs font-semibold text-muted">{x.az}</div>
            </div>
          ))}
        </div>
      );

    case "en-numbers":
      return (
        <div className="mt-5 grid grid-cols-5 gap-2 rounded-2xl border border-line bg-card p-3.5 text-center">
          {[
            ["1", "one"], ["2", "two"], ["3", "three"], ["4", "four"], ["5", "five"],
            ["6", "six"], ["7", "seven"], ["8", "eight"], ["9", "nine"], ["10", "ten"],
          ].map(([d, w], i) => (
            <div key={d} className="rounded-xl border border-line bg-panel p-2">
              <div className="text-xl font-extrabold" style={{ color: COUNT_COLORS[i] }}>{d}</div>
              <div className="text-xs font-extrabold text-fg">{w}</div>
            </div>
          ))}
        </div>
      );

    case "en-colors":
      return (
        <div className="mt-5 grid grid-cols-4 gap-2.5 rounded-2xl border border-line bg-card p-4 text-center">
          {[
            { hex: "#EF4444", en: "red", az: "qırmızı" },
            { hex: "#3B82F6", en: "blue", az: "mavi" },
            { hex: "#22C55E", en: "green", az: "yaşıl" },
            { hex: "#FACC15", en: "yellow", az: "sarı" },
            { hex: "#F97316", en: "orange", az: "narıncı" },
            { hex: "#EC4899", en: "pink", az: "çəhrayı" },
            { hex: "#1E293B", en: "black", az: "qara" },
            { hex: "#FFFFFF", en: "white", az: "ağ", border: true },
          ].map((c) => (
            <div key={c.en} className="flex flex-col items-center rounded-xl border border-line bg-panel p-2">
              <span
                className={`h-8 w-8 rounded-full shadow-xs ${c.border ? "border-2 border-slate-300" : ""}`}
                style={{ backgroundColor: c.hex }}
              />
              <span className="mt-1 text-xs font-extrabold text-fg">{c.en}</span>
              <span className="text-[10px] font-semibold text-muted">{c.az}</span>
            </div>
          ))}
        </div>
      );

    case "en-animals":
      return (
        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-card p-3.5 text-center">
          {[
            { e: "🐱", en: "cat", az: "pişik" },
            { e: "🐶", en: "dog", az: "it" },
            { e: "🐟", en: "fish", az: "balıq" },
            { e: "🐦", en: "bird", az: "quş" },
            { e: "🦁", en: "lion", az: "şir" },
            { e: "🐰", en: "rabbit", az: "dovşan" },
            { e: "🐻", en: "bear", az: "ayı" },
            { e: "🐘", en: "elephant", az: "fil" },
          ].map((a) => (
            <div key={a.en} className="rounded-xl border border-line bg-panel p-2">
              <div className="text-2xl">{a.e}</div>
              <div className="mt-0.5 text-xs font-extrabold text-brand">{a.en}</div>
              <div className="text-[10px] font-semibold text-muted">{a.az}</div>
            </div>
          ))}
        </div>
      );

    case "en-family":
      return (
        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-card p-3.5 text-center">
          {[
            { e: "👩", en: "mother", az: "ana" },
            { e: "👨", en: "father", az: "ata" },
            { e: "👧", en: "sister", az: "bacı" },
            { e: "👦", en: "brother", az: "qardaş" },
          ].map((x) => (
            <div key={x.en} className="rounded-xl border border-line bg-panel p-2.5">
              <div className="text-2xl">{x.e}</div>
              <div className="mt-1 text-xs font-extrabold text-brand">{x.en}</div>
              <div className="text-[11px] font-semibold text-muted">{x.az}</div>
            </div>
          ))}
        </div>
      );

    case "en-school":
      return (
        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-card p-3.5 text-center">
          {[
            { e: "📖", en: "book", az: "kitab" },
            { e: "🖊️", en: "pen", az: "qələm" },
            { e: "🎒", en: "bag", az: "çanta" },
            { e: "🏫", en: "school", az: "məktəb" },
          ].map((x) => (
            <div key={x.en} className="rounded-xl border border-line bg-panel p-2.5">
              <div className="text-2xl">{x.e}</div>
              <div className="mt-1 text-xs font-extrabold text-brand">{x.en}</div>
              <div className="text-[11px] font-semibold text-muted">{x.az}</div>
            </div>
          ))}
        </div>
      );

    case "en-body":
      return (
        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-card p-3.5 text-center">
          {[
            { e: "👀", en: "eye", az: "göz" },
            { e: "👂", en: "ear", az: "qulaq" },
            { e: "👃", en: "nose", az: "burun" },
            { e: "✋", en: "hand", az: "əl" },
          ].map((x) => (
            <div key={x.en} className="rounded-xl border border-line bg-panel p-2.5">
              <div className="text-2xl">{x.e}</div>
              <div className="mt-1 text-xs font-extrabold text-brand">{x.en}</div>
              <div className="text-[11px] font-semibold text-muted">{x.az}</div>
            </div>
          ))}
        </div>
      );

    case "en-clothes":
      return (
        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-card p-3.5 text-center">
          {[
            { e: "🎩", en: "hat", az: "papaq" },
            { e: "👕", en: "shirt", az: "köynək" },
            { e: "👟", en: "shoes", az: "ayaqqabı" },
            { e: "🧥", en: "coat", az: "palto" },
          ].map((x) => (
            <div key={x.en} className="rounded-xl border border-line bg-panel p-2.5">
              <div className="text-2xl">{x.e}</div>
              <div className="mt-1 text-xs font-extrabold text-brand">{x.en}</div>
              <div className="text-[11px] font-semibold text-muted">{x.az}</div>
            </div>
          ))}
        </div>
      );

    case "en-food":
      return (
        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-card p-3.5 text-center">
          {[
            { e: "🍎", en: "apple", az: "alma" },
            { e: "🍌", en: "banana", az: "banan" },
            { e: "🍞", en: "bread", az: "çörək" },
            { e: "🥛", en: "milk", az: "süd" },
          ].map((x) => (
            <div key={x.en} className="rounded-xl border border-line bg-panel p-2.5">
              <div className="text-2xl">{x.e}</div>
              <div className="mt-1 text-xs font-extrabold text-brand">{x.en}</div>
              <div className="text-[11px] font-semibold text-muted">{x.az}</div>
            </div>
          ))}
        </div>
      );

    case "en-days":
      return (
        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-card p-3.5 text-center">
          {[
            { e: "❄️", en: "Winter", az: "Qış" },
            { e: "🌷", en: "Spring", az: "Yaz" },
            { e: "☀️", en: "Summer", az: "Yay" },
            { e: "🍂", en: "Autumn", az: "Payız" },
          ].map((x) => (
            <div key={x.en} className="rounded-xl border border-line bg-panel p-2.5">
              <div className="text-2xl">{x.e}</div>
              <div className="mt-1 text-xs font-extrabold text-brand">{x.en}</div>
              <div className="text-[11px] font-semibold text-muted">{x.az}</div>
            </div>
          ))}
        </div>
      );

    case "en-actions":
      return (
        <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-card p-3.5 text-center">
          {[
            { e: "🏃", en: "run", az: "qaçmaq" },
            { e: "🏊", en: "swim", az: "üzmək" },
            { e: "📖", en: "read", az: "oxumaq" },
            { e: "🎤", en: "sing", az: "oxumaq (mahnı)" },
          ].map((x) => (
            <div key={x.en} className="rounded-xl border border-line bg-panel p-2.5">
              <div className="text-2xl">{x.e}</div>
              <div className="mt-1 text-xs font-extrabold text-brand">{x.en}</div>
              <div className="text-[11px] font-semibold text-muted">{x.az}</div>
            </div>
          ))}
        </div>
      );

    // ── Riyaziyyat ──────────────────────────────────────────────
    case "fraction-basic":
      return (
        <Frame>
          <div className="flex items-center gap-5">
            <div className="flex-1">
              <FractionBar parts={4} filled={3} />
              <p className="mt-2 text-center text-sm text-muted">
                4 hissəyə bölünüb, 3-ü götürülüb
              </p>
            </div>
            <div className="text-3xl">
              <Fraction top={3} bottom={4} />
            </div>
          </div>
          <div className="mt-3 flex justify-around text-xs">
            <span className="text-fg">surət = götürülən hissə</span>
            <span className="text-fg">məxrəc = ümumi hissə</span>
          </div>
        </Frame>
      );

    case "fraction-compare":
      return (
        <Frame>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-10 text-fg">
                <Fraction top={5} bottom={8} />
              </span>
              <div className="flex-1">
                <FractionBar parts={8} filled={5} />
              </div>
              <span className="font-semibold text-brand-soft">böyük</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-10 text-fg">
                <Fraction top={3} bottom={8} />
              </span>
              <div className="flex-1">
                <FractionBar parts={8} filled={3} />
              </div>
              <span className="text-muted">kiçik</span>
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            Çox hissə götürülübsə, kəsr daha böyükdür
          </p>
        </Frame>
      );

    case "fraction-add":
      return (
        <Frame>
          <div className="flex items-center justify-center gap-3 text-2xl text-fg">
            <div className="w-24">
              <FractionBar parts={7} filled={2} />
            </div>
            <span>+</span>
            <div className="w-24">
              <FractionBar parts={7} filled={3} />
            </div>
            <span>=</span>
            <div className="w-24">
              <FractionBar parts={7} filled={5} />
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            2/7 + 3/7 = 5/7 — surətləri toplayırıq (2+3=5), məxrəc dəyişmir
          </p>
        </Frame>
      );

    case "fraction-of-number":
      return (
        <Frame>
          <div className="mx-auto grid max-w-[220px] grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-full ${
                  i < 4 ? "bg-brand" : "bg-panel-2"
                }`}
              />
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            12-nin 1/3 hissəsi: 12 : 3 = 4 (4 dairə rənglənib)
          </p>
        </Frame>
      );

    case "place-value":
      return (
        <Frame>
          <div className="mx-auto max-w-sm">
            <div className="grid grid-cols-4 overflow-hidden rounded-xl border border-line text-center">
              {["Minlik", "Yüzlük", "Onluq", "Təklik"].map((h) => (
                <div key={h} className="border-b border-line bg-panel-2 py-1.5 text-xs text-muted">
                  {h}
                </div>
              ))}
              {["3", "2", "5", "4"].map((d, i) => (
                <div key={i} className="py-3 text-2xl font-bold text-fg">
                  {d}
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-sm text-muted">
              3 254 = <b className="text-fg">3</b> minlik, <b className="text-fg">2</b> yüzlük,{" "}
              <b className="text-fg">5</b> onluq, <b className="text-fg">4</b> təklik
            </p>
          </div>
        </Frame>
      );

    case "column-add":
      return (
        <Frame>
          <div className="mx-auto w-fit font-mono text-2xl text-fg">
            <div className="text-right">3 456</div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-brand">+</span>
              <span>2 130</span>
            </div>
            <div className="my-1 border-t-2 border-line" />
            <div className="text-right text-brand-soft">5 586</div>
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            Rəqəmləri mərtəbəyə görə alt-alta yazıb sağdan toplayırıq
          </p>
        </Frame>
      );

    case "remainder":
      return (
        <Frame>
          <div className="mx-auto flex max-w-[240px] flex-wrap justify-center gap-2">
            {Array.from({ length: 17 }).map((_, i) => (
              <Dot key={i} tone={i >= 15 ? "brand" : "green"} />
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            17 alma, 5 uşaq: hərəyə 3 (yaşıl) düşür,{" "}
            <b className="text-fg">2 (qırmızı)</b> artıq qalır → 17 : 5 = 3 (qalıq 2)
          </p>
        </Frame>
      );

    case "order-ops":
      return (
        <Frame>
          <div className="space-y-2 text-center text-lg text-fg">
            <div>
              2 + 3 × 4 = <b className="text-brand-soft">14</b>{" "}
              <span className="text-xs text-muted">(əvvəl vurma)</span>
            </div>
            <div>
              (2 + 3) × 4 = <b className="text-brand-soft">20</b>{" "}
              <span className="text-xs text-muted">(əvvəl mötərizə)</span>
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            Sıra: mötərizə → vurma/bölmə → toplama/çıxma
          </p>
        </Frame>
      );

    case "proper-improper":
      return (
        <Frame>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-line bg-panel-2 p-3">
              <div className="text-xl">
                <Fraction top={3} bottom={4} />
              </div>
              <div className="mt-1 text-sm font-semibold text-fg">Düzgün</div>
              <div className="text-xs text-muted">surət &lt; məxrəc</div>
            </div>
            <div className="rounded-xl border border-line bg-panel-2 p-3">
              <div className="text-xl">
                <Fraction top={7} bottom={4} />
              </div>
              <div className="mt-1 text-sm font-semibold text-fg">Düzgün olmayan</div>
              <div className="text-xs text-muted">surət ≥ məxrəc</div>
            </div>
          </div>
        </Frame>
      );

    case "mixed-number":
      return (
        <Frame>
          <div className="flex items-center justify-center gap-3 text-2xl text-fg">
            <span className="font-bold">2</span>
            <Fraction top={1} bottom={3} />
            <span className="text-base text-muted">= 2 tam və 1/3</span>
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            Qarışıq ədəd: tam hissə + kəsr hissə. Məsələn, 7/3 = 2 tam 1/3
          </p>
        </Frame>
      );

    // ── Azərbaycan dili ─────────────────────────────────────────
    case "fonetika":
      return (
        <Frame>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-line bg-panel-2 p-3">
              <div className="text-lg font-bold text-brand-soft">Saitlər (9)</div>
              <div className="mt-1 text-fg">a ı o u · e ə i ö ü</div>
              <div className="text-xs text-muted">sərbəst tələffüz</div>
            </div>
            <div className="rounded-xl border border-line bg-panel-2 p-3">
              <div className="text-lg font-bold text-brand-soft">Samitlər</div>
              <div className="mt-1 text-fg">b, c, d, m, s, t ...</div>
              <div className="text-xs text-muted">maneə ilə tələffüz</div>
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            Qalın saitlər: a, ı, o, u · İncə saitlər: e, ə, i, ö, ü
          </p>
        </Frame>
      );

    case "leksika":
      return (
        <Frame>
          <div className="flex flex-wrap justify-center gap-3 text-center text-sm">
            <div className="rounded-lg border border-line bg-panel-2 px-4 py-2">
              <div className="font-semibold text-fg">gözəl = qəşəng</div>
              <div className="text-xs text-brand-soft">sinonim (yaxın məna)</div>
            </div>
            <div className="rounded-lg border border-line bg-panel-2 px-4 py-2">
              <div className="font-semibold text-fg">böyük — kiçik</div>
              <div className="text-xs text-brand-soft">antonim (əks məna)</div>
            </div>
            <div className="rounded-lg border border-line bg-panel-2 px-4 py-2">
              <div className="font-semibold text-fg">üz / üz</div>
              <div className="text-xs text-brand-soft">omonim (eyni yazılış)</div>
            </div>
          </div>
        </Frame>
      );

    case "noun-cards":
      return (
        <Frame>
          <div className="flex flex-wrap justify-center gap-3">
            <WordCard word="uşaq" tag="kim?" />
            <WordCard word="quş" tag="kim?" />
            <WordCard word="alma" tag="nə?" />
            <WordCard word="kitab" tag="nə?" />
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            İsim = əşyanın adı. Canlılar — <b className="text-fg">kim?</b>, cansızlar — <b className="text-fg">nə?</b>
          </p>
        </Frame>
      );

    case "adjective-apple":
      return (
        <Frame>
          <div className="flex items-center justify-center gap-6">
            <Apple size={64} />
            <div className="space-y-2">
              {["qırmızı", "şirin", "yumru"].map((w) => (
                <div
                  key={w}
                  className="rounded-lg border border-brand bg-brand/10 px-4 py-1.5 font-semibold text-fg"
                >
                  {w}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            Sifət əşyanın <b className="text-fg">necə</b> olduğunu bildirir
          </p>
        </Frame>
      );

    case "verb-timeline":
      return (
        <Frame>
          <div className="flex flex-wrap justify-center gap-4 text-center">
            <WordCard word="qaçmaq" />
            <WordCard word="yazmaq" />
            <WordCard word="gülmək" />
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-panel-2 px-4 py-2 text-sm">
            <span className="text-fg">yazdı<br /><span className="text-xs text-muted">keçmiş</span></span>
            <span className="text-brand">→</span>
            <span className="text-fg">yazır<br /><span className="text-xs text-muted">indiki</span></span>
            <span className="text-brand">→</span>
            <span className="text-fg">yazacaq<br /><span className="text-xs text-muted">gələcək</span></span>
          </div>
        </Frame>
      );

    // ── İngilis dili ────────────────────────────────────────────
    case "tobe-table":
      return (
        <Frame>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { p: "I", v: "am" },
              { p: "he / she / it", v: "is" },
              { p: "you / we / they", v: "are" },
            ].map((r) => (
              <div key={r.v} className="rounded-xl border border-line bg-panel-2 p-3">
                <div className="text-sm text-fg">{r.p}</div>
                <div className="mt-1 text-lg font-bold text-brand-soft">{r.v}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            I am · She is · They are
          </p>
        </Frame>
      );

    case "plural-books":
      return (
        <Frame>
          <div className="flex items-center justify-center gap-6 text-center">
            <div className="flex flex-col items-center">
              <Book />
              <div className="mt-2 text-fg">book</div>
              <div className="text-xs text-muted">bir</div>
            </div>
            <div className="text-2xl font-bold text-brand">+s →</div>
            <div className="flex flex-col items-center">
              <div className="flex">
                <div className="h-[46px] w-[22px] rounded-md bg-brand/40 ring-1 ring-brand" />
                <div className="-ml-2 h-[46px] w-[22px] rounded-md bg-brand/60 ring-1 ring-brand" />
                <div className="-ml-2 h-[46px] w-[22px] rounded-md bg-brand/80 ring-1 ring-brand" />
              </div>
              <div className="mt-2 text-fg">
                book<span className="text-brand-soft">s</span>
              </div>
              <div className="text-xs text-muted">çox</div>
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-muted">
            Çox olanda sonuna <b className="text-fg">-s</b> əlavə edirik
          </p>
        </Frame>
      );

    case "count-uncount":
      return (
        <Frame>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-panel-2 p-3 text-center">
              <div className="flex justify-center gap-1.5">
                <Dot tone="brand" />
                <Dot tone="brand" />
                <Dot tone="brand" />
              </div>
              <div className="mt-2 text-sm font-semibold text-fg">Countable</div>
              <div className="text-xs text-muted">sayıla bilən (two apples)</div>
            </div>
            <div className="rounded-xl border border-line bg-panel-2 p-3 text-center">
              <div className="mx-auto h-6 w-20 rounded-full bg-gradient-to-r from-sky-500/70 to-sky-400/40" />
              <div className="mt-2 text-sm font-semibold text-fg">Uncountable</div>
              <div className="text-xs text-muted">sayıla bilməyən (water, milk)</div>
            </div>
          </div>
        </Frame>
      );

    default:
      return null;
  }
}
