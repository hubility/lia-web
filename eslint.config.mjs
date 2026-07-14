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
    // Copias del repo en worktrees aislados: no son fuente del proyecto.
    ".worktrees/**",
    // Utillaje y bundles de terceros del harness, no código de la app.
    ".claude/**",
  ]),
  {
    rules: {
      // El prefijo _ es la convención para "declarado a propósito, no usado" (p. ej. un
      // parámetro que la firma exige pero el cuerpo aún no consume).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
