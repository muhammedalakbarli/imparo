"use client";

// Admin · Məzmun performansı — dərs üzrə tamamlama və öyrənən sayı. DataTable.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { useAuthUser } from "@/lib/useAuthUser";
import { checkIsAdmin, adminLessonStats, type AdminLessonStat } from "@/lib/adminApi";
import { PageHeader } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/DataTable";

export default function AdminContentPerfPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<AdminLessonStat[] | null>(null);
  const [grade, setGrade] = useState<number | "all">("all");

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);
  useEffect(() => { if (isAdmin === true) adminLessonStats(1000).then(setRows); }, [isAdmin]);

  const grades = useMemo(() => [...new Set((rows ?? []).map((r) => r.grade))].sort((a, b) => a - b), [rows]);
  const data = useMemo(
    () => (grade === "all" ? rows ?? [] : (rows ?? []).filter((r) => r.grade === grade)),
    [rows, grade],
  );

  const cols: Column<AdminLessonStat>[] = [
    { key: "title", header: "Dərs", sortable: true, value: (r) => r.title, className: "max-w-[240px] truncate font-semibold text-fg" },
    { key: "subject", header: "Fənn", value: (r) => `${r.subject} · ${r.grade}`, className: "whitespace-nowrap text-muted" },
    { key: "completions", header: "Tamamlanma", sortable: true, align: "right", value: (r) => Number(r.completions), render: (r) => <b className="text-brand">{Number(r.completions)}</b> },
    { key: "learners", header: "Öyrənən", sortable: true, align: "right", value: (r) => Number(r.learners), className: "text-right text-muted" },
  ];

  if (isAdmin !== true) return null;

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-8">
      <PageHeader Icon={BookOpen} title="Məzmun performansı" desc="Hansı dərslər çox/az tamamlanır — zəif nöqtələri tap." />
      <div className="mt-4">
        <DataTable columns={cols} data={data} getRowId={(r) => r.lesson_id}
          loading={!ready || !rows} csvName="mezmun-performans" emptyText="Məlumat yoxdur." minWidth={560}
          searchPlaceholder="Dərs adı…"
          toolbar={
            <select value={grade} onChange={(e) => setGrade(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="rounded-md border border-line bg-panel px-3 py-2 text-sm font-semibold text-fg">
              <option value="all">Bütün siniflər</option>
              {grades.map((g) => <option key={g} value={g}>{g}-ci sinif</option>)}
            </select>
          } />
      </div>
    </main>
  );
}
