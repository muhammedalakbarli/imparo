"use client";

// "Imparo" öyrənmə xəritəsi — Duolingo-üslubu tək sütunlu zigzag yol.
// Qalın 3D düyünlər (altında dərinlik kölgəsi), düyünlər arası xətt YOX (Duolingo kimi),
// cari düyün qızılı + "BAŞLA" balonu + halo, kiliddə düyün toxunanda titrəyir. Hər bölmə
// başında rəngli banner. Zefi yolun yanında platformada. Reduced-motion/.no-anim tabedir.

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Check, Lock, Flag, Trophy, Sparkles, Gift } from "lucide-react";
import ZefiMascot, { type ZefiEmotion } from "@/components/ZefiMascot";
import { useT } from "@/lib/i18n";
import { playStep } from "@/lib/sound";
import { vibrateWrong } from "@/lib/haptics";

export type NodeState = "done" | "current" | "locked";

export type NodeKind = "lesson" | "chest" | "test";

export interface PathNode {
  id: string;
  kind?: NodeKind; // "chest" = bölmə sandığı, "test" = bölmə sonu testi
  title: string;
  state: NodeState;
  href?: string;
  unitTitle?: string; // dolu isə bu düyün yeni bölmənin başıdır (banner tetikləyir)
  // Bölmənin nə öyrətdiyi (məzmunda `unit.description`). Başlıq tək başına
  // uşağa az şey deyir: "Ədədlər 0-10" bölmənin ADIdır, MƏQSƏDİ deyil.
  unitGoal?: string;
}

// Sabit en; zigzag amplitudası (Duolingo kimi orta).
const LANE = 300;
const AMPLITUDE = 78;
const offsetAt = (i: number) => Math.round(Math.sin(i * 0.9) * AMPLITUDE);

// Bölmələr üçün növbələşən rəng temaları.
// Vahid palitra: indiqo (brend) və amber növbələşir — göy qurşağı yox.
const UNIT_THEMES = ["from-brand to-brand-dark", "from-amber-500 to-orange-500"];

// Düyünün 3D rəngləri (üz + alt dərinlik kölgəsi).
const NODE_STYLE: Record<NodeState, { bg: string; depth: string; text: string }> = {
  done: { bg: "#22c55e", depth: "#15803d", text: "#fff" },
  current: { bg: "#f5b60a", depth: "#c98703", text: "#fff" },
  locked: { bg: "var(--color-panel-2)", depth: "var(--color-line)", text: "var(--color-muted)" },
};

// Sandıq və bölmə-sonu-test düyünləri adi dərsdən vizual olaraq fərqlənir.
const SPECIAL_STYLE: Record<"chest" | "test", { bg: string; depth: string }> = {
  chest: { bg: "#a855f7", depth: "#7e22ce" }, // bənövşəyi — mükafat
  test: { bg: "#0ea5e9", depth: "#0369a1" }, // mavi — yoxlama
};

// Bölmə banneri — rəngli gradient, ikon + başlıq; keçilmişsə kubok. Görünəndə səs.
function UnitBanner({
  title,
  goal,
  index,
  reached,
}: {
  title: string;
  goal?: string;
  index: number;
  reached: boolean;
}) {
  const theme = UNIT_THEMES[index % UNIT_THEMES.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="relative z-10 my-4 w-full"
    >
      <div
        className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${theme} px-4 py-3 shadow-lg`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/25 text-white">
          <Flag size={18} strokeWidth={2.6} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
            Bölmə {index + 1}
          </div>
          <div className="truncate text-sm font-extrabold leading-tight text-white">
            {title}
          </div>
          {goal && (
            // Qəsdən `truncate` YOXDUR: məqsəd cümləsi kəsilsə mənasını itirir,
            // başlıqdan fərqli olaraq burada iki sətir qalması normaldır.
            <div className="mt-0.5 text-xs font-semibold leading-snug text-white/85">
              {goal}
            </div>
          )}
        </div>
        {reached && <Trophy size={18} className="shrink-0 text-white/90" />}
      </div>
    </motion.div>
  );
}

function NodeButton({ node }: { node: PathNode }) {
  const t = useT();
  const [shake, setShake] = useState(false);
  const isDone = node.state === "done";
  const isCurrent = node.state === "current";
  const isLocked = node.state === "locked";
  const kind = node.kind ?? "lesson";
  // Sandıq/test öz ikonunu saxlayır (kilidli olanda kilid göstərilir ki, əlçatmazlıq aydın olsun).
  const Icon = isLocked
    ? Lock
    : kind === "chest"
      ? Gift
      : kind === "test"
        ? Trophy
        : isDone
          ? Check
          : Star;
  const base = NODE_STYLE[node.state];
  // Xüsusi düyünlər açıq olanda öz rəngindədir; kilidli/bitmiş halda ümumi sxem qalır.
  const s =
    kind !== "lesson" && isCurrent
      ? { ...SPECIAL_STYLE[kind], text: "#fff" }
      : base;

  const inner = (
    <motion.div
      whileTap={!isLocked ? { y: 5, boxShadow: `0 1px 0 0 ${s.depth}` } : undefined}
      whileHover={!isLocked ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      className={`relative z-10 flex h-[82px] w-[82px] items-center justify-center rounded-full ${
        isCurrent ? "node-bob" : ""
      }`}
      style={{ background: s.bg, color: s.text, boxShadow: `0 7px 0 0 ${s.depth}` }}
    >
      {/* Parlaq üst işıq (glossy) */}
      {!isLocked && (
        <span
          className="pointer-events-none absolute inset-x-4 top-2.5 h-4 rounded-full bg-white/35 blur-[2px]"
          aria-hidden
        />
      )}
      <Icon size={36} strokeWidth={3.2} {...(isCurrent || isDone ? { fill: "currentColor" } : {})} />

      {/* Cari düyünün yanında oynayan qığılcımlar */}
      {isCurrent && (
        <>
          <span className="twinkle pointer-events-none absolute -left-2 top-1 text-amber-200" aria-hidden>
            <Sparkles size={13} fill="currentColor" strokeWidth={0} />
          </span>
          <span
            className="twinkle pointer-events-none absolute -right-2 bottom-1 text-amber-100"
            style={{ animationDelay: "0.8s" }}
            aria-hidden
          >
            <Sparkles size={11} fill="currentColor" strokeWidth={0} />
          </span>
        </>
      )}
    </motion.div>
  );

  // Cari/tamamlanmış: keçid + səs. Kilidli: keçid yox, titrəmə + tooltip.
  if (node.href && !isLocked) {
    return (
      <NodeShell isCurrent={isCurrent}>
        <Link href={node.href} onClick={() => playStep()}>
          {inner}
        </Link>
        <NodeLabel node={node} />
      </NodeShell>
    );
  }

  return (
    <NodeShell isCurrent={isCurrent}>
      <button
        type="button"
        onClick={() => {
          setShake(true);
          vibrateWrong();
          window.setTimeout(() => setShake(false), 500);
        }}
        className="cursor-default"
        aria-label={`${node.title} — kilidli`}
      >
        <motion.div animate={shake ? { x: [0, -6, 6, -5, 5, 0] } : undefined} transition={{ duration: 0.4 }}>
          {inner}
        </motion.div>
      </button>
      {shake && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-8 z-10 flex items-center gap-1 rounded-lg border border-line bg-panel px-2 py-1 text-[11px] font-semibold text-muted shadow-sm"
        >
          <Lock size={11} /> {t("path.locked")}
        </motion.span>
      )}
      <NodeLabel node={node} />
    </NodeShell>
  );
}

function NodeShell({
  children,
  isCurrent,
}: {
  children: React.ReactNode;
  isCurrent: boolean;
}) {
  const t = useT();
  return (
    <div className="relative flex flex-col items-center">
      {/* Cari düyünün arxasında qızılı işıq halosu */}
      {isCurrent && (
        <span
          className="pointer-events-none absolute top-2 z-0 h-[82px] w-[82px] rounded-full bg-amber-400/40 blur-xl"
          aria-hidden
        />
      )}
      {/* Cari dərsin üstündə tullanan "BAŞLA" balonu */}
      {isCurrent && (
        <div className="path-bounce absolute -top-12 z-20 flex flex-col items-center">
          <span className="rounded-xl bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-600 shadow-md">
            {t("dash.start")}
          </span>
          <span className="-mt-[3px] h-3 w-3 rotate-45 bg-white shadow-md" />
        </div>
      )}
      {children}
    </div>
  );
}

function NodeLabel({ node }: { node: PathNode }) {
  return (
    <span
      className={`mt-3 max-w-[130px] text-center text-xs leading-tight ${
        node.state === "locked" ? "text-muted" : "font-semibold text-fg"
      }`}
    >
      {node.title}
    </span>
  );
}

// Zefi yolun yanında kiçik platformada (Duolingo owl kimi).
// Ölçü dərs dairələrindən (82px) bir qədər böyük — görkəmli.
const MASCOT_SIZE = 104;
// Mascotun düyün mərkəzindən üfüqi aralığı — qonşu (kilidli) bölmə ilə aydın boşluq.
const MASCOT_GAP = 152;
// Yol boyu növbələşən pozalar (ağlayan/"worried" istisna — həmişə müsbət).
const PERCH_EMOTIONS: ZefiEmotion[] = [
  "happy",
  "welcome",
  "celebrating",
  "learning",
  "thinking",
];

function MascotPerch({ emotion }: { emotion: ZefiEmotion }) {
  return (
    <div className="pointer-events-none relative flex flex-col items-center">
      {/* Arxa ağ disk artıq ZefiMascot-un öz içindədir (tünd rejimdə avtomatik) — bax
          components/ZefiMascot.tsx + globals.css `.zefi-disk`. */}
      <span className="relative z-10">
        <ZefiMascot emotion={emotion} size={MASCOT_SIZE} />
      </span>
      <span className="relative z-10 mt-1 h-3 w-20 rounded-[50%] bg-black/25 blur-[3px]" aria-hidden />
    </div>
  );
}

// Fon boyu incə, hərəkət edən parıltılar (dekorativ, kliklənməz).
const DECOR = [
  { top: "8%", left: "6%", size: 14, delay: "0s" },
  { top: "24%", left: "88%", size: 10, delay: "0.9s" },
  { top: "46%", left: "10%", size: 12, delay: "1.6s" },
  { top: "63%", left: "84%", size: 9, delay: "0.4s" },
  { top: "80%", left: "12%", size: 13, delay: "1.2s" },
  { top: "92%", left: "80%", size: 10, delay: "2s" },
];

function Decor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      {DECOR.map((d, i) => (
        <span
          key={i}
          className="twinkle absolute text-brand/20"
          style={{ top: d.top, left: d.left, animationDelay: d.delay }}
        >
          <Sparkles size={d.size} fill="currentColor" strokeWidth={0} />
        </span>
      ))}
    </div>
  );
}

export default function LearningPath({ nodes }: { nodes: PathNode[] }) {
  const rows: React.ReactNode[] = [];
  let unitIndex = -1;

  nodes.forEach((node, i) => {
    const off = offsetAt(i);

    // Yeni bölmə başı — banner əlavə et.
    if (node.unitTitle) {
      unitIndex += 1;
      rows.push(
        <UnitBanner
          key={`b-${node.id}`}
          title={node.unitTitle}
          goal={node.unitGoal}
          index={unitIndex}
          reached={node.state !== "locked"}
        />,
      );
    }

    // Zefi-ni aralıqlarda, düyünün əks tərəfində platformada göstər.
    const showMascot = i > 0 && i % 5 === 2 && node.state !== "current";
    const mascotSide = off >= 0 ? -1 : 1; // düyün sağdadırsa Zefi solda
    // Hər görünüşdə fərqli poza (növbələşir).
    const mascotEmotion = PERCH_EMOTIONS[Math.floor(i / 5) % PERCH_EMOTIONS.length];

    rows.push(
      <motion.div
        key={node.id}
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={`flex w-full flex-col items-center py-3 ${
          node.state === "current" ? "pt-14" : ""
        }`}
      >
        <div
          className="relative flex items-center justify-center"
          style={{ transform: `translateX(${off}px)` }}
        >
          {showMascot && (
            <div
              className="absolute top-1/2 z-10 -translate-y-1/2"
              style={{ [mascotSide < 0 ? "right" : "left"]: `${MASCOT_GAP}px` }}
            >
              <MascotPerch emotion={mascotEmotion} />
            </div>
          )}
          <NodeButton node={node} />
        </div>
      </motion.div>,
    );
  });

  return (
    <div
      className="relative mx-auto flex flex-col items-center py-2"
      style={{ width: LANE, maxWidth: "100%" }}
    >
      <Decor />
      {rows}
    </div>
  );
}
