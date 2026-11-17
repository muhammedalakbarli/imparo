"use client";

// Sinfin video dərsləri — müəllim yükləyir, şagird izləyir (migration 0056).
//
// Eyni komponent hər iki tərəfdə işlədilir: `canManage` müəllim rejimini açır
// (yükləmə formu, silmə, baxış sayı). Şagird tərəfində yalnız siyahı və pleyer var.
//
// Pleyer olaraq dərs videosunun pleyeri (`LessonVideo`) yenidən istifadə olunur —
// orada mobil üçün lazım olan hər şey (preload=none, poster, YouTube budağı,
// "video açılmadı" halı) artıq həll olunub.

import { useCallback, useEffect, useRef, useState } from "react";
import { Video, Upload, Link2, Trash2, Eye, Play, X, CircleCheck } from "lucide-react";
import LessonVideo from "@/components/lesson/LessonVideo";
import {
  classVideos, createVideo, deleteVideo, markWatched, uploadVideo, youtubeId,
  MAX_VIDEO_BYTES, type ClassVideo,
} from "@/lib/videos";
import { azShortDate } from "@/lib/azDate";

type Mode = "upload" | "link";

export default function ClassVideos({
  classId,
  canManage = false,
  subjectSlug,
  grade,
}: {
  classId: string;
  canManage?: boolean;
  /** Ümumi kitabxanaya göndərmək üçün lazımdır (sinfin fənni və sinif səviyyəsi). */
  subjectSlug?: string;
  grade?: number;
}) {
  const [videos, setVideos] = useState<ClassVideo[] | null>(null);
  const [open, setOpen] = useState<string | null>(null); // açıq pleyerin id-si
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<Mode>("upload");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [toLibrary, setToLibrary] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => { classVideos(classId).then(setVideos); }, [classId]);
  useEffect(() => { reload(); }, [reload]);

  function reset() {
    setTitle(""); setLink(""); setFile(null); setAdding(false); setMsg(null); setToLibrary(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit() {
    if (busy) return;
    const t = title.trim();
    if (!t) { setMsg({ ok: false, text: "Başlıq yaz." }); return; }

    setBusy(true);
    setMsg(null);
    try {
      // Kitabxana videosunda `classId` NULL göndərilir — RPC onu moderasiyaya salır.
      const target = toLibrary
        ? { classId: null, subjectSlug, grade }
        : { classId };

      if (mode === "upload") {
        if (!file) { setMsg({ ok: false, text: "Fayl seç." }); return; }
        const up = await uploadVideo(file);
        if (!up.ok || !up.url) { setMsg({ ok: false, text: up.error ?? "Yüklənmədi." }); return; }
        await createVideo({ title: t, src: up.url, provider: "upload", ...target });
      } else {
        const url = link.trim();
        if (!url) { setMsg({ ok: false, text: "Link yaz." }); return; }
        // YouTube linki ayrıca işarələnir ki, pleyer iframe-ə keçsin.
        await createVideo({
          title: t, src: url,
          provider: youtubeId(url) ? "youtube" : "url",
          ...target,
        });
      }
      const wasLibrary = toLibrary;
      reset();
      reload();
      if (wasLibrary) {
        setAdding(true);
        setMsg({ ok: true, text: "Göndərildi — admin təsdiqindən sonra kitabxanada görünəcək." });
      }
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Xəta baş verdi." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await deleteVideo(id).catch(() => null);
    if (open === id) setOpen(null);
    reload();
  }

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
          <Video size={18} className="text-brand" /> Video dərslər
        </h2>
        {canManage && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="rounded-xl bg-brand px-3.5 py-2 text-sm font-extrabold text-white btn-pop hover:bg-brand-dark"
          >
            Video əlavə et
          </button>
        )}
      </div>

      {/* ── Əlavə etmə formu (yalnız müəllim) ── */}
      {canManage && adding && (
        <div className="mt-3 rounded-2xl border-2 border-line bg-card shadow-[0_4px_0_0_var(--color-line)] p-4">
          <div className="flex gap-1.5">
            {([["upload", "Fayl yüklə", Upload], ["link", "Link əlavə et", Link2]] as const).map(
              ([m, label, Icon]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold transition-colors ${
                    mode === m ? "bg-brand text-white" : "border border-line text-muted hover:text-fg"
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ),
            )}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Video başlığı (məs. Kəsrlərin toplanması)"
            className="mt-3 w-full rounded-xl border-2 border-line bg-ink px-4 py-2.5 font-bold text-fg outline-none focus:border-brand"
          />

          {mode === "upload" ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/webm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-3 w-full rounded-xl border-2 border-dashed border-line bg-ink px-4 py-3 text-sm font-semibold text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:font-bold file:text-white"
              />
              <p className="mt-2 text-xs text-muted">
                MP4 və ya WebM · ən çox {Math.round(MAX_VIDEO_BYTES / 1048576)} MB.
                720p slayd dərsi təxminən 5 MB/dəqiqədir — daha uzun video üçün YouTube linki əlavə et.
              </p>
            </>
          ) : (
            <>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://youtube.com/watch?v=… və ya birbaşa .mp4 ünvanı"
                className="mt-3 w-full rounded-xl border-2 border-line bg-ink px-4 py-2.5 font-semibold text-fg outline-none focus:border-brand"
              />
              <p className="mt-2 text-xs text-muted">
                YouTube videosunu «siyahıya salınmayan» (unlisted) rejimdə paylaşsan, yalnız linki
                olan görər.
              </p>
            </>
          )}

          {/* Ümumi kitabxana: sinifdən kənar bütün şagirdlərə açıq → admin təsdiqi tələb olunur
              (uşaq platformasında açıq məzmun moderasiyasız yayımlanmır). */}
          <label className="mt-3 flex items-start gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={toLibrary}
              onChange={(e) => setToLibrary(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="font-bold text-fg">Ümumi kitabxanaya göndər</span> — bu sinifdən başqa
              bütün Imparo şagirdləri görə bilər. Admin təsdiqindən sonra açılır.
            </span>
          </label>

          {msg && (
            <p className={`mt-2 text-sm font-bold ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>
              {msg.text}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={submit}
              disabled={busy}
              className="rounded-xl bg-brand px-5 py-2.5 font-extrabold text-white btn-pop hover:bg-brand-dark disabled:opacity-50"
            >
              {busy ? (mode === "upload" ? "Yüklənir…" : "Əlavə olunur…") : "Yadda saxla"}
            </button>
            <button
              onClick={reset}
              disabled={busy}
              className="rounded-xl border border-line px-4 py-2.5 font-bold text-fg hover:border-brand disabled:opacity-50"
            >
              Ləğv et
            </button>
          </div>
        </div>
      )}

      {/* ── Siyahı ── */}
      {videos === null ? (
        <p className="mt-3 text-sm text-muted">Yüklənir…</p>
      ) : videos.length === 0 ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-line bg-card shadow-[0_4px_0_0_var(--color-line)] p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-panel-2 text-muted">
            <Video size={22} strokeWidth={2.3} />
          </span>
          <p className="text-sm font-semibold text-muted">
            {canManage
              ? "Hələ video yoxdur. Dərsini çək və ya YouTube linki əlavə et — şagirdlər burada görəcək."
              : "Müəllim hələ video əlavə etməyib."}
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {videos.map((v) => (
            <div key={v.id} className="overflow-hidden rounded-2xl border-2 border-line bg-card shadow-[0_4px_0_0_var(--color-line)]">
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setOpen(open === v.id ? null : v.id)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand/12 text-brand transition-colors hover:bg-brand/20"
                  aria-label={open === v.id ? "Bağla" : "İzlə"}
                >
                  {open === v.id ? <X size={20} /> : <Play size={20} strokeWidth={2.5} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-extrabold text-fg">{v.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {azShortDate(v.created_at)}
                    {canManage && (
                      <span className="flex items-center gap-1">
                        <Eye size={11} /> {v.views}
                      </span>
                    )}
                    {!canManage && v.watched && (
                      <span className="flex items-center gap-1 font-bold text-emerald-600">
                        <CircleCheck size={11} /> izlədin
                      </span>
                    )}
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={() => remove(v.id)}
                    aria-label="Sil"
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {open === v.id && (
                <div className="px-4 pb-4">
                  {v.description && <p className="mb-2 text-sm text-muted">{v.description}</p>}
                  <LessonVideo
                    video={{
                      src: v.src,
                      poster: v.poster ?? undefined,
                      durationSec: v.duration_sec ?? undefined,
                    }}
                    onWatched={() => {
                      // Sayğac yalnız bir dəfə artır (RPC `on conflict do nothing`).
                      void markWatched(v.id).then(reload);
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
