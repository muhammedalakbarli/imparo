import { describe, it, expect } from "vitest";
import { allowRedirect, REDIRECT_MAX, REDIRECT_WINDOW_MS, REDIRECT_GUARD_KEY } from "@/lib/redirectGuard";

function memory() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe("yönləndirmə dövrəsi sığortası", () => {
  it("adi naviqasiyaya mane olmur", () => {
    const kv = memory();
    for (let i = 0; i < REDIRECT_MAX; i++) expect(allowRedirect(kv, 1000 + i * 100)).toBe(true);
  });

  it("qısa müddətdə həddən çox yönləndirmədə dövrəni qırır (4 Noy hadisəsi: ~10/san)", () => {
    const kv = memory();
    let allowed = 0;
    for (let i = 0; i < 40; i++) if (allowRedirect(kv, 1000 + i * 100)) allowed++;
    expect(allowed).toBe(REDIRECT_MAX);
  });

  it("pəncərə keçəndən sonra yenidən icazə verir", () => {
    const kv = memory();
    for (let i = 0; i < REDIRECT_MAX; i++) allowRedirect(kv, 1000);
    expect(allowRedirect(kv, 1000)).toBe(false);
    expect(allowRedirect(kv, 1000 + REDIRECT_WINDOW_MS + 1)).toBe(true);
  });

  it("korlanmış anbar və anbarsız mühit axını sındırmır", () => {
    const kv = memory();
    kv.setItem(REDIRECT_GUARD_KEY, "{bad");
    expect(allowRedirect(kv, 0)).toBe(true);
    expect(allowRedirect(null)).toBe(true);
  });
});
