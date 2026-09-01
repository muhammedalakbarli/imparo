"use client";

// "Imparo" öyrənmə xəritəsi — macəra xəritəsi üslubu (bax Maskot/maskot 3d/path.jpeg).
//
// DÜYÜN ARTIQ DAİRƏ DEYİL, KARTDIR. Səbəb: dairədə yalnız ikon yerləşirdi, dərsin
// adı altda kiçik mətnlə qalırdı və şagird "növbəti nə öyrənəcəyəm" sualına
// cavabı yalnız kliklədikdən sonra alırdı. Kartda nömrə, ad, ulduzlar və vəziyyət
// eyni anda görünür.
//
// YERLƏŞMƏ: ilanvari (serpantin) — sətirlər növbə ilə soldan-sağa və sağdan-sola
// gedir, aralarında kəsik-kəsik yol. Mobil ekranda sətir bir sütuna düşür və
// tərs sıralama SÖNDÜRÜLÜR (əks halda oxunuş sırası pozulardı).
//
// Bölmə sonundakı sandıq və test düyünləri xüsusi görünür: sandıq — mükafat kartı,
// test — "BOSS BATTLE" bannerı. Bu, bölmənin bitdiyini uzaqdan göstərir.

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Check, Lock, Flag, Trophy, Gift, Play, Swords } from "lucide-react";
import ZefiMascot, { type ZefiEmotion, type CharacterName } from "@/components/ZefiMascot";
import PathScene from "@/components/PathScene";
import { useT } from "@/lib/i18n";
import { playStep } from "@/lib/sound";
import { vibrateWrong } from "@/lib/haptics";

export type NodeState = "done" | "current" | "locked";
export type NodeKind = "lesson" | "chest" | "test";

export interface PathNode {
  id: string;
  kind?: NodeKind;
  title: string;
  state: NodeState;
  href?: string;
  unitTitle?: string; // dolu isə bu düyün yeni bölmənin başıdır
  unitGoal?: string;
  /** 1–3; tamamlanmış dərsdə dəqiqlikdən hesablanır (bax my_lesson_stars, 0062). */
  stars?: number;
}

/** Sətirdəki kart sayı (desktop). Mobil/planşetdə sətir öz-özünə bir sütuna düşür. */
const PER_ROW = 3;

const STATE_STYLE: Record<NodeState, { badge: string; ring: string; card: string }> = {
  done: {
    badge: "bg-emerald-500 text-white",
    ring: "border-emerald-500/30",
    card: "bg-panel/95",
  },
  current: {
    badge: "bg-amber-500 text-white",
    ring: "border-amber-400 ring-4 ring-amber-400/25",
    card: "bg-panel",
  },
  locked: {
    badge: "bg-violet-500/85 text-white",
    ring: "border-line",
    card: "bg-panel/80",
  },
};

/* ── Ulduzlar ────────────────────────────────────────────────────────────── */

function Stars({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} ulduz`}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={14}
          strokeWidth={2.4}
          className={
            i <= value
              ? "text-amber-400"
              : muted
                ? "text-line"
                : "text-muted/35"
          }
          {...(i <= value ? { fill: "currentColor" } : {})}
        />
      ))}
    </span>
  );
}

/* ── Bölmə banneri ───────────────────────────────────────────────────────── */

const UNIT_THEMES = ["from-brand to-brand-dark", "from-amber-500 to-orange-500"];

function UnitBanner({
  title, goal, index, reached,
}: {
  title: string; goal?: string; index: number; reached: boolean;
}) {
  const theme = UNIT_THEMES[index % UNIT_THEMES.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="relative z-10 mb-5 mt-8 w-full first:mt-2"
    >
      <div className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${theme} px-4 py-3 shadow-lg`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/25 text-white">
          <Flag size={18} strokeWidth={2.6} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
            Bölmə {index + 1}
          </div>
          <div className="truncate text-sm font-extrabold leading-tight text-white">{title}</div>
          {goal && (
            <div className="mt-0.5 text-xs font-semibold leading-snug text-white/85">{goal}</div>
          )}
        </div>
        {reached && <Trophy size={18} className="shrink-0 text-white/90" />}
      </div>
    </motion.div>
  );
}

/* ── Dərs kartı ──────────────────────────────────────────────────────────── */

function LessonCard({ node, index }: { node: PathNode; index: number }) {
  const t = useT();
  const [shake, setShake] = useState(false);
  const isLocked = node.state === "locked";
  const isCurrent = node.state === "current";
  const isDone = node.state === "done";
  const s = STATE_STYLE[node.state];

  const body = (
    <motion.div
      whileHover={!isLocked ? { y: -3 } : undefined}
      whileTap={!isLocked ? { y: 1 } : undefined}
      animate={shake ? { x: [0, -6, 6, -5, 5, 0] } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className={`relative flex min-h-[74px] w-full items-center gap-3 rounded-2xl border-2 ${s.ring} ${s.card} px-3.5 py-3 shadow-[0_6px_16px_-8px_rgba(15,23,42,.35)] backdrop-blur-[2px] ${
        isLocked ? "opacity-90" : ""
      }`}
    >
      {/* Nömrə nişanı */}
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-extrabold shadow-sm ${s.badge}`}
      >
        {index}
      </span>

      <span className="min-w-0 flex-1">
        {/* Başlıq iki sətirə qədər açılır: kart eni 210px-dir və `truncate` ilə
            "Nisbət və p…" kimi kəsilmiş adlar şagirdə heç nə demir. */}
        <span className="block break-words hyphens-auto text-[13.5px] font-extrabold leading-[1.25] text-fg [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
          {node.title}
        </span>
        <span className="mt-1 flex items-center gap-2">
          <Stars value={isDone ? (node.stars ?? 1) : 0} muted={isLocked} />
          {isCurrent && (
            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-600">
              {t("dash.start")}
            </span>
          )}
        </span>
      </span>

      {/* Vəziyyət ikonu */}
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isDone
            ? "bg-emerald-500 text-white"
            : isCurrent
              ? "bg-amber-500 text-white"
              : "bg-panel-2 text-muted"
        }`}
      >
        {isDone ? <Check size={17} strokeWidth={3.4} /> : isCurrent ? <Play size={15} fill="currentColor" strokeWidth={0} /> : <Lock size={15} strokeWidth={2.8} />}
      </span>
    </motion.div>
  );

  if (node.href && !isLocked) {
    return (
      <Link href={node.href} onClick={() => playStep()} className="block w-full">
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="block w-full cursor-default text-left"
      aria-label={`${node.title} — ${t("path.locked")}`}
      onClick={() => {
        setShake(true);
        vibrateWrong();
        window.setTimeout(() => setShake(false), 480);
      }}
    >
      {body}
    </button>
  );
}

/* ── Xüsusi düyünlər: sandıq və bölmə testi ──────────────────────────────── */

function ChestCard({ node }: { node: PathNode }) {
  const locked = node.state === "locked";
  const inner = (
    <motion.div
      whileHover={!locked ? { y: -3 } : undefined}
      className={`relative mx-auto flex w-full max-w-[420px] items-center gap-3 rounded-2xl border-2 px-4 py-3 shadow-[0_8px_20px_-10px_rgba(15,23,42,.4)] ${
        locked ? "border-line bg-panel/80" : "border-violet-400 bg-panel"
      }`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${locked ? "bg-panel-2 text-muted" : "bg-violet-500 text-white"}`}>
        {locked ? <Lock size={18} strokeWidth={2.8} /> : <Gift size={20} strokeWidth={2.6} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-extrabold text-fg">{node.title}</span>
        <span className="block text-[12px] text-muted">Bölməni bitir, xüsusi mükafat qazan</span>
      </span>
    </motion.div>
  );
  return node.href && !locked ? <Link href={node.href} className="block">{inner}</Link> : inner;
}

function BossCard({ node }: { node: PathNode }) {
  const locked = node.state === "locked";
  const inner = (
    <motion.div
      whileHover={!locked ? { y: -3 } : undefined}
      className={`relative mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border-2 shadow-[0_10px_24px_-12px_rgba(15,23,42,.5)] ${
        locked ? "border-line bg-panel/80" : "border-rose-400 bg-panel"
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 ${locked ? "" : "bg-gradient-to-r from-rose-500/10 to-transparent"}`}>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${locked ? "bg-panel-2 text-muted" : "bg-rose-500 text-white"}`}>
          {locked ? <Lock size={18} strokeWidth={2.8} /> : <Swords size={20} strokeWidth={2.6} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-rose-500">
            Bölmə sınağı
          </span>
          <span className="block truncate text-[14px] font-extrabold text-fg">{node.title}</span>
        </span>
      </div>
    </motion.div>
  );
  return node.href && !locked ? <Link href={node.href} className="block">{inner}</Link> : inner;
}

/* ── Yol birləşdiriciləri ────────────────────────────────────────────────── */

// Kartlar arası kəsik-kəsik yol. Yalnız desktopda görünür: mobil bir sütundur və
// şaquli xətt kartları bir-birindən ayırmır, sıxlıq yaradır.
function Dash() {
  return (
    <span className="hidden h-0 flex-1 self-center border-t-[3px] border-dashed border-white/70 dark:border-white/25 sm:block" aria-hidden />
  );
}

function RowTurn({ side }: { side: "left" | "right" }) {
  return (
    <span
      className={`hidden h-8 w-16 border-b-[3px] border-dashed border-white/70 dark:border-white/25 sm:block ${
        side === "right" ? "ml-auto rounded-br-3xl border-r-[3px]" : "mr-auto rounded-bl-3xl border-l-[3px]"
      }`}
      aria-hidden
    />
  );
}

/* ── Maskotlar (mövcud personaj dəsti saxlanılır) ────────────────────────── */

const MASCOT_SIZE = 76;

type Perch = { kind: "zefi"; emotion: ZefiEmotion } | { kind: "char"; name: CharacterName };

const PERCH_CAST: Perch[] = [
  { kind: "zefi", emotion: "happy" },
  { kind: "char", name: "ayi" },
  { kind: "char", name: "sincab_salam" },
  { kind: "zefi", emotion: "celebrating" },
  { kind: "char", name: "kirpi_gobelek" },
  { kind: "char", name: "ceyran" },
  { kind: "zefi", emotion: "learning" },
  { kind: "char", name: "sican_pendir" },
  { kind: "char", name: "bayqus" },
  { kind: "zefi", emotion: "thinking" },
  { kind: "char", name: "ayi_bal" },
  { kind: "char", name: "porsuq" },
  { kind: "zefi", emotion: "welcome" },
  { kind: "char", name: "kirpi_salam" },
  { kind: "char", name: "sican" },
  { kind: "char", name: "ayi_armud" },
  { kind: "char", name: "sincab" },
];

function MascotPerch({ perch }: { perch: Perch }) {
  return (
    <div className="pointer-events-none hidden flex-col items-center sm:flex">
      <span className="relative z-10">
        {perch.kind === "zefi" ? (
          <ZefiMascot emotion={perch.emotion} size={MASCOT_SIZE} />
        ) : (
          <ZefiMascot character={perch.name} size={MASCOT_SIZE} />
        )}
      </span>
      <span className="relative z-10 mt-0.5 h-2.5 w-14 rounded-[50%] bg-black/25 blur-[3px]" aria-hidden />
    </div>
  );
}

/* ── Başlanğıc nişanı ────────────────────────────────────────────────────── */

function StartMarker() {
  return (
    <div className="relative z-10 mb-1 flex items-center gap-2">
      <span className="rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white shadow-md">
        Start
      </span>
      <span className="h-0 w-14 border-t-[3px] border-dashed border-white/70 dark:border-white/25" aria-hidden />
    </div>
  );
}

/* ── Xəritə ──────────────────────────────────────────────────────────────── */

interface NumberedNode { node: PathNode; num: number }

interface Segment {
  unitTitle?: string;
  unitGoal?: string;
  lessons: NumberedNode[];
  chest?: PathNode;
  test?: PathNode;
}

// Düyünləri bölmələrə ayırır və dərs nömrələrini BURADA hesablayır (render zamanı
// yox): render sırasında sayğac dəyişdirmək React-in yenidən render qaydalarına
// ziddir və eyni komponent iki dəfə render olunanda nömrələr sürüşür.
function toSegments(nodes: PathNode[]): Segment[] {
  const out: Segment[] = [];
  let cur: Segment | null = null;
  let num = 0;
  for (const n of nodes) {
    if (n.unitTitle || !cur) {
      cur = { unitTitle: n.unitTitle, unitGoal: n.unitGoal, lessons: [] };
      out.push(cur);
    }
    const kind = n.kind ?? "lesson";
    if (kind === "chest") cur.chest = n;
    else if (kind === "test") cur.test = n;
    else {
      num += 1;
      cur.lessons.push({ node: n, num });
    }
  }
  return out;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size));
  return rows;
}

export default function LearningPath({ nodes }: { nodes: PathNode[] }) {
  const segments = toSegments(nodes);

  return (
    <div className="path-scene relative overflow-hidden rounded-[28px] border border-line/70 px-3 py-4 sm:px-5 sm:py-6">
      <PathScene />

      <div className="relative z-10">
        {segments.map((seg, si) => {
          const rows = chunk(seg.lessons, PER_ROW);
          return (
            <div key={seg.unitTitle ?? `seg-${si}`}>
              {seg.unitTitle && (
                <UnitBanner
                  title={seg.unitTitle}
                  goal={seg.unitGoal}
                  index={si}
                  reached={seg.lessons.some((l) => l.node.state !== "locked")}
                />
              )}

              {si === 0 && <StartMarker />}

              {rows.map((row, ri) => {
                const reversed = ri % 2 === 1;
                // Personaj indeksi bölmə və sətir nömrəsindən çıxarılır — sabitdir,
                // yəni eyni yerdə həmişə eyni personaj durur.
                const perch = PERCH_CAST[(si * 3 + ri) % PERCH_CAST.length];
                return (
                  <div key={`r-${si}-${ri}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ type: "spring", stiffness: 260, damping: 24 }}
                      className={`flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-2 ${
                        reversed ? "sm:flex-row-reverse" : ""
                      }`}
                    >
                      {row.map(({ node: n, num }, ni) => (
                        <div key={n.id} className="contents">
                          {ni > 0 && <Dash />}
                          <div className="w-full sm:w-[210px] sm:shrink-0">
                            <LessonCard node={n} index={num} />
                          </div>
                        </div>
                      ))}
                      {/* Sətirdə boş yer qalırsa personaj oradadır — xəritə "boş cığır" görünməsin */}
                      {row.length < PER_ROW && (
                        <div className="hidden flex-1 justify-center sm:flex">
                          <MascotPerch perch={perch} />
                        </div>
                      )}
                    </motion.div>

                    {ri < rows.length - 1 && <RowTurn side={reversed ? "left" : "right"} />}
                  </div>
                );
              })}

              {(seg.chest || seg.test) && (
                <div className="mt-4 space-y-3">
                  {seg.chest && <ChestCard node={seg.chest} />}
                  {seg.test && <BossCard node={seg.test} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
