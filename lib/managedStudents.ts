// Müəllimin yaratdığı e-poçtsuz şagird hesabları — saf köməkçilər (client + server, testlənir).
// Bax supabase/migrations/0065_managed_students.sql.

/** Sintetik e-poçt domeni. `.internal` rezerv zonadır — heç vaxt real poçt qutusu olmur. */
export const SYNTHETIC_EMAIL_DOMAIN = "sinif.imparo.internal";

/** Bu ünvana məktub GÖNDƏRİLMƏMƏLİDİR (Resend bounce reytinqi, Supabase auth məktubları). */
export function isSyntheticEmail(email: string | null | undefined): boolean {
  const e = (email ?? "").trim().toLowerCase();
  return e.endsWith(".internal") || e.endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`);
}

/**
 * Müəllimin yaratdığı sinif hesabıdır? `app_metadata`-nı yalnız server yazır
 * (app/api/mekteb/students, 0067) — istifadəçi özü dəyişə bilməz, ona görə etibarlı
 * bayraqdır. Sintetik e-poçt ehtiyat yoxlamadır.
 * Belə hesabda sinif, ad və hesabı silmək müəllimin əlindədir (Ayarlar/Profil kilidli).
 */
export function isManagedAccount(
  user: { email?: string | null; app_metadata?: Record<string, unknown> | null } | null | undefined,
): boolean {
  if (!user) return false;
  return Boolean(user.app_metadata?.managed_class) || isSyntheticEmail(user.email);
}

/** Bir sorğuda yaradılan şagird sayı — Cloudflare pulsuz planında 50 alt-sorğu limiti var. */
export const STUDENT_CHUNK = 15;
/** Bir sinifə bir dəfəyə yapışdırıla bilən maksimum ad. */
export const MAX_NAMES_PER_PASTE = 60;

// Şagird kodu: oxunması çətin simvollar yoxdur (0/O, 1/I/L) — uşaq kartdan oxuyur.
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomInt(maxExclusive: number): number {
  // Modul yanlılığı olmasın deyə rədd etmə üsulu.
  const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % maxExclusive;
  }
}

export function genRef(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return s;
}

const WEAK_PINS = new Set([
  "0123", "1234", "2345", "3456", "4567", "5678", "6789",
  "3210", "4321", "5432", "6543", "7654", "8765", "9876",
]);

export function isWeakPin(pin: string): boolean {
  return /^(\d)\1{3}$/.test(pin) || WEAK_PINS.has(pin);
}

/** 4 rəqəmli PIN — kriptoqrafik təsadüfi, zəif kombinasiyalar (1111, 1234) verilmir. */
export function genPin(): string {
  for (;;) {
    const p = String(randomInt(10000)).padStart(4, "0");
    if (!isWeakPin(p)) return p;
  }
}

export function syntheticEmail(ref: string): string {
  // ref + əlavə təsadüfi hissə: ref yenidən yaradılsa belə ünvan toqquşmasın.
  const salt = Array.from({ length: 6 }, () => REF_ALPHABET[randomInt(REF_ALPHABET.length)]).join("");
  return `s-${ref}-${salt}`.toLowerCase() + `@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/** Təsadüfi parol — heç kimə göstərilmir, giriş PIN + birdəfəlik token ilədir. */
export function randomPassword(): string {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * Müəllimin yapışdırdığı mətn → təmiz ad siyahısı.
 * Hər sətir bir şagird; nömrələmə ("1.", "2)"), artıq boşluqlar, vergül/nöqtəli
 * vergüllə ayrılmış sətirlər və təkrarlar təmizlənir.
 */
export function parseStudentNames(text: string): { names: string[]; skipped: string[] } {
  const names: string[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();
  const lines = text
    .split(/\r?\n|;|\t/)
    .map((l) => l.replace(/^\s*\d+\s*[.)\-:]\s*/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  for (const raw of lines) {
    const name = raw.slice(0, 60);
    if (name.length < 2 || !/\p{L}/u.test(name)) {
      skipped.push(raw);
      continue;
    }
    const key = name.toLocaleLowerCase("az");
    if (seen.has(key)) {
      skipped.push(raw);
      continue;
    }
    seen.add(key);
    names.push(name);
  }
  return { names, skipped };
}

/** Sinif kodu formatı (classes.code — böyük hərf/rəqəm). */
export function normalizeClassCode(raw: string): string {
  return raw.replace(/[^0-9a-z]/gi, "").toUpperCase().slice(0, 8);
}

export function isRef(s: string | null | undefined): s is string {
  return typeof s === "string" && /^[A-Z2-9]{6}$/.test(s);
}

/** Kartdakı QR: PIN QƏSDƏN YOXDUR (URL tarixçəyə/analitikaya düşür) — uşaq yalnız PIN yazır. */
export function studentLoginUrl(origin: string, classCode: string, ref: string): string {
  return `${origin}/sinif?k=${encodeURIComponent(classCode)}&s=${encodeURIComponent(ref)}`;
}
