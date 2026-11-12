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
    "out-samples/**",
  ]),
  {
    // Portfolio pages must work as plain exported HTML, so they use <img>, not next/image.
    files: ["src/render-kit/**"],
    rules: { "@next/next/no-img-element": "off" },
  },
]);

export default eslintConfig;
