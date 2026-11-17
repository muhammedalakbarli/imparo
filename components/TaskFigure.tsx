// Tapşırığın yanında göstərilən şəkil (illüstrasiya).
// Həm əl ilə verilmiş `figure` sahəsini, həm də ibtidai siniflər (1–4) üçün
// `getAutoTaskVisual(task)` ilə avtomatik qurulan şəkilli modelləri göstərir.

import type { Task, TaskFigure as Figure } from "@/lib/types";
import { getAutoTaskVisual, type AutoVisual } from "@/lib/taskVisuals";

function Bar({ parts, filled }: { parts: number; filled: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: parts }).map((_, i) => (
        <div
          key={i}
          className={`h-9 flex-1 rounded border-2 ${
            i < filled ? "border-brand bg-brand" : "border-line bg-panel-2"
          }`}
        />
      ))}
    </div>
  );
}

function ItemGroupBox({ count, icon, colorClass = "border-amber-300 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/10" }: { count: number; icon: string; colorClass?: string }) {
  if (count > 10 && count <= 20) {
    const ones = count - 10;
    return (
      <div className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-2.5 ${colorClass}`}>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-2 py-1 text-xs font-extrabold text-white shadow-sm">
            📦 10
          </span>
          {ones > 0 && (
            <div className="flex flex-wrap justify-center gap-1 text-xl sm:text-2xl">
              {Array.from({ length: ones }).map((_, i) => (
                <span key={i}>{icon}</span>
              ))}
            </div>
          )}
        </div>
        <span className="text-sm font-extrabold text-fg">{count}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-2.5 ${colorClass}`}>
      {count === 0 ? (
        <span className="text-2xl font-extrabold text-muted">∅</span>
      ) : (
        <div className="grid grid-cols-5 gap-1 text-xl sm:text-2xl">
          {Array.from({ length: count }).map((_, i) => (
            <span key={i} className="leading-none">
              {icon}
            </span>
          ))}
        </div>
      )}
      <span className="text-sm font-extrabold text-fg">{count}</span>
    </div>
  );
}

function AnalogClockSvg({ hour, minute = 0 }: { hour: number; minute?: number }) {
  const h = ((hour % 12) + minute / 60) * 30;
  const m = (minute % 60) * 6;
  const hRad = ((h - 90) * Math.PI) / 180;
  const mRad = ((m - 90) * Math.PI) / 180;
  const hx = 60 + 26 * Math.cos(hRad);
  const hy = 60 + 26 * Math.sin(hRad);
  const mx = 60 + 38 * Math.cos(mRad);
  const my = 60 + 38 * Math.sin(mRad);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 120" className="h-28 w-28 drop-shadow-sm">
        <circle cx="60" cy="60" r="54" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="5" />
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, idx) => {
          const ang = ((idx * 30 - 90) * Math.PI) / 180;
          const x = 60 + 42 * Math.cos(ang);
          const y = 60 + 42 * Math.sin(ang) + 4;
          return (
            <text
              key={n}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill="#78350F"
            >
              {n}
            </text>
          );
        })}
        {/* Uzun dəqiqə əqrəbi */}
        <line x1="60" y1="60" x2={mx} y2={my} stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" />
        {/* Qısa saat əqrəbi */}
        <line x1="60" y1="60" x2={hx} y2={hy} stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
        <circle cx="60" cy="60" r="4" fill="#78350F" />
      </svg>
      <div className="flex gap-3 text-xs font-extrabold">
        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Qısa = Saat
        </span>
        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Uzun = Dəqiqə
        </span>
      </div>
    </div>
  );
}

function ShapeSvg({ shape }: { shape: "triangle" | "square" | "circle" | "rectangle" | "all" }) {
  if (shape === "all") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4">
        <ShapeSvg shape="circle" />
        <ShapeSvg shape="triangle" />
        <ShapeSvg shape="square" />
        <ShapeSvg shape="rectangle" />
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      {shape === "triangle" && (
        <svg viewBox="0 0 100 90" className="h-20 w-20 drop-shadow-sm">
          <polygon points="50,8 92,82 8,82" fill="#F97316" stroke="#C2410C" strokeWidth="5" strokeLinejoin="round" />
        </svg>
      )}
      {shape === "square" && (
        <svg viewBox="0 0 100 100" className="h-20 w-20 drop-shadow-sm">
          <rect x="14" y="14" width="72" height="72" rx="6" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="5" />
        </svg>
      )}
      {shape === "circle" && (
        <svg viewBox="0 0 100 100" className="h-20 w-20 drop-shadow-sm">
          <circle cx="50" cy="50" r="38" fill="#10B981" stroke="#047857" strokeWidth="5" />
        </svg>
      )}
      {shape === "rectangle" && (
        <svg viewBox="0 0 130 90" className="h-20 w-28 drop-shadow-sm">
          <rect x="10" y="18" width="110" height="54" rx="6" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="5" />
        </svg>
      )}
    </div>
  );
}

function AutoVisualView({ visual }: { visual: AutoVisual }) {
  if (visual.kind === "addGroups") {
    const { a, b, c, icon } = visual;
    if (a <= 20 && b <= 20 && (!c || c <= 10)) {
      return (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <ItemGroupBox count={a} icon={icon} colorClass="border-amber-300 bg-amber-50/90 dark:border-amber-500/30 dark:bg-amber-500/10" />
          <span className="text-2xl font-extrabold text-brand">+</span>
          <ItemGroupBox count={b} icon={icon} colorClass="border-sky-300 bg-sky-50/90 dark:border-sky-500/30 dark:bg-sky-500/10" />
          {typeof c === "number" && (
            <>
              <span className="text-2xl font-extrabold text-brand">+</span>
              <ItemGroupBox count={c} icon={icon} colorClass="border-emerald-300 bg-emerald-50/90 dark:border-emerald-500/30 dark:bg-emerald-500/10" />
            </>
          )}
          <span className="text-2xl font-extrabold text-muted">=</span>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-dashed border-brand bg-brand-soft text-2xl font-extrabold text-brand">
            ?
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-2 text-xl font-extrabold">
        <span className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">{a}</span>
        <span className="text-brand">+</span>
        <span className="rounded-2xl border-2 border-sky-300 bg-sky-50 px-4 py-2 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200">{b}</span>
        {typeof c === "number" && (
          <>
            <span className="text-brand">+</span>
            <span className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-4 py-2 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">{c}</span>
          </>
        )}
        <span className="text-muted">=</span>
        <span className="rounded-2xl border-2 border-dashed border-brand bg-brand-soft px-4 py-2 text-brand">?</span>
      </div>
    );
  }

  if (visual.kind === "subGroups") {
    const { total, take, icon } = visual;
    if (total <= 20 && take >= 0 && take <= total) {
      const remain = total - take;
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap justify-center gap-2 rounded-2xl border-2 border-line bg-card px-4 py-3">
            {Array.from({ length: total }).map((_, i) => {
              const crossed = i >= remain;
              return (
                <span
                  key={i}
                  className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-2xl transition ${
                    crossed
                      ? "border border-dashed border-red-300 bg-red-50/70 opacity-45 dark:bg-red-500/10"
                      : "bg-amber-50/80 dark:bg-amber-500/10"
                  }`}
                >
                  {icon}
                  {crossed && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-black text-red-600">
                      ✕
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-muted">
            <span>Cəmi: {total}</span>
            <span>·</span>
            <span className="text-red-500">Çıxıldı: {take}</span>
            <span>·</span>
            <span className="text-brand">Qaldı: ?</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-2 text-xl font-extrabold">
        <span className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">{total}</span>
        <span className="text-red-500">−</span>
        <span className="rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-2 text-red-700 dark:bg-red-500/15 dark:text-red-300">{take}</span>
        <span className="text-muted">=</span>
        <span className="rounded-2xl border-2 border-dashed border-brand bg-brand-soft px-4 py-2 text-brand">?</span>
      </div>
    );
  }

  if (visual.kind === "mulGroups") {
    const { groups, perGroup, icon } = visual;
    if (groups >= 1 && groups <= 6 && perGroup >= 1 && perGroup <= 8) {
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: groups }).map((_, g) => (
            <div
              key={g}
              className="flex flex-wrap items-center justify-center gap-1 rounded-2xl border-2 border-violet-300 bg-violet-50/80 px-2.5 py-2 text-xl dark:border-violet-500/30 dark:bg-violet-500/10"
            >
              {Array.from({ length: perGroup }).map((__, i) => (
                <span key={i}>{icon}</span>
              ))}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-2 text-xl font-extrabold">
        <span className="rounded-2xl border-2 border-violet-300 bg-violet-50 px-4 py-2 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200">{groups} qrup</span>
        <span className="text-brand">×</span>
        <span className="rounded-2xl border-2 border-sky-300 bg-sky-50 px-4 py-2 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200">hərəsində {perGroup}</span>
      </div>
    );
  }

  if (visual.kind === "divGroups") {
    const { total, divisor, icon } = visual;
    return (
      <div className="flex flex-col items-center gap-2">
        {total <= 20 && (
          <div className="flex flex-wrap justify-center gap-1 text-xl">
            {Array.from({ length: total }).map((_, i) => (
              <span key={i}>{icon}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm font-extrabold text-fg">
          <span className="rounded-xl bg-amber-100 px-3 py-1 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
            Cəmi {total}
          </span>
          <span>→</span>
          <span className="rounded-xl bg-sky-100 px-3 py-1 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200">
            🧺 {divisor} bərabər hissə
          </span>
        </div>
      </div>
    );
  }

  if (visual.kind === "compareNums") {
    return (
      <div className="flex flex-wrap items-end justify-center gap-3">
        {visual.nums.map((n, idx) => (
          <div
            key={idx}
            className="flex min-w-[72px] flex-col items-center gap-1.5 rounded-2xl border-2 border-line bg-card px-3 py-2.5"
          >
            <span className="text-2xl font-extrabold text-fg">{n}</span>
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: Math.min(n, 20) }).map((_, i) => (
                <span key={i} className="h-2.5 w-2.5 rounded-full bg-brand" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visual.kind === "placeValue") {
    const digits = String(visual.num).split("");
    const labels =
      digits.length === 4
        ? ["Minlik", "Yüzlük", "Onluq", "Təklik"]
        : digits.length === 3
          ? ["Yüzlük", "Onluq", "Təklik"]
          : digits.length === 2
            ? ["Onluq", "Təklik"]
            : ["Təklik"];
    return (
      <div className="flex justify-center gap-2.5">
        {digits.map((d, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-2xl border-2 border-brand/30 bg-brand-soft/50 px-4 py-2"
          >
            <span className="text-2xl font-extrabold text-brand">{d}</span>
            <span className="text-[11px] font-bold text-muted">{labels[i]}</span>
          </div>
        ))}
      </div>
    );
  }

  if (visual.kind === "shape") {
    return <ShapeSvg shape={visual.shape} />;
  }

  if (visual.kind === "clock") {
    return <AnalogClockSvg hour={visual.hour} minute={visual.minute} />;
  }

  if (visual.kind === "colorSwatch") {
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className={`h-20 w-20 rounded-full shadow-md ${
            visual.border ? "border-4 border-slate-300" : "border-4 border-white/60"
          }`}
          style={{ backgroundColor: visual.colorHex }}
        />
        {visual.label && <span className="text-sm font-extrabold text-fg">{visual.label}</span>}
      </div>
    );
  }

  if (visual.kind === "pictureCard") {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2 text-4xl sm:text-5xl">
          {visual.emojis.map((e, i) => (
            <span key={i} className="leading-none drop-shadow-xs">
              {e}
            </span>
          ))}
        </div>
        {visual.title && (
          <div className="text-lg font-extrabold tracking-wide text-fg">{visual.title}</div>
        )}
        {visual.badges && visual.badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {visual.badges.map((b, i) => (
              <span
                key={i}
                className="rounded-xl border border-brand/25 bg-brand-soft px-2.5 py-1 text-xs font-extrabold text-brand"
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function TaskFigure({ figure, task }: { figure?: Figure; task?: Task }) {
  const effectiveFigure = figure ?? task?.figure;

  if (effectiveFigure) {
    let content = null;
    if (effectiveFigure.kind === "fractionBar") {
      content = <Bar parts={effectiveFigure.parts} filled={effectiveFigure.filled} />;
    } else if (effectiveFigure.kind === "compareBars") {
      content = (
        <div className="space-y-2">
          <Bar parts={effectiveFigure.a.parts} filled={effectiveFigure.a.filled} />
          <Bar parts={effectiveFigure.b.parts} filled={effectiveFigure.b.filled} />
        </div>
      );
    } else if (effectiveFigure.kind === "dots") {
      const filled = effectiveFigure.filled ?? 0;
      content = (
        <div className="mx-auto grid max-w-[280px] grid-cols-8 gap-1.5">
          {Array.from({ length: effectiveFigure.total }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-full ${
                i < filled ? "bg-brand" : "bg-panel-2"
              }`}
            />
          ))}
        </div>
      );
    } else if (effectiveFigure.kind === "emoji") {
      content = (
        <div className="flex flex-wrap justify-center gap-2 text-4xl sm:text-5xl">
          {effectiveFigure.items.map((e, i) => (
            <span key={i}>{e}</span>
          ))}
        </div>
      );
    }

    return (
      <div className="mt-4 rounded-2xl border-2 border-line bg-panel p-4">
        {content}
      </div>
    );
  }

  const auto = task ? getAutoTaskVisual(task) : null;
  if (!auto) return null;

  return (
    <div className="mt-4 rounded-2xl border-2 border-line bg-panel p-4">
      <AutoVisualView visual={auto} />
    </div>
  );
}
