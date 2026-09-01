// Müəllim video dərsləri — yükləmə + RPC sarğıları (migration 0056).
//
// Yükləmə BİRBAŞA brauzerdən Supabase Storage-a gedir: fayl Worker-dən keçmir.
// Səbəb: Cloudflare Worker-in sorğu gövdəsi limiti və CPU büdcəsi var — 100 MB-lıq
// video onun içindən keçirilməməlidir. Storage tərəfdə icazəni RLS qoruyur
// (yalnız təsdiqlənmiş müəllim, yalnız öz qovluğuna).

import { createClient } from "./supabase/client";

const BUCKET = "lesson-videos";

/** Yüklənən faylın icazə verilən maksimum həcmi (bucket limiti ilə eyni). */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await createClient().rpc(fn, args);
  if (error) throw error;
  return data as T;
}

/* ── Tiplər ── */

export type VideoProvider = "upload" | "youtube" | "url";

export interface ClassVideo {
  id: string;
  title: string;
  description: string | null;
  src: string;
  poster: string | null;
  provider: VideoProvider;
  duration_sec: number | null;
  created_at: string;
  views: number;
  watched: boolean;
}

export interface MyVideo {
  id: string;
  class_id: string | null;
  class_name: string | null;
  title: string;
  src: string;
  provider: VideoProvider;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  views: number;
}

export interface LibraryVideo {
  id: string;
  title: string;
  description: string | null;
  src: string;
  poster: string | null;
  provider: VideoProvider;
  duration_sec: number | null;
  subject_slug: string | null;
  grade: number | null;
  teacher_name: string;
  created_at: string;
}

/* ── YouTube ── */

// Nativ <video> YouTube linkini oynada bilmir — pleyer iframe-ə keçməlidir.
// Bu funksiya həm formada linki tanımaq, həm də pleyerdə embed ünvanı qurmaq üçündür.
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

/* ── Yükləmə ── */

export interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

/**
 * Videonu Storage-a yükləyir və ictimai URL qaytarır.
 * Yol: `<müəllim id>/<vaxt damğası>-<ad>.mp4` — RLS prefiks yoxlaması buna görədir.
 */
export async function uploadVideo(file: File): Promise<UploadResult> {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { ok: false, error: "Yalnız MP4 və ya WebM formatı qəbul olunur." };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return {
      ok: false,
      error: `Fayl çox böyükdür (${(file.size / 1048576).toFixed(0)} MB). Limit 100 MB — videonu sıxıb yenidən cəhd et və ya YouTube linki əlavə et.`,
    };
  }

  const sb = createClient();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { ok: false, error: "Giriş tələb olunur." };

  // Fayl adını təhlükəsizləşdir: yalnız latın hərfi/rəqəm qalsın (Storage açarında
  // boşluq və Azərbaycan hərfləri problem yaradır).
  const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, "-").slice(-60);
  const path = `${uid}/${Date.now()}-${safe}`;

  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { ok: false, error: error.message };

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/* ── RPC sarğıları ── */

export interface NewVideoInput {
  title: string;
  src: string;
  classId?: string | null;
  description?: string;
  provider?: VideoProvider;
  poster?: string | null;
  durationSec?: number | null;
  subjectSlug?: string | null;
  grade?: number | null;
}

export function createVideo(v: NewVideoInput): Promise<string> {
  return rpc<string>("create_teacher_video", {
    p_title: v.title,
    p_src: v.src,
    p_class_id: v.classId ?? null,
    p_description: v.description ?? null,
    p_provider: v.provider ?? "upload",
    p_poster: v.poster ?? null,
    p_duration_sec: v.durationSec ?? null,
    p_subject_slug: v.subjectSlug ?? null,
    p_grade: v.grade ?? null,
  });
}

export const updateVideo = (id: string, title?: string, description?: string) =>
  rpc<null>("update_teacher_video", { p_id: id, p_title: title ?? null, p_description: description ?? null });

export const deleteVideo = (id: string) => rpc<null>("delete_teacher_video", { p_id: id });

export const classVideos = (classId: string) =>
  rpc<ClassVideo[]>("class_videos", { p_class_id: classId }).catch(() => [] as ClassVideo[]);

export const myVideos = () => rpc<MyVideo[]>("my_teacher_videos").catch(() => [] as MyVideo[]);

export const libraryVideos = (grade?: number | null, subject?: string | null) =>
  rpc<LibraryVideo[]>("library_videos", { p_grade: grade ?? null, p_subject: subject ?? null })
    .catch(() => [] as LibraryVideo[]);

export const markWatched = (id: string) =>
  rpc<null>("mark_video_watched", { p_id: id }).catch(() => null);

/* ── Admin moderasiyası ── */

export interface AdminVideoRow {
  id: string;
  title: string;
  description: string | null;
  src: string;
  provider: VideoProvider;
  status: "pending" | "approved" | "rejected";
  teacher_email: string | null;
  teacher_name: string;
  subject_slug: string | null;
  grade: number | null;
  created_at: string;
}

export const adminVideoQueue = () =>
  rpc<AdminVideoRow[]>("admin_video_queue").catch(() => [] as AdminVideoRow[]);

export async function adminDecideVideo(id: string, approve: boolean): Promise<{ ok: boolean; error?: string }> {
  const { error } = await createClient().rpc("admin_decide_video", { p_id: id, p_approve: approve });
  return { ok: !error, error: error?.message };
}
