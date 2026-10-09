import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

// .mts: ESM kimi yüklənir (əvvəlki .ts CommonJS kimi yüklənirdi və hər test
// işləməsində Vite "unsupported by configLoader" xəbərdarlığı verirdi).
const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": root },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
