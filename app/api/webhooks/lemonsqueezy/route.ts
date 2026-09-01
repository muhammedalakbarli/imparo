// LemonSqueezy ödəniş webhooku — imzanı yoxlayır, Plus verir və ya sponsorluq yazır.
//
// ÜÇ QAYDA (hər biri real problemdən doğub — bax 0058):
//
//  1. İDEMPOTENTLİK. LS uğursuz cavabdan sonra webhook-u TƏKRAR göndərir, üstəlik
//     yeni abunədə həm `subscription_created`, həm `order_created` gəlir. Ona görə
//     hər hadisə "<ad>:<obyekt id>" açarı ilə bir dəfə emal olunur.
//
//  2. HADİSƏ XƏRİTƏSİ DAR. Abunə üçün YALNIZ `subscription_created` və
//     `subscription_payment_success` (yenilənmə) müddət verir. `subscription_updated`
//     (plan dəyişikliyi, pauza) müddət VERMİR — əvvəl verirdi və bu, pulsuz uzatma
//     yolu idi. Birdəfəlik ödəniş (sponsorluq) yalnız `order_created` ilə gəlir.
//
//  3. SPONSORLUQ YERİ ÖDƏNİLƏN MƏBLƏĞDƏN HESABLANIR. Client-in göndərdiyi `seats`
//     dəyərinə etibar edilmir (URL-i dəyişib 100 yer yazmaq olardı) — yer sayı
//     LS-in bildirdiyi `total`-dan çıxarılır.
//
// Konfiqurasiya: LEMONSQUEEZY_WEBHOOK_SECRET (Cloudflare secret).
// Checkout-dan gələnlər: custom.user_id, custom.plan ("monthly" | "yearly" | "sponsor").

import type { NextRequest } from "next/server";
import crypto from "crypto";
import { grantPlusServer, revokePlusServer, claimPaymentEvent } from "@/lib/plusServer";
import { recordSponsorshipServer } from "@/lib/sponsorServer";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bir sponsorluq yerinin qiyməti (qəpik) — illik Plus qiyməti ilə eynidir. */
const SEAT_PRICE_CENTS = 2490;

/** Plan → veriləcək gün sayı. */
const PLAN_DAYS: Record<string, number> = { monthly: 30, yearly: 365 };

export async function POST(req: NextRequest) {
  // Cloudflare Worker SECRET-idir — process.env-dən oxunmur (bax cloudflare-env.d.ts).
  const { env } = await getCloudflareContext({ async: true });
  const secret = env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return new Response("webhook not configured", { status: 500 });

  const raw = await req.text();
  const sig = req.headers.get("x-signature") ?? "";
  const digest = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  // Sabit-vaxtlı müqayisə (uzunluqlar fərqlidirsə timingSafeEqual atır → əvvəl yoxla).
  const valid =
    sig.length === digest.length &&
    crypto.timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(digest, "utf8"));
  if (!valid) return new Response("invalid signature", { status: 401 });

  let body: {
    meta?: { event_name?: string; test_mode?: boolean; custom_data?: { user_id?: string; plan?: string } };
    data?: { id?: string; attributes?: { total?: number; currency?: string; test_mode?: boolean } };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const event = body.meta?.event_name ?? "";
  const custom = body.meta?.custom_data ?? {};
  const userId = custom.user_id;
  const plan = custom.plan ?? "monthly";
  const objectId = body.data?.id ?? "";
  const totalCents = Math.max(0, Math.round(Number(body.data?.attributes?.total ?? 0)));
  const currency = body.data?.attributes?.currency ?? "AZN";

  // user_id yoxdursa (məs. LS test event) — 200 qaytar ki, LS retry etməsin.
  if (!userId) return new Response("no user_id", { status: 200 });

  // ★ TEST REJİMİ REAL PLUS VERMİR.
  // LemonSqueezy test rejimində checkout linkləri İCTİMAİDİR və test kartı ilə
  // "ödəniş" etmək olar. Bu yoxlama olmasa, hər kəs pulsuz Plus ala bilərdi.
  // Öz uçdan-uca sınağın üçün Worker-də `LS_ALLOW_TEST_MODE=1` təyin et.
  const isTest = body.meta?.test_mode === true || body.data?.attributes?.test_mode === true;
  if (isTest && env.LS_ALLOW_TEST_MODE !== "1") {
    console.warn("[lemonsqueezy webhook] test-mode hadisəsi buraxıldı", { event, userId });
    return new Response("test mode ignored", { status: 200 });
  }

  // Hansı hadisələr nə edir (bunun xaricindəki hər şey sükutla buraxılır).
  const isSponsorOrder = plan === "sponsor" && event === "order_created";
  const isSubGrant = plan !== "sponsor" &&
    (event === "subscription_created" || event === "subscription_payment_success");
  const isSubRevoke = event === "subscription_expired";

  if (!isSponsorOrder && !isSubGrant && !isSubRevoke) {
    return new Response("ignored", { status: 200 });
  }

  const eventKey = `${event}:${objectId || userId}`;
  const kind = isSponsorOrder ? "sponsor" : isSubRevoke ? "revoke" : "plus";

  try {
    // Təkrar hadisə → heç nə etmə, amma 200 qaytar (LS növbəni bağlasın).
    const fresh = await claimPaymentEvent(
      eventKey, event, userId, kind, totalCents, currency,
      isSponsorOrder ? `${Math.max(1, Math.floor(totalCents / SEAT_PRICE_CENTS))} yer` : plan,
    );
    if (!fresh) return new Response("duplicate", { status: 200 });

    if (isSponsorOrder) {
      // Yer sayı ÖDƏNİLƏN məbləğdən: client-in yazdığına etibar edilmir.
      const seats = Math.max(1, Math.floor(totalCents / SEAT_PRICE_CENTS));
      await recordSponsorshipServer(userId, seats, totalCents, currency);
    } else if (isSubGrant) {
      await grantPlusServer(userId, PLAN_DAYS[plan] ?? 30);
    } else {
      await revokePlusServer(userId);
    }
  } catch (err) {
    // Cloudflare Workers logs/tail-də iz qalsın — pullu əməliyyat sükutla itməsin.
    console.error("[lemonsqueezy webhook] processing error", { event, userId, err });
    return new Response("processing error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
