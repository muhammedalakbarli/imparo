import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { User } from "@supabase/supabase-js";
import { userGrade } from "@/lib/grade";
import { azShortDate } from "@/lib/azDate";
import {
  parseStudentNames, genPin, genRef, isWeakPin, isRef, isSyntheticEmail, syntheticEmail,
  normalizeClassCode, studentLoginUrl, SYNTHETIC_EMAIL_DOMAIN, randomPassword, isManagedAccount,
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

describe("sinif hesabının kilidləri (0067)", () => {
  const managedUser = {
    email: "s-abc234-xyz789@sinif.imparo.internal",
    app_metadata: { managed_class: "c1", managed_grade: 1 },
    user_metadata: { grade: 6 },
  };

  it("app_metadata bayrağı və ya sintetik e-poçt sinif hesabını tanıyır", () => {
    expect(isManagedAccount(managedUser)).toBe(true);
    expect(isManagedAccount({ email: "x@sinif.imparo.internal", app_metadata: {} })).toBe(true);
    expect(isManagedAccount({ email: "ana@gmail.com", app_metadata: { managed_class: "c1" } })).toBe(true);
    expect(isManagedAccount({ email: "ana@gmail.com", app_metadata: {} })).toBe(false);
    expect(isManagedAccount({ email: "ana@gmail.com" })).toBe(false);
    expect(isManagedAccount(null)).toBe(false);
  });

  it("uşaq user_metadata.grade-i dəyişsə də sinif müəllimin təyin etdiyi qalır", () => {
    // user_metadata-nı istifadəçi özü yaza bilir; app_metadata-nı yalnız server.
    expect(userGrade(managedUser as unknown as User)).toBe(1);
  });

  it("adi hesabda sinif user_metadata-dan gəlir, etibarsız app_metadata nəzərə alınmır", () => {
    expect(userGrade({ app_metadata: {}, user_metadata: { grade: 6 } } as unknown as User)).toBe(6);
    expect(userGrade({ app_metadata: { managed_grade: 99 }, user_metadata: { grade: 3 } } as unknown as User)).toBe(3);
    expect(userGrade({ app_metadata: { managed_grade: "1" }, user_metadata: {} } as unknown as User)).toBe(5);
    expect(userGrade(null)).toBe(5);
  });

  it("server qoruması: miqrasiya adı, silməni və sinfi bağlayır", () => {
    const sql = readFileSync(join(__dirname, "../supabase/migrations/0067_managed_student_guards.sql"), "utf8");
    // Ad: invoker trigger, müştəri rolunda köhnə ad saxlanılır.
    expect(sql).toMatch(/create trigger trg_protect_managed_name\s+before update on profiles/);
    expect(sql).toMatch(/new\.name := old\.name/);
    expect(sql).not.toMatch(/create or replace function protect_managed_name\(\)[^$]*security definer/);
    // Silmə: sinif hesabı delete_own_account ilə silinmir.
    expect(sql).toMatch(/managed_students where user_id = me\) then\s+raise exception 'managed_account'/);
    // Sinif: mövcud hesablara managed_grade yazılır.
    expect(sql).toMatch(/'managed_grade', c\.grade/);
    // Müəllimin ad düzəltməsi yalnız sinfin müəllimi üçün.
    expect(sql).toMatch(/rename_managed_student[\s\S]*not is_class_teacher\(cid\)/);
  });

  it("yeni sinif hesabı yaradılanda sinif app_metadata-ya yazılır", () => {
    const route = readFileSync(join(__dirname, "../app/api/mekteb/students/route.ts"), "utf8");
    expect(route).toMatch(/app_metadata:\s*\{\s*managed_class: classId, managed_grade: cls\.grade\s*\}/);
  });
});

describe("qısa AZ tarixi (ICU-dan asılı deyil)", () => {
  it("yalnız tarix yerli gün kimi, ay adı əllə", () => {
    expect(azShortDate("2026-11-25")).toBe("25 noy");
    expect(azShortDate("2026-01-01")).toBe("1 yan");
    expect(azShortDate(new Date(2026, 7, 16))).toBe("16 avq");
    expect(azShortDate("bərbad")).toBe("bərbad");
  });
});
