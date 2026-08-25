"use client";

// Tapşırıq cəhdlərinin jurnalı — analitika/ML üçün xam data (bax migration 0044).
//
// Niyə bufer: hər sualdan sonra ayrıca şəbəkə sorğusu göndərmək mobil bağlantıda
// həm gecikmə yaradır, həm də dərsin axıcılığını pozur. Cəhdlər yaddaşda yığılır
// və təbii dayanacaqlarda (dərs sonu, mərhələ sonu, səhifədən çıxış) partiya ilə
// göndərilir.
//
// Bu jurnal HEÇ VAXT dərsi sındırmamalıdır: bütün xətalar udulur, uğursuz göndəriş
// bir dəfə növbəyə qaytarılır, bufer isə hədlə saxlanılır.

import { createClient } from "./supabase/client";

export interface AttemptRow {
  task_id: string;
  lesson_id: string;
  correct: boolean;
  chosen?: string | null;   // seçilən variantın MƏTNİ (indeks yox — bax 0044)
  ms_taken?: number;        // sual göründüyü andan "Yoxla"ya qədər
  attempt_no?: number;      // eyni tapşırığa neçənci cəhd (təkrar mərhələsi)
  is_review?: boolean;      // SRS/təkrar, yoxsa ilk baxış
  // Cəhdin HARADAN yarandığı (migration 0051). MƏCBURİDİR: DB-də default
  // 'legacy' var, amma tip səviyyəsində məcbur edirik ki, yeni çağırış yeri
  // əlavə edəndə mənbəyi yazmağı unutmaq mümkün olmasın.
  source: AttemptSource;
}

export type AttemptSource = "lesson" | "diagnostic" | "adaptive" | "srs" | "free_practice";

const BATCH = 20;   // bu qədər yığılanda özü göndərir (log_attempts tavanı 50)
const MAX = 200;    // bufer bundan artıq şişməsin (offline uzun sürsə)

let buffer: AttemptRow[] = [];

// Cəhdi növbəyə at. Sinxrondur — çağıran yerdə heç nə gözləmir.
export function recordAttempt(row: AttemptRow): void {
  buffer.push(row);
  if (buffer.length > MAX) buffer = buffer.slice(-MAX);
  if (buffer.length >= BATCH) void flushAttempts();
}

// Növbəni serverə göndər. Uğursuz olsa sətirlər bir dəfə geri qaytarılır ki,
// keçici bağlantı problemi datanı itirməsin.
export async function flushAttempts(): Promise<void> {
  if (buffer.length === 0) return;
  const rows = buffer.slice(0, 50);
  buffer = buffer.slice(rows.length);
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("log_attempts", { p_rows: rows });
    if (error) throw error;
  } catch {
    // Səssiz geri qaytarma — jurnal heç vaxt istifadəçiyə görünən xəta olmamalıdır.
    buffer = [...rows, ...buffer].slice(0, MAX);
  }
}
