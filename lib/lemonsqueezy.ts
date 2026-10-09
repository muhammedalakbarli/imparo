// LemonSqueezy webhook-unun QƏRAR məntiqi — xalis funksiya (şəbəkə/DB yoxdur),
// ona görə testlə yoxlanılır (bax tests/lemonsqueezy.test.ts). Route yalnız imzanı
// yoxlayır, bu funksiyanın dediyini icra edir və nəticəni jurnala yazır.
//
// ƏVVƏLKİ MODELİN ÜÇ BOŞLUĞU (hamısı burada bağlanır):
//
//  1. İLK ÖDƏNİŞDƏ İKİQAT MÜDDƏT. Yeni abunədə LS HƏM `subscription_created`, HƏM
//     `subscription_payment_success` göndərir (rəsmi sənəd: "Initial order is placed:
//     order_created, subscription_created, subscription_payment_success"). Hər ikisi
//     müddət verirdi və açarları fərqli obyekt id-ləri idi (abunə vs faktura) —
//     idempotentlik onları tutmurdu: aylıq ödəniş 60 gün, illik 730 gün verirdi.
//
//  2. PLAN CLIENT-DƏN GƏLİRDİ. Müddət `custom_data.plan`-dan seçilirdi, o isə
//     checkout URL-inin bir parametridir. Aylıq məhsulu alıb URL-də `plan=yearly`
//     yazan 2.99 ₼-a 365 gün alırdı — üstəlik HƏR aylıq yenilənmədə yenə 365 gün.
//
//  3. YENİLƏNMƏ İŞLƏMİRDİ. `custom_data` yalnız Order/Subscription obyektlərinin
//     webhook-larında gəlir; `subscription_payment_success` isə faktura obyektidir.
//     user_id tapılmayanda route "no user_id" deyib çıxırdı.
//
// YENİ MODEL: müddət LS-in ÖZ abunə obyektindən oxunur. `subscription_created` və
// `subscription_updated` (LS onu hər yenilənmədə də göndərir: "Successful renewal
// payment: subscription_payment_success, subscription_updated") `renews_at` daşıyır —
// növbəti ödəniş tarixi. Hər hesab dövrü üçün müddət BİR DƏFƏ verilir: açar
// "<abunə id>:<renews_at>"-dir, eyni dövrə aid ikinci hadisə dublikat sayılır.
// Plan haqqında client-in dediyi heç nəyə təsir etmir.

/** Bir sponsorluq yerinin qiyməti (qəpik) — illik Plus qiyməti: 23.99 ₼. */
export const SEAT_PRICE_CENTS = 2399;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Abunə statusları ki, onlarda yeni hesab dövrü müddət verir. */
const PAID_STATUSES = new Set(["active", "on_trial"]);

export interface LsWebhookBody {
  meta?: {
    event_name?: string;
    test_mode?: boolean;
    custom_data?: { user_id?: string; plan?: string };
  };
  data?: {
    id?: string;
    attributes?: {
      total?: number;
      currency?: string;
      test_mode?: boolean;
      status?: string;
      renews_at?: string | null;
    };
  };
}

export type WebhookAction =
  | { kind: "ignore"; reason: string }
  | {
      kind: "plus";
      userId: string;
      days: number;
      /** İdempotentlik açarı: abunə + hesab dövrü. */
      key: string;
      event: string;
    }
  | {
      kind: "sponsor";
      userId: string;
      /** 0 ola bilər — məbləğ bir yerə çatmırsa ianə kimi yalnız jurnala yazılır. */
      seats: number;
      totalCents: number;
      currency: string;
      key: string;
      event: string;
    }
  | { kind: "revoke"; userId: string; key: string; event: string }
  | {
      // Yalnız ödəniş jurnalı (admin "Gəlir" səhifəsi üçün məbləğ) — heç nə vermir.
      kind: "record";
      userId: string | null;
      totalCents: number;
      currency: string;
      key: string;
      event: string;
    };

export function isTestMode(body: LsWebhookBody): boolean {
  return body.meta?.test_mode === true || body.data?.attributes?.test_mode === true;
}

export function decideWebhook(body: LsWebhookBody, now: Date = new Date()): WebhookAction {
  const event = body.meta?.event_name ?? "";
  const userId = body.meta?.custom_data?.user_id;
  const plan = body.meta?.custom_data?.plan;
  const objectId = body.data?.id ?? "";
  const attrs = body.data?.attributes ?? {};

  if (!objectId) return { kind: "ignore", reason: "no object id" };

  // Faktura ödənişi (ilk və yenilənmə). Müddəti `subscription_*` hadisələri verir —
  // bu hadisə yalnız məbləği jurnala yazır. user_id burada gəlməyə də bilər.
  if (event === "subscription_payment_success") {
    return {
      kind: "record",
      userId: userId ?? null,
      totalCents: Math.max(0, Math.round(Number(attrs.total ?? 0))),
      currency: attrs.currency ?? "AZN",
      key: `${event}:${objectId}`,
      event,
    };
  }

  if (!userId) return { kind: "ignore", reason: "no user_id" };

  // Birdəfəlik sponsorluq ödənişi. Yer sayı ÖDƏNİLƏN məbləğdən — client-in
  // göndərdiyi `seats`-ə etibar edilmir. Əvvəl `max(1, …)` idi: 1 ₼ ödəyən də
  // havuza 23.99 ₼-lıq yer əlavə edirdi.
  if (event === "order_created") {
    if (plan !== "sponsor") return { kind: "ignore", reason: "order handled via subscription" };
    const totalCents = Math.max(0, Math.round(Number(attrs.total ?? 0)));
    return {
      kind: "sponsor",
      userId,
      seats: Math.floor(totalCents / SEAT_PRICE_CENTS),
      totalCents,
      currency: attrs.currency ?? "AZN",
      key: `${event}:${objectId}`,
      event,
    };
  }

  if (event === "subscription_created" || event === "subscription_updated") {
    const status = attrs.status ?? "";
    if (!PAID_STATUSES.has(status)) return { kind: "ignore", reason: `status ${status || "?"}` };
    const renews = attrs.renews_at ? Date.parse(attrs.renews_at) : NaN;
    if (!Number.isFinite(renews)) return { kind: "ignore", reason: "no renews_at" };
    // Növbəti ödənişə qədər qalan günlər (+1 gün güzəşt: ödəniş bir neçə saat
    // gecikəndə Plus yarıda kəsilməsin). Tavan — illik plandan bir az artıq.
    const days = Math.min(Math.max(Math.ceil((renews - now.getTime()) / DAY_MS) + 1, 1), 370);
    return {
      kind: "plus",
      userId,
      days,
      key: `plus:${objectId}:${new Date(renews).toISOString()}`,
      event,
    };
  }

  if (event === "subscription_expired") {
    return { kind: "revoke", userId, key: `${event}:${objectId}`, event };
  }

  return { kind: "ignore", reason: `event ${event || "?"}` };
}
