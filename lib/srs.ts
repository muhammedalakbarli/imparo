// Aralıqlı təkrar (SRS) — Leitner qutuları ilə səhv edilən tapşırıqların
// planlaşdırılmış təkrarı. Düz siyahı ("mistakes") əvəzinə hər item-in qutusu (box)
// və növbəti təkrar vaxtı (dueAt) var; beləcə yalnız "vaxtı çatmış" itemlər təkrara düşür
// (unutma əyrisi). Saxlanc: Supabase user_metadata.reviews (hər cihazda qalır).
//
// BACARIQ HƏSSASLIĞI: unutma əyrisi tapşırığın yox, BACARIĞIN xassəsidir.
// Şagird `arith.sub.borrow`-da zəifdirsə, bir keçidli çıxma sualına düz cavab
// vermək 16 günlük fasilə qazandırmamalıdır — bacarıq hələ oturmayıb. Ona görə
// interval `factor` ilə vurulur: zəif bacarıqda qısalır, güclüdə uzanır.
// Faktoru hesablamaq `lib/mastery.ts`-in işidir (bu modul saf qalsın).
//
// Saf funksiyalar (aşağıda) DB-siz test edilir; async qat yalnız oxu/yazı edir.

import { createClient } from "./supabase/client";

export interface SrsItem {
  id: string; // task id
  box: number; // 0..MAX_BOX (0 = təzə/səhv, yüksək = yaxşı mənimsənilib)
  dueAt: number; // epoch ms — bu vaxtdan sonra təkrara düşür
}

export const MAX_BOX = 5;
const DAY = 86_400_000;

// Leitner intervalları (gün) — box-a görə növbəti təkrara qədər gözləmə.
// box 1 → 1 gün, 2 → 3, 3 → 7, 4 → 16, 5 → 35 gün. (box 0 dərhal təkrar.)
export const INTERVALS_DAYS = [0, 1, 3, 7, 16, 35];

function intervalMs(box: number): number {
  const b = Math.max(0, Math.min(box, INTERVALS_DAYS.length - 1));
  return INTERVALS_DAYS[b] * DAY;
}

// ── Saf planlaşdırma məntiqi (test edilir) ──

/** İntervalın bacarığa görə vurulduğu əmsalın hədləri. */
export const MIN_FACTOR = 0.3;
export const MAX_FACTOR = 1.5;

export function clampFactor(f: number): number {
  if (!Number.isFinite(f)) return 1;
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, f));
}

// Düz cavab: qutunu bir irəli apar, növbəti təkrarı gələcəyə planla.
// `factor` bacarıq üzrə mənimsəmədən gəlir (1 = neytral).
export function scheduleCorrect(item: SrsItem, now: number, factor = 1): SrsItem {
  const box = Math.min(item.box + 1, MAX_BOX);
  return { id: item.id, box, dueAt: now + Math.round(intervalMs(box) * clampFactor(factor)) };
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

// Düz cavabı tətbiq et. MAX_BOX-a çatıb düz cavablanıbsa item "mənimsənilmiş"
// sayılır və siyahıdan çıxarılır (siyahı sonsuz böyüməsin).
export function applyCorrect(items: SrsItem[], id: string, now: number, factor = 1): SrsItem[] {
  const found = items.find((it) => it.id === id);
  if (!found) return items;
  const rest = items.filter((it) => it.id !== id);
  // Bacarıq zəifdirsə item MAX_BOX-da olsa belə "mənimsənildi" saymırıq: bir düz
  // cavab zəif bacarığı bağlamamalıdır. Əvəzinə bir qutu geri qaytarılır.
  if (found.box >= MAX_BOX) {
    if (factor >= 1) return rest;
    return [...rest, { id, box: MAX_BOX - 1, dueAt: now + Math.round(intervalMs(MAX_BOX - 1) * clampFactor(factor)) }];
  }
  return [...rest, scheduleCorrect(found, now, factor)];
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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const stored = user?.user_metadata?.reviews;
  if (Array.isArray(stored)) return { reviews: stored as SrsItem[], legacy: false };
  // Köhnə format?
  const old = user?.user_metadata?.mistakes;
  if (Array.isArray(old)) return { reviews: migrateFromMistakes(old as string[], Date.now()), legacy: true };
  return { reviews: [], legacy: false };
}

async function write(reviews: SrsItem[]): Promise<void> {
  const supabase = createClient();
  await supabase.auth.updateUser({ data: { reviews } });
}

// Bütün təkrar itemləri (səhifə statistikası üçün).
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
export async function markCorrect(taskId: string, factor = 1): Promise<void> {
  try {
    const { reviews } = await readRaw();
    if (!reviews.some((it) => it.id === taskId)) return;
    await write(applyCorrect(reviews, taskId, Date.now(), factor));
  } catch {
    // sükutla ötür
  }
}
