"use client";

// "Imparo" öyrənmə xəritəsi — tək sütunlu zigzag yol.
// Mat 3D düyünlər (altında dərinlik kölgəsi), düyünləri birləşdirən yumşaq əyrili cığır
// (keçilmiş hissə yaşıl, qalanı krem), cari düyün qızılı + "BAŞLA" balonu + halo, kiliddə
// düyün toxunanda titrəyir. Sandıq qızılı mükafat qutusudur. Hər bölmə başında ağ başlıq
// kartı. Zefi yolun yanında. Reduced-motion/.no-anim tabedir.

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star, Check, Lock, Flag, Trophy, Sparkles, Gift } from "lucide-react";
import ZefiMascot, { type ZefiEmotion, type CharacterName } from "@/components/ZefiMascot";
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

// Zigzag amplitudası (Duolingo kimi orta).
const AMPLITUDE = 78;
const offsetAt = (i: number) => Math.round(Math.sin(i * 0.9) * AMPLITUDE);

// Bölmə başlığının növbələşən vurğu rəngləri. Fon AĞDIR: əvvəl narıncı gradient idi və
// səhifənin yuxarısındakı narıncı "davam et" bloku ilə iki eyni blok kimi görünürdü.
const UNIT_THEMES = [
  { tile: "bg-brand text-white", label: "text-brand", border: "border-brand/25" },
  { tile: "bg-amber-500 text-white", label: "text-amber-600", border: "border-amber-400/40" },
];

// Düyünün 3D rəngləri (üz + alt dərinlik kölgəsi).
const NODE_STYLE: Record<NodeState, { bg: string; depth: string; text: string }> = {
  done: { bg: "#22c55e", depth: "#15803d", text: "#fff" },
  current: { bg: "#f5b60a", depth: "#c98703", text: "#fff" },
  locked: { bg: "var(--color-panel-2)", depth: "var(--color-line)", text: "var(--color-muted)" },
};

// Bölmə-sonu-test düyünü adi dərsdən fərqlənir (mavi — yoxlama).
const SPECIAL_STYLE: Record<"test", { bg: string; depth: string }> = {
  test: { bg: "#0ea5e9", depth: "#0369a1" },
};

// Sandıq HƏR vəziyyətdə qızılı/kəhrəba mükafat qutusudur (əvvəl keçiləndən sonra adi
// yaşıl dərs dairəsi kimi görünürdü). Forması da fərqlidir: yumru kvadrat.
const CHEST_STYLE: Record<NodeState, { bg: string; depth: string; text: string }> = {
  done: { bg: "#f59e0b", depth: "#b45309", text: "#fff" },
  current: { bg: "#fbbf24", depth: "#d97706", text: "#fff" },
  locked: { bg: "#f6e3bf", depth: "#e3c58f", text: "#b8873b" },
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
      <div className={`flex items-center gap-3 rounded-2xl border-2 ${theme.border} bg-card px-4 py-3 shadow-sm`}>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.tile}`}>
          <Flag size={18} strokeWidth={2.6} />
        </span>
        <div className="min-w-0 flex-1">
          <div className={`text-[10px] font-extrabold uppercase tracking-wider ${theme.label}`}>
            Bölmə {index + 1}
          </div>
          <div className="truncate text-sm font-extrabold leading-tight text-fg">{title}</div>
          {goal && (
            // Qəsdən `truncate` YOXDUR: məqsəd cümləsi kəsilsə mənasını itirir,
            // başlıqdan fərqli olaraq burada iki sətir qalması normaldır.
            <div className="mt-0.5 text-xs font-semibold leading-snug text-muted">{goal}</div>
          )}
        </div>
        {reached && <Trophy size={18} className={`shrink-0 ${theme.label}`} />}
      </div>
    </motion.div>
  );
}

function NodeButton({ node, circleRef }: { node: PathNode; circleRef?: (el: HTMLDivElement | null) => void }) {
  const t = useT();
  const [shake, setShake] = useState(false);
  const isDone = node.state === "done";
  const isCurrent = node.state === "current";
  const isLocked = node.state === "locked";
  const kind = node.kind ?? "lesson";
  // Sandıq kilidli olanda da hədiyyə ikonunu saxlayır (solğun rəng əlçatmazlığı bildirir) —
  // uşaq irəlidə mükafat olduğunu görsün. Test kilidlidə kilid göstərir.
  const Icon =
    kind === "chest"
      ? Gift
      : isLocked
        ? Lock
        : kind === "test"
          ? Trophy
          : isDone
            ? Check
            : Star;
  const base = NODE_STYLE[node.state];
  const s =
    kind === "chest"
      ? CHEST_STYLE[node.state]
      : kind === "test" && isCurrent
        ? { ...SPECIAL_STYLE.test, text: "#fff" }
        : base;

  // Mat 3D düymə: düz üz + aşağıda dərinlik + üzün alt kənarında incə daxili kölgə.
  // Köhnə ağ "şüşə parıltısı" (glossy) qəsdən çıxarılıb — köhnəlmiş görünürdü.
  const inner = (
    <motion.div
      ref={circleRef}
      whileTap={!isLocked ? { y: 5, boxShadow: `0 1px 0 0 ${s.depth}` } : undefined}
      whileHover={!isLocked ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      className={`relative z-10 flex h-[82px] w-[82px] items-center justify-center ${
        kind === "chest" ? "rounded-[26px]" : "rounded-full"
      } ${isCurrent ? "node-bob" : ""}`}
      style={{
        background: s.bg,
        color: s.text,
        boxShadow: `0 7px 0 0 ${s.depth}, inset 0 -5px 0 0 rgba(0,0,0,0.07)`,
      }}
    >
      <Icon
        size={kind === "chest" ? 38 : 36}
        strokeWidth={3.2}
        {...((isCurrent || isDone) && kind !== "chest" ? { fill: "currentColor" } : {})}
      />

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
    // Fon (səhifə rəngində) QƏSDƏNDİR: düyünləri birləşdirən cığır adın altından keçir,
    // fonsuz yazı xəttin üstündə oxunmurdu.
    <span
      className={`relative z-10 mt-2.5 max-w-[140px] rounded-lg bg-ink/90 px-1.5 py-0.5 text-center text-xs leading-tight ${
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
// Yol boyu növbələşən personajlar.
//
// Zefi siyahıda QALIR — o, əsas maskotdur və yoldan tamamilə yox olmamalıdır.
// Yanına meşənin digər sakinləri qatılır ki, yol "boş cığır" yox, içində həyat
// olan bir yer kimi oxunsun.
//
// "Məşğul" pozalara (bal yeyir, göbələk yığır, pendir yeyir) qəsdən yer verilib:
// nəyisə edən personaj sadəcə əl yelləyəndən daha canlı görünür.
// "worried" istisnadır — yol boyu əhval həmişə müsbət qalmalıdır.
type Perch =
  | { kind: "zefi"; emotion: ZefiEmotion }
  | { kind: "char"; name: CharacterName };

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
    <div className="pointer-events-none relative flex flex-col items-center">
      {/* Arxa ağ disk artıq ZefiMascot-un öz içindədir (tünd rejimdə avtomatik) — bax
          components/ZefiMascot.tsx + globals.css `.zefi-disk`. */}
      <span className="relative z-10">
        {perch.kind === "zefi" ? (
          <ZefiMascot emotion={perch.emotion} size={MASCOT_SIZE} />
        ) : (
          <ZefiMascot character={perch.name} size={MASCOT_SIZE} />
        )}
      </span>
      {/* Kölgə ayaqların altında (şəklin aşağı şəffaf boşluğu qədər yuxarı çəkilib) və isti
          tonda — əvvəl ayaqdan aralı tünd boz ləkə kimi görünürdü. */}
      <span
        className="relative z-0 -mt-9 h-3 w-16 rounded-[50%] blur-[4px]"
        style={{ background: "rgba(160, 100, 50, 0.15)" }}
        aria-hidden
      />
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

// Server-də useLayoutEffect xəbərdarlıq verir; brauzerdə ölçmə rəsmdən ƏVVƏL olsun
// ki, cığır gec "peyda olmasın".
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const PATH_DONE = "#a7e3bd"; // keçilmiş hissə — yumşaq yaşıl (düyünlərin yaşılına uyğun)
const PATH_TODO = "var(--color-line)"; // qalan hissə — isti krem

interface Segment {
  d: string;
  done: boolean;
}

export default function LearningPath({ nodes }: { nodes: PathNode[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const circles = useRef<(HTMLDivElement | null)[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });

  // Düyünləri birləşdirən cığır. Mərkəzlər LAYOUT mövqeyindən (offsetTop) hesablanır,
  // getBoundingClientRect-dən YOX: sətirlər görünəndə framer ilə aşağıdan sürüşür
  // (transform) və ölçü animasiya ortasında götürülsə cığır düyünlərdən qopardı.
  // Üfüqi mövqe isə onsuz da bilinir — zigzag `offsetAt(i)`-dir.
  useIsoLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const cx = el.clientWidth / 2;
      const pts = nodes.map((_, i) => {
        const c = circles.current[i];
        if (!c) return null;
        let y = 0;
        let n: HTMLElement | null = c;
        while (n && n !== el) {
          y += n.offsetTop;
          n = n.offsetParent as HTMLElement | null;
        }
        if (n !== el) return null;
        return { x: cx + offsetAt(i), y: y + c.offsetHeight / 2 };
      });
      const segs: Segment[] = [];
      for (let i = 1; i < nodes.length; i++) {
        // Bölmə sərhədində cığır kəsilir — başlıq kartının arxasından keçməsin.
        if (nodes[i].unitTitle) continue;
        const a = pts[i - 1];
        const b = pts[i];
        if (!a || !b) continue;
        const my = (a.y + b.y) / 2;
        segs.push({
          d: `M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`,
          done: nodes[i].state !== "locked",
        });
      }
      setSegments(segs);
      setBox({ w: el.clientWidth, h: el.scrollHeight });
    };
    measure();
    // Şriftlər yüklənəndə, pəncərə dəyişəndə və s. hündürlük dəyişir — yenidən ölç.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [nodes]);

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
    // Hər görünüşdə fərqli personaj. İndeksə bağlıdır, təsadüfi DEYİL: eyni
    // düyündə həmişə eyni personaj durur — şagird "ayı orada yaşayır" kimi
    // qavrayır və hər açılışda mənzərə dəyişmir.
    const perch = PERCH_CAST[Math.floor(i / 5) % PERCH_CAST.length];

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
              <MascotPerch perch={perch} />
            </div>
          )}
          <NodeButton
            node={node}
            circleRef={(el) => {
              circles.current[i] = el;
            }}
          />
        </div>
      </motion.div>,
    );
  });

  // Konteyner mərkəzi sütunun TAM enindədir: bölmə başlığı yuxarıdakı blokla eyni endə
  // olsun (əvvəl 300px idi və dar görünürdü). Düyünlər yenə mərkəz ətrafında zigzag edir.
  return (
    <div ref={containerRef} className="relative mx-auto flex w-full flex-col items-center py-2">
      <Decor />
      {box.w > 0 && (
        <svg
          className="pointer-events-none absolute left-0 top-0 z-0"
          width={box.w}
          height={box.h}
          aria-hidden
        >
          {segments.map((sg, i) => (
            <path
              key={i}
              d={sg.d}
              fill="none"
              stroke={sg.done ? PATH_DONE : PATH_TODO}
              strokeWidth={12}
              strokeLinecap="round"
            />
          ))}
        </svg>
      )}
      {rows}
    </div>
  );
}
