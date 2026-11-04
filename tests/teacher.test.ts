import { describe, it, expect } from "vitest";
import {
  TEACHER_INTENT_KEY,
  TEACHER_INTENT_TTL_MS,
  setTeacherIntent,
  getTeacherIntent,
  clearTeacherIntent,
  teacherFlowPath,
  isInviteToken,
  postLoginPath,
  validateTeacherRequest,
} from "@/lib/teacher";
import { renderTeacherRequestEmail, renderTeacherWelcomeEmail } from "@/lib/teacherMail";

function memory() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    raw: m,
  };
}

const TOKEN = "0123456789abcdef0123456789abcdef";

describe("dəvət tokeni", () => {
  it("yalnız 32 hex simvol qəbul olunur (DB-dəki yoxlama ilə eyni)", () => {
    expect(isInviteToken(TOKEN)).toBe(true);
    expect(isInviteToken(TOKEN.toUpperCase())).toBe(false);
    expect(isInviteToken(TOKEN.slice(1))).toBe(false);
    expect(isInviteToken("../../admin")).toBe(false);
    expect(isInviteToken(null)).toBe(false);
  });
});

describe("müəllim niyyəti", () => {
  it("yazılır, oxunur, silinir", () => {
    const kv = memory();
    setTeacherIntent(TOKEN, kv, 1000);
    expect(getTeacherIntent(kv, 2000)).toEqual({ at: 1000, invite: TOKEN });
    clearTeacherIntent(kv);
    expect(getTeacherIntent(kv, 2000)).toBeNull();
  });

  it("dəvətsiz niyyət də saxlanılır (adi müraciət axını)", () => {
    const kv = memory();
    setTeacherIntent(null, kv, 1000);
    expect(getTeacherIntent(kv, 1000)).toEqual({ at: 1000 });
  });

  it("müddəti keçən niyyət unudulur — hesab əbədi müəllim axınına kilidlənmir", () => {
    const kv = memory();
    setTeacherIntent(TOKEN, kv, 0);
    expect(getTeacherIntent(kv, TEACHER_INTENT_TTL_MS + 1)).toBeNull();
    expect(kv.raw.has(TEACHER_INTENT_KEY)).toBe(false);
  });

  it("korlanmış və ya saxta dəyər axını sındırmır", () => {
    const kv = memory();
    kv.setItem(TEACHER_INTENT_KEY, "{not json");
    expect(getTeacherIntent(kv, 0)).toBeNull();
    kv.setItem(TEACHER_INTENT_KEY, JSON.stringify({ at: 5, invite: "evil?x=1" }));
    expect(getTeacherIntent(kv, 10)).toEqual({ at: 5 }); // yanlış token atılır
  });

  it("anbar olmayanda (SSR, gizli rejim) heç nə atmır", () => {
    expect(() => setTeacherIntent(TOKEN, null)).not.toThrow();
    expect(getTeacherIntent(null)).toBeNull();
  });

  it("axın ünvanı dəvəti daşıyır", () => {
    expect(teacherFlowPath({ at: 0, invite: TOKEN })).toBe(`/muellim-ol?devet=${TOKEN}`);
    expect(teacherFlowPath({ at: 0 })).toBe("/muellim-ol");
    expect(teacherFlowPath(null)).toBe("/muellim-ol");
  });
});

describe("girişdən sonra hara", () => {
  it("yarımçıq müəllim axını hər şeydən öndədir", () => {
    expect(postLoginPath({ role: "teacher" }, { at: 0, invite: TOKEN })).toBe(`/muellim-ol?devet=${TOKEN}`);
  });
  it("müəllim hesabı müəllim panelinə, qalanlar şagird panelinə", () => {
    expect(postLoginPath({ role: "teacher" }, null)).toBe("/mekteb/muellim");
    expect(postLoginPath({ grade: 5 }, null)).toBe("/dashboard");
    expect(postLoginPath(undefined, null)).toBe("/dashboard");
  });
});

describe("müraciət validasiyası", () => {
  it("məktəb və fənn tələb olunur, qeyd yox", () => {
    expect(validateTeacherRequest({ school: "", subject: "Riyaziyyat" })).not.toBeNull();
    expect(validateTeacherRequest({ school: "132 saylı məktəb", subject: "" })).not.toBeNull();
    expect(validateTeacherRequest({ school: "132 saylı məktəb", subject: "Riyaziyyat" })).toBeNull();
  });
});

describe("müəllim məktubları", () => {
  it("admin məktubu istifadəçi mətnini HTML kimi icra etmir", () => {
    const m = renderTeacherRequestEmail({
      name: '<img src=x onerror="alert(1)">',
      email: "a@b.az",
      school: "<b>Məktəb</b>",
      subject: "Riyaziyyat",
      note: null,
      provider: "google",
    });
    expect(m.html).not.toContain("<img src=x");
    expect(m.html).not.toContain("<b>Məktəb</b>");
    expect(m.html).toContain("&lt;b&gt;Məktəb&lt;/b&gt;");
    expect(m.html).toContain("https://imparo.app/admin/muellimler");
  });

  it("admin ünvanın sübut olunub-olunmadığını görür", () => {
    const base = { name: "Nilay", email: "n@gmail.com", school: null, subject: null, note: null };
    expect(renderTeacherRequestEmail({ ...base, provider: "google" }).text).toContain("təsdiqlənib");
    expect(renderTeacherRequestEmail({ ...base, provider: "email" }).text).toContain("SÜBUT OLUNMAYIB");
  });

  it("təsdiq məktubu ilk sinif formasına aparır və 'siz' formasındadır", () => {
    const m = renderTeacherWelcomeEmail("Nilay Hüseynli");
    expect(m.html).toContain("/mekteb/muellim?yeni=1");
    expect(m.text).toContain("Hörmətli Nilay Hüseynli");
    expect(m.text).toContain("bilərsiniz");
    expect(renderTeacherWelcomeEmail("  ").text.startsWith("Salam,")).toBe(true);
  });
});
