// LemonSqueezy ödəniş webhooku — imzanı yoxlayır, Plus verir və ya sponsorluq yazır.
//
// Hansı hadisənin nə etdiyi `lib/lemonsqueezy.ts`-dəki xalis `decideWebhook`
// funksiyasındadır (testlə yoxlanılır) — orada üç köhnə boşluğun izahı da var:
// ilk ödənişdə ikiqat müddət, URL-dəki `plan`-a etibar, yenilənmənin işləməməsi.
//
// Bu fayldakı QAYDALAR:
//  1. İMZA. HMAC-SHA256, sabit-vaxtlı müqayisə.
//  2. TEST REJİMİ REAL PLUS VERMİR (LS_ALLOW_TEST_MODE=1 olmadıqca).
//  3. İDEMPOTENTLİK. Hər əməliyyat açarla bir dəfə emal olunur (`payment_events`).
//  4. YARIMÇIQ EMAL QEYDİ GERİ ALINIR. Açar yazılıb, sonra Plus/sponsorluq verilə
//     bilməyibsə açar silinir və 500 qaytarılır — LS təkrar göndərəndə yenidən
//     cəhd olunur. Əvvəl açar qalırdı və təkrar "dublikat" sayılıb atılırdı:
//     ödəniş alınır, Plus isə heç vaxt verilmirdi.
//
// Konfiqurasiya: LEMONSQUEEZY_WEBHOOK_SECRET (Cloudflare secret).

import type { NextRequest } from "next/server";
import crypto from "crypto";
import {
  grantPlusServer,
  revokePlusServer,
  claimPaymentEvent,
  releasePaymentEvent,
} from "@/lib/plusServer";
import { recordSponsorshipServer } from "@/lib/sponsorServer";
import { decideWebhook, isTestMode, type LsWebhookBody } from "@/lib/lemonsqueezy";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  let body: LsWebhookBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  // ★ TEST REJİMİ REAL PLUS VERMİR.
  // LemonSqueezy test rejimində checkout linkləri İCTİMAİDİR və test kartı ilə
  // "ödəniş" etmək olar. Bu yoxlama olmasa, hər kəs pulsuz Plus ala bilərdi.
  // Öz uçdan-uca sınağın üçün Worker-də `LS_ALLOW_TEST_MODE=1` təyin et.
  if (isTestMode(body) && env.LS_ALLOW_TEST_MODE !== "1") {
    console.warn("[lemonsqueezy webhook] test-mode hadisəsi buraxıldı", body.meta?.event_name);
    return new Response("test mode ignored", { status: 200 });
  }

  const action = decideWebhook(body);
  // Tanınmayan/lazımsız hadisə — 200 qaytar ki, LS retry etməsin.
  if (action.kind === "ignore") return new Response(`ignored: ${action.reason}`, { status: 200 });

  const amount = action.kind === "sponsor" || action.kind === "record" ? action.totalCents : 0;
  const currency = action.kind === "sponsor" || action.kind === "record" ? action.currency : "AZN";
  const detail =
    action.kind === "plus" ? `${action.days} gün` :
    action.kind === "sponsor" ? (action.seats > 0 ? `${action.seats} yer` : "ianə (yer üçün az)") :
    action.kind === "record" ? "faktura" : null;
  const kind =
    action.kind === "sponsor" ? "sponsor" :
    action.kind === "revoke" ? "revoke" :
    action.kind === "record" ? "payment" : "plus";

  let claimed = false;
  try {
    // Təkrar hadisə → heç nə etmə, amma 200 qaytar (LS növbəni bağlasın).
    claimed = await claimPaymentEvent(
      action.key, action.event, action.userId, kind, amount, currency, detail ?? undefined,
    );
    if (!claimed) return new Response("duplicate", { status: 200 });

    if (action.kind === "plus") {
      await grantPlusServer(action.userId, action.days);
    } else if (action.kind === "sponsor") {
      // Bir yerə çatmayan məbləğ ianədir: jurnalda qalır, havuza yer düşmür.
      if (action.seats > 0) {
        await recordSponsorshipServer(action.userId, action.seats, action.totalCents, action.currency);
      }
    } else if (action.kind === "revoke") {
      await revokePlusServer(action.userId);
    }
    // "record" — jurnal qeydinin özü kifayətdir.
  } catch (err) {
    // Cloudflare Workers logs/tail-də iz qalsın — pullu əməliyyat sükutla itməsin.
    console.error("[lemonsqueezy webhook] processing error", { key: action.key, err });
    if (claimed) {
      try {
        await releasePaymentEvent(action.key);
      } catch (releaseErr) {
        console.error("[lemonsqueezy webhook] claim release failed", { key: action.key, releaseErr });
      }
    }
    return new Response("processing error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
