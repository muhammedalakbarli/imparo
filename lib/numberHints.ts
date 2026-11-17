// Kiçik siniflər üçün vizual ipucu: sualdan "ədəd qatarı" çıxarır.
//   "6-dan sonra hansı ədəd gəlir?"        → [5, 6, ?]
//   "8-dən əvvəl hansı ədəd gəlir?"         → [?, 8, 9]
//   "4 və 6-nın arasında hansı ədəd var?"   → [4, ?, 6]
//   "6, 7, __, 9 — boş xanaya ..."          → [6, 7, ?, 9]
// `null` = "?" xanası. Cavab QƏTİYYƏN göstərilmir — yalnız sıranın şəkli.
// Tanınmayan sualda null qaytarır (ipucu göstərilmir).

export type TrainItem = number | null;

const AFTER = /^(\d+)-(?:dan|dən) sonra (?:hansı ədəd gəlir|gələn ədəd)/u;
const BEFORE = /^(\d+)-(?:dan|dən) əvvəl (?:hansı ədəd gəlir|gələn ədəd)/u;
const BETWEEN = /^(\d+) və (\d+)-\p{L}+ arasında (?:hansı|olan)/u;
const GAP = /^((?:\d+|_{2,})(?:\s*,\s*(?:\d+|_{2,})){2,})\s*[—–-]/u;

export function sequenceHint(prompt: string): TrainItem[] | null {
  const p = prompt.trim();
  let m = p.match(AFTER);
  if (m) {
    const n = +m[1];
    return n > 0 ? [n - 1, n, null] : [n, null];
  }
  m = p.match(BEFORE);
  if (m) return [null, +m[1], +m[1] + 1];
  m = p.match(BETWEEN);
  if (m && +m[2] - +m[1] === 2) return [+m[1], null, +m[2]];
  m = p.match(GAP);
  if (m) {
    const items = m[1].split(",").map((x) => x.trim()).map((x) => (/^_+$/.test(x) ? null : +x));
    return items.filter((x) => x === null).length === 1 ? items : null;
  }
  return null;
}

/** Tapşırığın sinfi — id prefiksindən ("ry1-", "az2-", "en1-"). Tanınmasa null (5+ sinif). */
export function taskGrade(id: string): number | null {
  const m = id.match(/^(?:ry|az|en)(\d)-/);
  return m ? +m[1] : null;
}

/** 1–2-ci sinif: klaviatura əvəzinə böyük düymələr, böyük şrift, vizual ipucu. */
export function isYoungTask(id: string): boolean {
  const g = taskGrade(id);
  return g !== null && g <= 2;
}
