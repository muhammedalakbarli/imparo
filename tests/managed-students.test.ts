import { describe, it, expect } from "vitest";
import {
  parseStudentNames, genPin, genRef, isWeakPin, isRef, isSyntheticEmail, syntheticEmail,
  normalizeClassCode, studentLoginUrl, SYNTHETIC_EMAIL_DOMAIN, randomPassword,
} from "@/lib/managedStudents";

describe("müəllimin yapışdırdığı ad siyahısı", () => {
  it("hər sətir bir şagird; nömrələmə, boşluq və təkrar təmizlənir", () => {
    const r = parseStudentNames("1. Aysel  Məmmədova\n2) Tural Həsənov\n\n   \naysel məmmədova\nNigar Əliyeva;Elvin Quliyev\n—\n7");
    expect(r.names).toEqual(["Aysel Məmmədova", "Tural Həsənov", "Nigar Əliyeva", "Elvin Quliyev"]);
    expect(r.skipped).toContain("aysel məmmədova");
  });
  it("Excel-dən (tab) və Windows (\\r\\n) sətirləri", () => {
    expect(parseStudentNames("Aysel M\r\nTural H\tNigar Ə").names).toEqual(["Aysel M", "Tural H", "Nigar Ə"]);
  });
  it("çox uzun ad 60 simvola kəsilir", () => {
    expect(parseStudentNames("A".repeat(100)).names[0]).toHaveLength(60);
  });
});

describe("PIN və şagird kodu", () => {
  it("PIN həmişə 4 rəqəm və zəif deyil", () => {
    for (let i = 0; i < 2000; i++) {
      const p = genPin();
      expect(p).toMatch(/^\d{4}$/);
      expect(isWeakPin(p)).toBe(false);
    }
  });
  it("zəif PIN-lər tanınır", () => {
    for (const p of ["0000", "1111", "1234", "4321", "6789"]) expect(isWeakPin(p)).toBe(true);
    expect(isWeakPin("4821")).toBe(false);
  });
  it("şagird kodunda oxunması çətin simvol yoxdur (0/O, 1/I/L)", () => {
    for (let i = 0; i < 500; i++) {
      const r = genRef();
      expect(isRef(r)).toBe(true);
      expect(r).not.toMatch(/[01OIL]/);
    }
  });
  it("parol uzun və təsadüfidir (heç kimə göstərilmir)", () => {
    expect(randomPassword()).toMatch(/^[0-9a-f]{48}$/);
    expect(randomPassword()).not.toBe(randomPassword());
  });
});

describe("sintetik e-poçt — məktub göndərilməməlidir", () => {
  it("yaradılan ünvan sintetik domendədir və unikal görünür", () => {
    const e = syntheticEmail("ABC234");
    expect(e.endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`)).toBe(true);
    expect(e).toMatch(/^s-abc234-[a-z2-9]{6}@/);
    expect(isSyntheticEmail(e)).toBe(true);
  });
  it("real ünvanlar bloklanmır, istənilən .internal bloklanır", () => {
    expect(isSyntheticEmail("valideyn@gmail.com")).toBe(false);
    expect(isSyntheticEmail("  S-X@SINIF.IMPARO.INTERNAL ")).toBe(true);
    expect(isSyntheticEmail("a@b.internal")).toBe(true);
    expect(isSyntheticEmail(null)).toBe(false);
  });
});

describe("giriş linki və kod", () => {
  it("QR linkində PIN yoxdur", () => {
    const u = studentLoginUrl("https://imparo.app", "AB12CD", "XYZ234");
    expect(u).toBe("https://imparo.app/sinif?k=AB12CD&s=XYZ234");
    expect(u).not.toMatch(/pin/i);
  });
  it("sinif kodu normallaşdırılır", () => {
    expect(normalizeClassCode(" ab-12 cd ")).toBe("AB12CD");
  });
});
