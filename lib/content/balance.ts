// Cavab mövqeyinin balanslaşdırılması — çoxseçimli/dinləmə tapşırıqlarında düzgün cavab
// çox vaxt BİRİNCİ variantda olurdu (müəllif həmişə düzgünü əvvələ yazırdı). Bu, oyunu
// təxminedilən edir. Burada hər tapşırığın variantlarını DETERMİNİSTİK (task.id-ə görə,
// sabit toxumla) qarışdırıb correctIndex-i yeni mövqeyə köçürürük.
//
// Niyə mənbədə (index.ts) tək nöqtədə: bütün siniflər, praktika hovuzu, seed və offline
// fallback avtomatik balanslaşır; gələcəkdə əlavə olunan məzmun üçün də özü işləyir →
// "cavab həmişə birinci" səhvi bir daha təkrarlanmır.

import type { Subject, Task } from "../types";

// Deterministik hash (FNV-1a) → 32-bit toxum.
function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Sabit PRNG (mulberry32) — eyni toxum həmişə eyni qarışdırma verir.
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tək tapşırıq: variantları deterministik qarışdır, correctIndex-i yenilə.
export function balanceTask<T extends Task>(task: T): T {
  if (task.type !== "multiple_choice" && task.type !== "listening") return task;
  const opts = task.options;
  if (!Array.isArray(opts) || opts.length < 2) return task;

  const rnd = mulberry32(seedOf(task.id));
  const perm = opts.map((_, i) => i);
  // Fisher-Yates
  for (let i = perm.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const options = perm.map((i) => opts[i]);
  const correctIndex = perm.indexOf(task.correctIndex);
  // Nadir halda düzgün cavab tapılmasa (məlumat xətası) — olduğu kimi qaytar.
  if (correctIndex < 0) return task;
  return { ...task, options, correctIndex };
}

// Bütün fənn ağacını balanslaşdır (əsas + bonus tapşırıqlar).
export function balanceSubjects(subjects: Subject[]): Subject[] {
  return subjects.map((s) => ({
    ...s,
    units: s.units.map((u) => ({
      ...u,
      lessons: u.lessons.map((l) => ({
        ...l,
        tasks: l.tasks.map(balanceTask),
        bonusTasks: l.bonusTasks ? l.bonusTasks.map(balanceTask) : l.bonusTasks,
      })),
    })),
  }));
}
