"use client";

// Admin UI kit — korporativ idarəetmə konsolunun vahid komponentləri.
//
// Dizayn dili (şagird tərəfindən qəsdən fərqlidir):
//   · radius: 8–10 px (uşaq tərəfindəki 16–24 px yox)
//   · kənar: 1 px hairline + çox yumşaq kölgə (2 px qalın "sticker" kənar yox)
//   · şrift çəkisi: 500–600 (extrabold/900 yox), başlıqlarda mənfi letter-spacing
//   · rəqəmlər: tabular-nums — sütunlar bir-birinin altında düzülsün
// Tokenlər `.admin-theme` altında dəyişir (bax app/globals.css).

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Inbox } from "lucide-react";

/* ───────────────────────── Səhifə çərçivəsi ───────────────────────── */

// Bütün admin səhifələri üçün vahid en/boşluq. Əvvəl hər səhifə öz max-w-*
// dəyərini seçirdi (2xl-dən 6xl-ə qədər) — konsol səhifədən səhifəyə "sıçrayırdı".
export function PageShell({ children, width = "wide" }: {
  children: ReactNode;
  width?: "wide" | "narrow";
}) {
  return (
    <main className={`mx-auto ${width === "narrow" ? "max-w-3xl" : "max-w-[1180px]"} px-4 py-7 lg:px-8`}>
      {children}
    </main>
  );
}

export function PageHeader({ Icon, title, desc, actions }: {
  Icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string; desc?: string; actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-[22px] font-semibold tracking-tight text-fg">
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
              <Icon size={17} className="text-brand" />
            </span>
          )}
          {title}
        </h1>
        {desc && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, desc }: { children: ReactNode; desc?: string }) {
  return (
    <div className="mb-3 mt-9">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">{children}</h2>
      {desc && <p className="mt-1 text-[13px] text-muted">{desc}</p>}
    </div>
  );
}

/* ───────────────────────── Göstəricilər ───────────────────────── */

// KPI kartı. `delta` verilsə keçən dövrlə müqayisə oxu göstərilir (korporativ
// hesabat gözləntisi: rəqəm tək başına deyil, trendlə birlikdə oxunur).
export function StatCard({ Icon, label, value, tint = "text-brand", suffix = "", delta, hint }: {
  Icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string; value: number | string; tint?: string; suffix?: string;
  delta?: number; hint?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="admin-surface rounded-[10px] p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{label}</span>
        {Icon && <Icon size={15} className={`${tint} shrink-0 opacity-80`} />}
      </div>
      <div className="tabular mt-2.5 text-[26px] font-semibold leading-none tracking-tight text-fg">
        {typeof value === "number" ? value.toLocaleString("az") : value}
        {suffix && <span className="ml-0.5 text-[16px] font-medium text-muted">{suffix}</span>}
      </div>
      {delta !== undefined ? (
        <div className={`mt-2 flex items-center gap-1 text-[11px] font-medium ${up ? "text-emerald-600" : "text-red-500"}`}>
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(delta)}%
          <span className="font-normal text-muted">keçən dövrə görə</span>
        </div>
      ) : hint ? (
        <div className="mt-2 text-[11px] text-muted">{hint}</div>
      ) : null}
    </div>
  );
}

/* ───────────────────────── Səthlər ───────────────────────── */

export function Card({ title, desc, actions, children, className = "", padded = true }: {
  title?: string; desc?: string; actions?: ReactNode;
  children: ReactNode; className?: string; padded?: boolean;
}) {
  return (
    <div className={`admin-surface overflow-hidden rounded-[10px] ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && <div className="text-[13px] font-semibold text-fg">{title}</div>}
            {desc && <div className="mt-0.5 text-[12px] text-muted">{desc}</div>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </div>
  );
}

/* ───────────────────────── Elementlər ───────────────────────── */

export function Button({ children, onClick, href, variant = "secondary", size = "md", Icon, disabled, type = "button", className = "" }: {
  children?: ReactNode; onClick?: () => void; href?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  Icon?: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean; type?: "button" | "submit"; className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const sizes = { sm: "px-2.5 py-1.5 text-[12px]", md: "px-3.5 py-2 text-[13px]" }[size];
  const variants = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    secondary: "border border-line bg-panel text-fg hover:bg-panel-2",
    ghost: "text-muted hover:bg-panel-2 hover:text-fg",
    danger: "border border-red-500/30 bg-red-500/5 text-red-600 hover:bg-red-500/10",
  }[variant];
  const cls = `${base} ${sizes} ${variants} ${className}`;
  const inner = (
    <>
      {Icon && <Icon size={size === "sm" ? 13 : 15} />}
      {children}
    </>
  );
  if (href) return <a href={href} className={cls}>{inner}</a>;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

export function Badge({ children, tone = "muted" }: {
  children: ReactNode; tone?: "muted" | "brand" | "amber" | "green" | "red";
}) {
  const cls = {
    muted: "border-line bg-panel-2 text-muted",
    brand: "border-brand/25 bg-brand/[0.08] text-brand",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    red: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

export function EmptyState({ text, hint, action }: { text: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-line bg-panel/60 px-6 py-14 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-panel-2">
        <Inbox size={18} className="text-muted" />
      </span>
      <p className="mt-3 text-[13px] font-medium text-fg">{text}</p>
      {hint && <p className="mt-1 max-w-sm text-[12px] text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="admin-surface overflow-hidden rounded-[10px]">
      <div className="border-b border-line bg-panel-2/50 px-4 py-2.5">
        <div className="h-2.5 w-24 animate-pulse rounded bg-line" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line/60 px-4 py-3 last:border-b-0">
          <div className="h-2.5 flex-1 animate-pulse rounded bg-line" />
          <div className="h-2.5 w-20 animate-pulse rounded bg-line" />
          <div className="h-2.5 w-14 animate-pulse rounded bg-line" />
        </div>
      ))}
    </div>
  );
}
