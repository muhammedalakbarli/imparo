import { describe, it, expect } from "vitest";
import { decideWebhook, isTestMode, SEAT_PRICE_CENTS, type LsWebhookBody } from "@/lib/lemonsqueezy";

const NOW = new Date("2026-10-09T12:00:00Z");
const UID = "11111111-2222-3333-4444-555555555555";

function sub(event: string, attrs: Record<string, unknown>, plan = "monthly", id = "sub_1"): LsWebhookBody {
  return {
    meta: { event_name: event, custom_data: { user_id: UID, plan } },
    data: { id, attributes: attrs },
  };
}

describe("decideWebhook — abunə", () => {
  it("aylıq abunə: müddət renews_at-dan hesablanır", () => {
    const a = decideWebhook(sub("subscription_created", { status: "active", renews_at: "2026-11-09T12:00:00Z" }), NOW);
    expect(a).toMatchObject({ kind: "plus", userId: UID, days: 32 });
  });

  it("URL-dəki plan=yearly aylıq ödənişə 365 gün VERMİR", () => {
    const a = decideWebhook(
      sub("subscription_created", { status: "active", renews_at: "2026-11-09T12:00:00Z" }, "yearly"),
      NOW,
    );
    expect(a.kind).toBe("plus");
    if (a.kind === "plus") expect(a.days).toBeLessThan(40);
  });

  it("ilk sifarişin created + updated cütü EYNİ açar verir (ikiqat müddət yoxdur)", () => {
    const attrs = { status: "active", renews_at: "2027-10-09T12:00:00Z" };
    const a = decideWebhook(sub("subscription_created", attrs), NOW);
    const b = decideWebhook(sub("subscription_updated", attrs), NOW);
    expect(a.kind).toBe("plus");
    expect(b.kind).toBe("plus");
    if (a.kind === "plus" && b.kind === "plus") expect(a.key).toBe(b.key);
  });

  it("yenilənmə: yeni renews_at → yeni açar → yeni müddət", () => {
    const first = decideWebhook(sub("subscription_updated", { status: "active", renews_at: "2026-11-09T12:00:00Z" }), NOW);
    const renewal = decideWebhook(
      sub("subscription_updated", { status: "active", renews_at: "2026-12-09T12:00:00Z" }),
      new Date("2026-11-09T12:05:00Z"),
    );
    expect(first.kind).toBe("plus");
    expect(renewal.kind).toBe("plus");
    if (first.kind === "plus" && renewal.kind === "plus") {
      expect(renewal.key).not.toBe(first.key);
      expect(renewal.days).toBeGreaterThanOrEqual(30);
    }
  });

  it("ödənişi uğursuz (past_due) və ləğv edilmiş abunə müddət vermir", () => {
    for (const status of ["past_due", "unpaid", "cancelled", "paused", "expired"]) {
      const a = decideWebhook(sub("subscription_updated", { status, renews_at: "2026-11-09T12:00:00Z" }), NOW);
      expect(a.kind).toBe("ignore");
    }
  });

  it("müddətin tavanı var (370 gün)", () => {
    const a = decideWebhook(sub("subscription_created", { status: "active", renews_at: "2030-01-01T00:00:00Z" }), NOW);
    if (a.kind === "plus") expect(a.days).toBe(370);
  });

  it("faktura ödənişi yalnız jurnala yazılır (müddət vermir), user_id olmasa da", () => {
    const body: LsWebhookBody = {
      meta: { event_name: "subscription_payment_success" },
      data: { id: "inv_9", attributes: { total: 299, currency: "AZN" } },
    };
    expect(decideWebhook(body, NOW)).toMatchObject({ kind: "record", userId: null, totalCents: 299 });
  });

  it("subscription_expired → revoke", () => {
    expect(decideWebhook(sub("subscription_expired", { status: "expired" }), NOW).kind).toBe("revoke");
  });
});

describe("decideWebhook — sponsorluq", () => {
  const order = (total: number, plan = "sponsor"): LsWebhookBody => ({
    meta: { event_name: "order_created", custom_data: { user_id: UID, plan } },
    data: { id: "ord_1", attributes: { total, currency: "AZN" } },
  });

  it("yer sayı ödənilən məbləğdən hesablanır", () => {
    expect(decideWebhook(order(SEAT_PRICE_CENTS * 3), NOW)).toMatchObject({ kind: "sponsor", seats: 3 });
  });

  it("bir yerə çatmayan məbləğ yer VERMİR (əvvəl max(1,…) idi)", () => {
    expect(decideWebhook(order(100), NOW)).toMatchObject({ kind: "sponsor", seats: 0, totalCents: 100 });
  });

  it("abunə sifarişinin order_created-i nəzərə alınmır (müddəti subscription_* verir)", () => {
    expect(decideWebhook(order(299, "monthly"), NOW).kind).toBe("ignore");
  });
});

describe("decideWebhook — kənar hallar", () => {
  it("user_id yoxdursa heç nə edilmir", () => {
    const body: LsWebhookBody = { meta: { event_name: "subscription_created" }, data: { id: "s", attributes: {} } };
    expect(decideWebhook(body, NOW).kind).toBe("ignore");
  });

  it("test rejimi tanınır", () => {
    expect(isTestMode({ meta: { test_mode: true } })).toBe(true);
    expect(isTestMode({ data: { attributes: { test_mode: true } } })).toBe(true);
    expect(isTestMode({})).toBe(false);
  });
});
