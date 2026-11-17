// Kiçik siniflər üçün vizual ipucu: sualdan "ədəd qatarı" çıxarır.
//   "6-dan sonra hansı ədəd gəlir?"        → [5, 6, ?]
//   "8-dən əvvəl hansı ədəd gəlir?"         → [?, 8, 9]
//   "4 və 6-nın arasında hansı ədəd var?"   → [4, ?, 6]
//   "6, 7, __, 9 — boş xanaya ..."          → [6, 7, ?, 9]
//   "2, 4, 6, ... — növbəti ədəd?"          → [2, 4, 6, ?]
// `null` = "?" xanası. Cavab QƏTİYYƏN göstərilmir — yalnız sıranın şəkli.
// Tanınmayan sualda null qaytarır (ipucu göstərilmir).

export type TrainItem = number | null;

const AFTER = /^(\d+)-(?:dan|dən) sonra (?:hansı ədəd|gələn ədəd)/u;
const BEFORE = /^(\d+)-(?:dan|dən) əvvəl (?:hansı ədəd|gələn ədəd)/u;
const NEIGHBOR_R = /^(\d+)-[iıuü]n sağ qonşusu/u;
const NEIGHBOR_L = /^(\d+)-[iıuü]n sol qonşusu/u;
const BETWEEN = /^(\d+) və (\d+)-\p{L}+ arasında (?:hansı|olan)/u;
const GAP = /^((?:\d+|_{2,})(?:\s*,\s*(?:\d+|_{2,})){2,})\s*[—–-]/u;
const NEXT_SEQ = /^(\d+(?:\s*,\s*\d+){2,})\s*,\s*(?:\.\.\.|…)\s*[—–-]/u;

export function sequenceHint(prompt: string): TrainItem[] | null {
  const p = prompt.trim();
  let m = p.match(AFTER) ?? p.match(NEIGHBOR_R);
  if (m) {
    const n = +m[1];
    return n > 0 ? [n - 1, n, null] : [n, null];
  }
  m = p.match(BEFORE) ?? p.match(NEIGHBOR_L);
  if (m) return [null, +m[1], +m[1] + 1];
  m = p.match(BETWEEN);
  if (m && +m[2] - +m[1] === 2) return [+m[1], null, +m[2]];
  m = p.match(GAP);
  if (m) {
    const items = m[1].split(",").map((x) => x.trim()).map((x) => (/^_+$/.test(x) ? null : +x));
    return items.filter((x) => x === null).length === 1 ? items : null;
  }
  m = p.match(NEXT_SEQ);
  if (m) {
    const nums = m[1].split(",").map((x) => +x.trim());
    if (nums.length >= 3 && nums.every(Number.isFinite)) {
      return [...nums.slice(-3), null];
    }
  }
  return null;
}

/** Tapşırığın sinfi — id prefiksindən ("ry1-", "az2-", "en1-"). Tanınmasa null (5+ sinif). */
export function taskGrade(id: string): number | null {
  const m = id.match(/^(?:ry|az|en)(\d)-/);
  return m ? +m[1] : null;
}

/** 1–2-ci sinif: klaviatura əvəzinə böyük düymələr, böyük şrift, avto-səs və vizual ipucu. */
export function isYoungTask(id: string): boolean {
  const g = taskGrade(id);
  return g !== null && g <= 2;
}

/** 1–4-cü sinif (bütün ibtidai siniflər): səsli oxuma və şəkilli tapşırıq rejimi. */
export function isPrimaryTask(id: string): boolean {
  const g = taskGrade(id);
  return g !== null && g <= 4;
}
