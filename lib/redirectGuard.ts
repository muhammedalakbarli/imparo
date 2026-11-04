// Yönləndirmə dövrəsi sığortası.
//
// 4 Noy 2026: iki səhifə eyni sualı ("onboarding keçilibmi?") iki fərqli mənbədən
// oxuyurdu və bir-birinə atırdı — brauzer saniyədə ~10 dəfə səhifə dəyişdi, istifadəçi
// bunu "kompüter donur" kimi gördü. Kök səbəb useAuthUser-də düzəldilib; bu isə
// gələcəkdə eyni sinif xətanın istifadəçini kilidləməməsi üçün son müdafiədir:
// qısa müddətdə həddən çox yönləndirmə olarsa, növbəti yönləndirmə edilmir və
// hadisə analitikaya yazılır (xəta görünən olsun, səssiz qalmasın).

export const REDIRECT_GUARD_KEY = "imparo.redirects";
export const REDIRECT_WINDOW_MS = 10_000;
export const REDIRECT_MAX = 6;

type KV = Pick<Storage, "getItem" | "setItem">;

function store(): KV | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Bu yönləndirməyə icazə varmı? İcazə verilirsə vaxt qeyd olunur.
 * Anbar yoxdursa (SSR, gizli rejim) həmişə icazə verilir — sığorta axını sındırmamalıdır.
 */
export function allowRedirect(kv: KV | null = store(), now = Date.now()): boolean {
  if (!kv) return true;
  let recent: number[] = [];
  try {
    const raw = JSON.parse(kv.getItem(REDIRECT_GUARD_KEY) ?? "[]");
    if (Array.isArray(raw)) recent = raw.filter((t): t is number => typeof t === "number" && now - t < REDIRECT_WINDOW_MS);
  } catch {
    recent = [];
  }
  if (recent.length >= REDIRECT_MAX) return false;
  recent.push(now);
  try {
    kv.setItem(REDIRECT_GUARD_KEY, JSON.stringify(recent));
  } catch {
    /* yox */
  }
  return true;
}
