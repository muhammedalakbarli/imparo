"use client";

// Admin · Dərs videoları — toplu bağlama və istehsal növbəsi (migration 0061).
//
// Qərar: hər dərsdə video olacaq (806 dərs). Mövcud dərs formasında videonu
// bir-bir yazmaq bu miqyasda mümkün deyil, ona görə üç iş burada birləşdirilib:
//
//   1. LİNK SİYAHISI — YouTube/xarici ünvanların toplu bağlanması. Əsas iş axını
//      budur: video YouTube-da saxlanılır (pulsuz, adaptiv keyfiyyət), öyrənmə
//      qatı bizdə qalır.
//   2. FAYL YÜKLƏMƏ — fayl adı dərs id-si ilə eynidirsə, uyğunlaşdırma avtomatikdir.
//      Storage pulsuz səviyyəsi 1 GB-dır, ona görə bu yol yalnız az sayda video üçündür.
//   3. NÖVBƏ — hansı dərsdə video yoxdur. Sıralama cəhd sayına görə: şagirdin
//      faktiki toxunduğu dərs birinci çəkilməlidir.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Link2, Upload, ListChecks, Check, X, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuthUser } from "@/lib/useAuthUser";
import {
  checkIsAdmin, adminLessonVideoStatus, adminBulkSetLessonVideo, adminClearLessonVideo,
  type LessonVideoRow, type BulkVideoItem,
} from "@/lib/adminApi";
import { uploadCurriculumFile, youtubeId } from "@/lib/videos";
import { PageShell, PageHeader, StatCard, Button, Badge, Card } from "@/components/admin/ui";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { useConfirm } from "@/components/admin/ConfirmDialog";

type Tab = "links" | "files" | "queue";

/** "dərs-id  ünvan  [altyazı]" sətirlərini ayırır (vergül, tab və ya boşluq). */
function parseLines(text: string): { items: BulkVideoItem[]; bad: string[] } {
  const items: BulkVideoItem[] = [];
  const bad: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/[,\t]|\s{2,}|\s+/).map((p) => p.trim()).filter(Boolean);
    const [lesson, src, captions] = parts;
    if (!lesson || !src || !/^https?:\/\/|^\//.test(src)) { bad.push(line); continue; }
    items.push({ lesson_id: lesson, src, ...(captions ? { captions } : {}) });
  }
  return { items, bad };
}

export default function AdminLessonVideosPage() {
  const router = useRouter();
  const { user, ready } = useAuthUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<LessonVideoRow[] | null>(null);
  const [tab, setTab] = useState<Tab>("links");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [onlyMissing, setOnlyMissing] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  useEffect(() => { if (user) checkIsAdmin().then(setIsAdmin); }, [user]);
  useEffect(() => { if (isAdmin === false) router.replace("/dashboard"); }, [isAdmin, router]);

  const reload = useCallback(() => { adminLessonVideoStatus().then(setRows); }, []);
  useEffect(() => { if (isAdmin === true) reload(); }, [isAdmin, reload]);

  // `useMemo` asılılığı sabit qalsın deyə (rows null olanda hər renderdə yeni massiv yaranırdı).
  const all = useMemo(() => rows ?? [], [rows]);
  const withVideo = all.filter((r) => r.has_video).length;
  const pct = all.length ? Math.round((withVideo / all.length) * 100) : 0;

  const parsed = useMemo(() => parseLines(text), [text]);
  const known = useMemo(() => new Set(all.map((r) => r.lesson_id)), [all]);

  async function applyLinks() {
    if (!parsed.items.length || busy) return;
    setBusy(true);
    const res = await adminBulkSetLessonVideo(parsed.items);
    setBusy(false);
    if (!res.ok) { toast.error(res.error || "Alınmadı"); return; }
    const r = res.result;
    toast.success(`${r?.updated ?? 0} dərsə video bağlandı`);
    if (r?.missing) toast.error(`${r.missing} dərs id-si tapılmadı: ${r.missing_ids.slice(0, 3).join(", ")}…`);
    setText("");
    reload();
  }

  // Fayl adı = dərs id-si. Ardıcıl yüklənir: paralel yükləmə mobil şəbəkədə
  // və Storage limitində daha çox xəta verir.
  async function uploadFiles(files: FileList) {
    if (busy) return;
    setBusy(true);
    const items: BulkVideoItem[] = [];
    const failed: string[] = [];
    let i = 0;
    for (const file of Array.from(files)) {
      i++;
      const lessonId = file.name.replace(/\.[^.]+$/, "");
      const isVtt = /\.vtt$/i.test(file.name);
      setProgress(`${i}/${files.length} · ${lessonId}${isVtt ? " (altyazı)" : ""}`);
      if (!known.has(lessonId)) { failed.push(`${file.name} (dərs tapılmadı)`); continue; }

      // Altyazı faylı videonu əvəz etmir — mövcud `src` saxlanılmalıdır, əks halda
      // .vtt yükləmək videonu silərdi.
      const existing = all.find((r) => r.lesson_id === lessonId)?.src ?? null;
      if (isVtt && !existing) { failed.push(`${file.name} (əvvəlcə video bağlanmalıdır)`); continue; }

      const up = await uploadCurriculumFile(file, lessonId);
      if (!up.ok || !up.url) { failed.push(`${file.name} (${up.error ?? "yüklənmədi"})`); continue; }

      items.push(isVtt
        ? { lesson_id: lessonId, src: existing as string, captions: up.url }
        : { lesson_id: lessonId, src: up.url });
    }
    setProgress(null);

    if (items.length) {
      const res = await adminBulkSetLessonVideo(items);
      if (!res.ok) toast.error(res.error || "Bağlanmadı");
      else toast.success(`${res.result?.updated ?? 0} video yükləndi və bağlandı`);
    }
    if (failed.length) toast.error(`${failed.length} fayl keçmədi: ${failed.slice(0, 2).join("; ")}`);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    reload();
  }

  async function clear(r: LessonVideoRow) {
    if (!(await confirm({
      title: "Video ayrılsın?",
      message: `“${r.title}” dərsindən video linki silinir. Fayl Storage-da qalır.`,
      danger: true, confirmText: "Ayır",
    }))) return;
    const res = await adminClearLessonVideo(r.lesson_id);
    if (!res.ok) { toast.error(res.error || "Alınmadı"); return; }
    toast.success("Video ayrıldı");
    reload();
  }

  // Növbəni CSV kimi çıxarmaq — çəkiliş cədvəli komandada elektron cədvəldə aparılır.
  function exportQueue() {
    const list = all.filter((r) => !r.has_video);
    const head = "dərs id,başlıq,bölmə,fənn,sinif,cəhd";
    const lines = list.map((r) =>
      [r.lesson_id, r.title, r.unit_title, r.subject, r.grade, r.attempts]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    );
    const url = URL.createObjectURL(new Blob(["﻿" + [head, ...lines].join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-novbesi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cols: Column<LessonVideoRow>[] = [
    {
      key: "lesson", header: "Dərs", sortable: true,
      value: (r) => r.title,
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-fg">{r.title}</div>
          <div className="truncate font-mono text-[11px] text-muted">{r.lesson_id}</div>
        </div>
      ),
      className: "max-w-[280px]",
    },
    {
      key: "subject", header: "Fənn", sortable: true, hideable: true,
      value: (r) => `${r.grade} ${r.subject}`,
      render: (r) => <span className="text-muted">{r.subject} · {r.grade}</span>,
    },
    { key: "unit", header: "Bölmə", hideable: true, value: (r) => r.unit_title, className: "max-w-[200px] truncate text-muted" },
    {
      key: "attempts", header: "Cəhd", sortable: true, align: "right",
      value: (r) => r.attempts,
      render: (r) => <span className="tabular text-muted">{r.attempts}</span>,
    },
    {
      key: "video", header: "Video", sortable: true,
      value: (r) => (r.has_video ? "1" : "0"),
      render: (r) => r.has_video
        ? <Badge tone="green"><Check size={11} /> {r.src && youtubeId(r.src) ? "YouTube" : "var"}</Badge>
        : <Badge tone="muted">yoxdur</Badge>,
    },
    {
      key: "act", header: "", align: "right",
      render: (r) => r.has_video
        ? <Button size="sm" variant="danger" Icon={Trash2} onClick={() => clear(r)} />
        : <span className="text-[11px] text-muted">—</span>,
    },
  ];

  if (isAdmin !== true) return null;

  return (
    <PageShell>
      <PageHeader
        Icon={Video}
        title="Dərs videoları"
        desc="Kurikulum dərslərinə video bağlamaq. Fayl adı dərs id-si ilə eynidirsə, uyğunlaşdırma avtomatik gedir."
        actions={<Button Icon={Download} onClick={exportQueue}>Növbəni CSV</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard Icon={ListChecks} label="Dərs (video tələb edən)" value={all.length} />
        <StatCard Icon={Check} label="Videosu var" value={withVideo} tint="text-emerald-500" />
        <StatCard Icon={X} label="Qalıb" value={all.length - withVideo} tint="text-amber-500" />
        <StatCard Icon={Video} label="Tamamlanma" value={`${pct}%`} tint="text-brand" hint="Bütün dərslər üzrə" />
      </div>

      <div className="mt-6 inline-flex rounded-md border border-line bg-panel p-0.5">
        {([["links", "Link siyahısı", Link2], ["files", "Fayl yüklə", Upload], ["queue", "Növbə", ListChecks]] as const).map(
          ([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
                tab === k ? "bg-brand text-white" : "text-muted hover:text-fg"}`}>
              <Icon size={14} /> {label}
            </button>
          ),
        )}
      </div>

      {tab === "links" && (
        <div className="mt-3">
          <Card
            title="Toplu bağlama"
            desc="Hər sətirdə: dərs id-si, video ünvanı və istəyə bağlı altyazı (.vtt) ünvanı. Ayırıcı: vergül, tab və ya boşluq."
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={9}
              spellCheck={false}
              placeholder={"ry1-sayma-l1, https://youtu.be/XXXXXXXXXXX\nry1-sayma-l2, https://youtu.be/YYYYYYYYYYY, /altyazi/ry1-sayma-l2.vtt"}
              className="w-full rounded-md border border-line bg-panel px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-fg outline-none focus:border-brand/60"
            />

            {(parsed.items.length > 0 || parsed.bad.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px]">
                <span className="font-medium text-fg">{parsed.items.length} sətir oxundu</span>
                {(() => {
                  const unknown = parsed.items.filter((i) => known.size > 0 && !known.has(i.lesson_id));
                  return unknown.length > 0 ? (
                    <span className="text-red-500">
                      {unknown.length} dərs id-si bazada yoxdur: {unknown.slice(0, 3).map((u) => u.lesson_id).join(", ")}
                    </span>
                  ) : null;
                })()}
                {parsed.bad.length > 0 && (
                  <span className="text-amber-600">{parsed.bad.length} sətir oxunmadı (ünvan yoxdur)</span>
                )}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button variant="primary" Icon={Check} onClick={applyLinks} disabled={busy || !parsed.items.length}>
                {busy ? "Bağlanır…" : `${parsed.items.length} dərsə bağla`}
              </Button>
              <Button onClick={() => setText("")} disabled={busy}>Təmizlə</Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "files" && (
        <div className="mt-3">
          <Card
            title="Fayl yüklə"
            desc="Fayl adı dərs id-si olmalıdır: ry1-sayma-l1.mp4 → ry1-sayma-l1 dərsinə bağlanır."
          >
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="video/mp4,video/webm,.vtt"
              disabled={busy}
              onChange={(e) => { if (e.target.files?.length) uploadFiles(e.target.files); }}
              className="w-full rounded-md border border-dashed border-line bg-panel px-3 py-4 text-[13px] text-muted file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:font-medium file:text-white"
            />
            {progress && <p className="mt-2 text-[13px] font-medium text-fg">Yüklənir: {progress}</p>}
            <div className="mt-3 rounded-md border-l-2 border-amber-500 bg-amber-500/5 px-3 py-2 text-[12.5px] text-muted">
              <strong className="text-fg">Həcm barədə:</strong> Supabase pulsuz saxlancı 1 GB-dır — bu, təxminən
              80 dərs videosuna (720p, ~2.5 dəq) çatır. 806 dərsin hamısı üçün YouTube (siyahıya salınmayan)
              və ya R2 istifadə edin; pleyer hər ikisini oynadır.
            </div>
          </Card>
        </div>
      )}

      {tab === "queue" && (
        <div className="mt-3">
          <label className="mb-3 flex items-center gap-2 text-[13px] text-muted">
            <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
            Yalnız videosu olmayan dərslər
          </label>
          <DataTable
            columns={cols}
            data={onlyMissing ? all.filter((r) => !r.has_video) : all}
            getRowId={(r) => r.lesson_id}
            loading={!ready || rows === null}
            csvName="ders-videolari"
            searchPlaceholder="Dərs, fənn, bölmə…"
            minWidth={860}
          />
        </div>
      )}
    </PageShell>
  );
}
