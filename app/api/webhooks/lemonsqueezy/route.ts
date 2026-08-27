// LemonSqueezy ödəniş webhooku — imzanı yoxlayır və uğurlu ödənişdə Plus verir.
// Konfiqurasiya: LEMONSQUEEZY_WEBHOOK_SECRET (.env). Checkout-da custom.user_id + custom.plan
// göndərilir; webhook onu oxuyub user_stats.is_plus-ı service_role ilə qoyur.

import type { NextRequest } from "next/server";
import crypto from "crypto";
import { grantPlusServer, revokePlusServer } from "@/lib/plusServer";
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

  let body: {
    meta?: { event_name?: string; custom_data?: { user_id?: string; plan?: string } };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const event = body.meta?.event_name;
  const custom = body.meta?.custom_data ?? {};
  const userId = custom.user_id;
  const months = custom.plan === "yearly" ? 12 : 1;

  // user_id yoxdursa (məs. test event) — 200 qaytar ki, LS retry etməsin.
  if (!userId) return new Response("no user_id", { status: 200 });

  try {
    if (
      event === "subscription_created" ||
      event === "subscription_payment_success" ||
      event === "subscription_updated" ||
      event === "order_created"
    ) {
      await grantPlusServer(userId, months);
    } else if (event === "subscription_expired" || event === "subscription_cancelled") {
      // cancelled: dövr sonuna qədər aktiv qalır; expired: söndür.
      if (event === "subscription_expired") await revokePlusServer(userId);
    }
  } catch (err) {
    // Cloudflare Workers logs/tail-də iz qalsın — pullu abunə əməliyyatı sükutla itməsin.
    console.error("[lemonsqueezy webhook] processing error", { event, userId, err });
    return new Response("processing error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
