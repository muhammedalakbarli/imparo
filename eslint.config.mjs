import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Cloudflare / OpenNext build artefactları (bundle JS-i lint etmək OOM verir)
    ".open-next/**",
    ".wrangler/**",
    // Mobile ayrıca Expo layihəsidir, öz `expo lint`-i ilə lint olunur
    "mobile/**",
  ]),
  {
    rules: {
      // "_" ilə başlayan parametr/dəyişən qəsdən istifadə olunmur (imza uyğunluğu üçün saxlanılır)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
