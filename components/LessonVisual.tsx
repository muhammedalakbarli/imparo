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

export default function LessonVisual({ visual }: { visual?: string }) {
  if (!visual) return null;

  switch (visual) {
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
