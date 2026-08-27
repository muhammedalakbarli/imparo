// Aralıqlı təkrar (SRS) — Leitner qutuları ilə səhv edilən tapşırıqların planlaşdırılmış
// təkrarı. Web lib/srs.ts ilə eyni məntiq və eyni saxlanc: Supabase user_metadata.reviews
// → web və mobil AVTOMATİK sinxron (hər cihazda eyni təkrar planı).
import { supabase } from "./supabase";

export interface SrsItem {
  id: string; // task id
  box: number; // 0..MAX_BOX (0 = təzə/səhv, yüksək = yaxşı mənimsənilib)
  dueAt: number; // epoch ms — bu vaxtdan sonra təkrara düşür
}

export const MAX_BOX = 5;
const DAY = 86_400_000;

// Leitner intervalları (gün): box 1→1, 2→3, 3→7, 4→16, 5→35. (box 0 dərhal təkrar.)
export const INTERVALS_DAYS = [0, 1, 3, 7, 16, 35];

function intervalMs(box: number): number {
  const b = Math.max(0, Math.min(box, INTERVALS_DAYS.length - 1));
  return INTERVALS_DAYS[b] * DAY;
}

// ── Saf planlaşdırma məntiqi ──

// Düz cavab: qutunu bir irəli apar, növbəti təkrarı gələcəyə planla.
export function scheduleCorrect(item: SrsItem, now: number): SrsItem {
  const box = Math.min(item.box + 1, MAX_BOX);
  return { id: item.id, box, dueAt: now + intervalMs(box) };
}

// Səhv cavab: qutunu sıfırla, dərhal təkrara qoy.
export function scheduleWrong(id: string, now: number): SrsItem {
  return { id, box: 0, dueAt: now };
}

// Səhv qeydi əlavə et/yenilə (varsa sıfırla).
export function upsertWrong(items: SrsItem[], id: string, now: number): SrsItem[] {
  const rest = items.filter((it) => it.id !== id);
  return [...rest, scheduleWrong(id, now)];
}

// Düz cavabı tətbiq et. MAX_BOX-a çatıb düz cavablanıbsa item "mənimsənilmiş" sayılır və çıxarılır.
export function applyCorrect(items: SrsItem[], id: string, now: number): SrsItem[] {
  const found = items.find((it) => it.id === id);
  if (!found) return items;
  const rest = items.filter((it) => it.id !== id);
  if (found.box >= MAX_BOX) return rest; // mənimsənildi → çıxar
  return [...rest, scheduleCorrect(found, now)];
}

// Vaxtı çatmış (təkrara hazır) itemlər — ən erkəndən başlayaraq.
export function dueItems(items: SrsItem[], now: number): SrsItem[] {
  return items.filter((it) => it.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt);
}

// Köhnə düz "mistakes: string[]" formatını SRS itemlərinə çevir (hamısı dərhal due).
export function migrateFromMistakes(ids: string[], now: number): SrsItem[] {
  return ids.map((id) => ({ id, box: 0, dueAt: now }));
}

// ── Async saxlanc qatı (user_metadata) ──

async function readRaw(): Promise<{ reviews: SrsItem[]; legacy: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const stored = user?.user_metadata?.reviews;
  if (Array.isArray(stored)) return { reviews: stored as SrsItem[], legacy: false };
  const old = user?.user_metadata?.mistakes;
  if (Array.isArray(old)) return { reviews: migrateFromMistakes(old as string[], Date.now()), legacy: true };
  return { reviews: [], legacy: false };
}

async function write(reviews: SrsItem[]): Promise<void> {
  await supabase.auth.updateUser({ data: { reviews } });
}

// Bütün təkrar itemləri (statistika üçün).
export async function loadReviews(): Promise<SrsItem[]> {
  try {
    const { reviews, legacy } = await readRaw();
    if (legacy) await write(reviews); // köhnəni bir dəfə köçür
    return reviews;
  } catch {
    return [];
  }
}

// Vaxtı çatmış təkrarların task id-ləri.
export async function loadDueTaskIds(): Promise<string[]> {
  const reviews = await loadReviews();
  return dueItems(reviews, Date.now()).map((it) => it.id);
}

// Səhv edilən tapşırığı təkrar planına əlavə et.
export async function addWrong(taskId: string): Promise<void> {
  try {
    const { reviews } = await readRaw();
    await write(upsertWrong(reviews, taskId, Date.now()));
  } catch {
    // sükutla ötür — təkrar qeydi kritik deyil
  }
}

// Düz cavablanan tapşırığı irəli apar (və ya mənimsənilibsə çıxar).
export async function markCorrect(taskId: string): Promise<void> {
  try {
    const { reviews } = await readRaw();
    if (!reviews.some((it) => it.id === taskId)) return;
    await write(applyCorrect(reviews, taskId, Date.now()));
  } catch {
    // sükutla ötür
  }
}
