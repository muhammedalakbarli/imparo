// Imparo REST API-nin OpenAPI 3.0 spesifikasiyası.
// /api/openapi bunu JSON kimi verir; /api-docs Swagger UI ilə göstərir.
// Yeni endpoint əlavə edəndə burada da sənədləşdir.

// ── kiçik köməkçilər (spec-i qısaltmaq üçün) ──
function jsonExample(example: unknown) {
  return { "application/json": { example } };
}
const errorContent = {
  "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "..." } },
};
function pathParam(name: string, description: string) {
  return { name, in: "path", required: true, description, schema: { type: "string" } };
}

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Imparo API",
    version: "1.0.0",
    description:
      "1–8-ci siniflər üçün özünütədris platformasının REST API-si. " +
      "Autentifikasiya Supabase sessiyası ilə (giriş/qeydiyyat cookie qoyur).",
  },
  servers: [{ url: "/", description: "Cari mühit" }],
  tags: [
    { name: "Auth", description: "Qeydiyyat, giriş, sessiya" },
    { name: "Content", description: "Fənlər, bölmələr, dərslər" },
    { name: "Progress", description: "İstifadəçi irəliləyişi və liqa" },
  ],
  paths: {
    "/api/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Qeydiyyat",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupInput" },
              example: { name: "Aysel", email: "aysel@test.az", password: "parol123" },
            },
          },
        },
        responses: {
          "201": { description: "Yaradıldı", content: jsonExample({ user: { id: "uuid", email: "aysel@test.az", name: "Aysel" }, needsEmailConfirm: false }) },
          "400": { description: "Yanlış giriş", content: errorContent },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Giriş (email + parol)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginInput" },
              example: { email: "aysel@test.az", password: "parol123" },
            },
          },
        },
        responses: {
          "200": { description: "Uğurlu", content: jsonExample({ user: { id: "uuid", email: "aysel@test.az", name: "Aysel" } }) },
          "401": { description: "Yanlış email/parol", content: errorContent },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Çıxış",
        responses: { "200": { description: "Uğurlu", content: jsonExample({ success: true }) } },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Cari istifadəçi",
        responses: {
          "200": { description: "Uğurlu", content: jsonExample({ id: "uuid", email: "aysel@test.az", name: "Aysel" }) },
          "401": { description: "Giriş edilməyib", content: errorContent },
        },
      },
    },
    "/api/subjects": {
      get: {
        tags: ["Content"],
        summary: "Bütün fənlər (xülasə)",
        responses: {
          "200": { description: "Uğurlu", content: jsonExample({ subjects: [{ id: "riyaziyyat", name: "Riyaziyyat", grade: 5, icon: "🔢", color: "#4F46E5", unitCount: 6, lessonCount: 24 }] }) },
        },
      },
    },
    "/api/subjects/{id}": {
      get: {
        tags: ["Content"],
        summary: "Bir fənn (bölmələr + dərslər)",
        parameters: [pathParam("id", "Fənn id-si, məs. riyaziyyat")],
        responses: {
          "200": { description: "Uğurlu", content: jsonExample({ id: "riyaziyyat", name: "Riyaziyyat", grade: 5, units: [{ id: "u1", title: "Natural ədədlər", lessons: [{ id: "l1", title: "Toplama", taskCount: 15, bonusCount: 1 }] }] }) },
          "404": { description: "Tapılmadı", content: errorContent },
        },
      },
    },
    "/api/lessons/{id}": {
      get: {
        tags: ["Content"],
        summary: "Bir dərs (qaydalar + tapşırıqlar)",
        parameters: [pathParam("id", "Dərs id-si")],
        responses: {
          "200": { description: "Uğurlu", content: jsonExample({ id: "l1", title: "Toplama", intro: "...", sections: [], tasks: [], bonusTasks: [] }) },
          "404": { description: "Tapılmadı", content: errorContent },
        },
      },
    },
    "/api/progress": {
      get: {
        tags: ["Progress"],
        summary: "Cari irəliləyiş (XP, streak, tamamlanmış dərslər)",
        responses: {
          "200": { description: "Uğurlu", content: jsonExample({ totalXp: 340, streakDays: 3, lastActiveDate: "2026-07-23", completedLessons: ["l1", "l2"] }) },
          "401": { description: "Giriş edilməyib", content: errorContent },
        },
      },
      post: {
        tags: ["Progress"],
        summary: "Dərs tamamla (XP + streak yenilə)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProgressInput" },
              example: { lessonId: "l1", xp: 40 },
            },
          },
        },
        responses: {
          "200": { description: "Uğurlu", content: jsonExample({ lessonId: "l1", earnedXp: 40, totalXp: 380, streakDays: 4 }) },
          "401": { description: "Giriş edilməyib", content: errorContent },
        },
      },
    },
    "/api/leaderboard": {
      get: {
        tags: ["Progress"],
        summary: "Ümumi liqa cədvəli",
        parameters: [
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50, maximum: 100 } },
        ],
        responses: {
          "200": { description: "Uğurlu", content: jsonExample({ entries: [{ rank: 1, name: "Aysel", xp: 1240 }] }) },
        },
      },
    },
  },
  components: {
    schemas: {
      SignupInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      ProgressInput: {
        type: "object",
        required: ["lessonId"],
        properties: {
          lessonId: { type: "string" },
          xp: { type: "integer", minimum: 0 },
        },
      },
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
} as const;
