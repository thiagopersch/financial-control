import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierRecommended from "eslint-plugin-prettier/recommended";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierRecommended,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "dist/**",
    "public/**"
  ]),
  {
    rules: {
      // Typescript (Zustand/Zod/Hook Form best practices)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtExceptionsIgnorePattern: "^_"
        },
      ],
      // TypeScript strict adherence, beneficial for Zod types
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],

      // React / UI components (Shadcn)
      "react/self-closing-comp": "warn",

      // Prettier integration rule tweaks
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],

      // General Good Practices
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
]);

export default eslintConfig;
