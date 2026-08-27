"use client";

// Təkrar-istifadəli admin cədvəli — global filtr, sıralama, səhifələmə, sütun görünürlüyü,
// sətir seçimi (checkbox), CSV export, skeleton + empty state. TanStack-siz, yüngül.

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Search, Download, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { TableSkeleton, EmptyState } from "@/components/admin/ui";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number; // sort/filtr/CSV üçün mətn dəyəri
  sortable?: boolean;
  align?: "left" | "right" | "center";
  hideable?: boolean;
  className?: string;
}

// Sütunun mətn dəyəri (axtarış/sıralama/CSV üçün). Komponentdən kənardadır ki,
// hər render-də yenidən yaranıb useMemo-nu bosuna sıfırlamasın.
function val<T>(row: T, c: Column<T>): string | number {
  return c.value ? c.value(row) : "";
}

export function DataTable<T>({
  columns, data, getRowId, searchable = true, searchPlaceholder = "Axtar…",
  selectable = false, selected, onSelectedChange, onRowClick,
  csvName, loading = false, emptyText = "Məlumat yoxdur.", toolbar, minWidth = 720,
}: {
  columns: Column<T>[]; data: T[]; getRowId: (row: T) => string;
  searchable?: boolean; searchPlaceholder?: string;
  selectable?: boolean; selected?: Set<string>; onSelectedChange?: (s: Set<string>) => void;
  onRowClick?: (row: T) => void; csvName?: string; loading?: boolean; emptyText?: string;
  toolbar?: ReactNode; minWidth?: number;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<-1 | 1>(1);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [colMenu, setColMenu] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = s
      ? data.filter((r) => columns.some((c) => String(val(r, c)).toLowerCase().includes(s)))
      : [...data];
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.value) out.sort((a, b) => {
        const av = col.value!(a), bv = col.value!(b);
        if (av < bv) return -sortDir; if (av > bv) return sortDir; return 0;
      });
    }
    return out;
  }, [data, q, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const visibleCols = columns.filter((c) => !hidden.has(c.key));

  function toggleSort(c: Column<T>) {
    if (!c.sortable) return;
    if (sortKey === c.key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(c.key); setSortDir(1); }
  }
  function exportCsv() {
    const cols = columns.filter((c) => c.value);
    const head = cols.map((c) => c.header);
    const lines = filtered.map((r) => cols.map((c) => `"${String(c.value!(r)).replace(/"/g, '""')}"`).join(","));
    const csv = [head.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url;
    a.download = `${csvName ?? "export"}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // Seçim
  const allPageSelected = selectable && pageRows.length > 0 && pageRows.every((r) => selected?.has(getRowId(r)));
  const toggleRow = (id: string) => {
    if (!onSelectedChange) return;
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    onSelectedChange(n);
  };
  const togglePage = () => {
    if (!onSelectedChange) return;
    const n = new Set(selected);
    if (allPageSelected) pageRows.forEach((r) => n.delete(getRowId(r)));
    else pageRows.forEach((r) => n.add(getRowId(r)));
    onSelectedChange(n);
  };

  return (
    <div>
      {/* Alət paneli */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {searchable && (
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-[7px] focus-within:border-brand/50">
            <Search size={15} className="shrink-0 text-muted" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }}
              placeholder={searchPlaceholder} className="min-w-0 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-muted/70" />
            <span className="tabular shrink-0 text-[11px] font-medium text-muted">{filtered.length}</span>
          </div>
        )}
        {toolbar}
        <div className="relative">
          <button onClick={() => setColMenu((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-[7px] text-[13px] font-medium text-fg transition-colors hover:bg-panel-2">
            <SlidersHorizontal size={14} /> Sütunlar
          </button>
          {colMenu && (
            <div className="admin-surface absolute right-0 z-20 mt-1 w-52 rounded-md p-1.5" style={{ boxShadow: "var(--admin-shadow-lg)" }}>
              {columns.filter((c) => c.hideable).map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] text-fg hover:bg-panel-2">
                  <input type="checkbox" checked={!hidden.has(c.key)} onChange={() => setHidden((prev) => {
                    const n = new Set(prev);
                    if (n.has(c.key)) n.delete(c.key); else n.add(c.key);
                    return n;
                  })} />
                  {c.header}
                </label>
              ))}
            </div>
          )}
        </div>
        {csvName && (
          <button onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-[7px] text-[13px] font-medium text-fg transition-colors hover:bg-panel-2">
            <Download size={14} /> CSV
          </button>
        )}
      </div>

      {loading ? <TableSkeleton /> : filtered.length === 0 ? <EmptyState text={emptyText} /> : (
        <div className="admin-surface overflow-x-auto rounded-[10px]">
          <table className="w-full text-[13px]" style={{ minWidth }}>
            <thead>
              <tr className="border-b border-line bg-panel-2/50 text-left text-[11px] uppercase tracking-[0.05em] text-muted">
                {selectable && (
                  <th className="w-10 px-3 py-2.5"><input type="checkbox" checked={allPageSelected} onChange={togglePage} aria-label="Səhifəni seç" /></th>
                )}
                {visibleCols.map((c) => (
                  <th key={c.key} className={`px-3 py-2.5 font-semibold ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""}`}>
                    {c.sortable ? (
                      <button onClick={() => toggleSort(c)} className={`inline-flex items-center gap-1 transition-colors hover:text-fg ${sortKey === c.key ? "text-fg" : ""}`}>
                        {c.header}{sortKey === c.key && (sortDir === 1 ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </button>
                    ) : c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => {
                const id = getRowId(r);
                return (
                  <tr key={id} onClick={() => onRowClick?.(r)}
                    className={`border-b border-line/60 transition-colors last:border-b-0 ${onRowClick ? "cursor-pointer hover:bg-panel-2/70" : ""} ${selected?.has(id) ? "bg-brand/[0.06]" : ""}`}>
                    {selectable && (
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected?.has(id) ?? false} onChange={() => toggleRow(id)} aria-label="Seç" />
                      </td>
                    )}
                    {visibleCols.map((c) => (
                      <td key={c.key} className={`px-3 py-2.5 ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""} ${c.className ?? "text-fg"}`}>
                        {c.render ? c.render(r) : String(val(r, c))}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Səhifələmə */}
      {!loading && filtered.length > pageSize && (
        <div className="mt-3 flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-2 text-muted">
            <span className="tabular">
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} / {filtered.length}
            </span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="rounded-md border border-line bg-panel px-1.5 py-1 text-fg">
              {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}/səhifə</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="tabular text-muted">Səhifə {page + 1}/{pageCount}</span>
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Əvvəlki"
              className="rounded-md border border-line px-1.5 py-1 text-fg transition-colors hover:bg-panel-2 disabled:opacity-40 disabled:hover:bg-transparent"><ChevronLeft size={15} /></button>
            <button disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} aria-label="Növbəti"
              className="rounded-md border border-line px-1.5 py-1 text-fg transition-colors hover:bg-panel-2 disabled:opacity-40 disabled:hover:bg-transparent"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
