import js from "@eslint/js"
import tseslint from "typescript-eslint"

export default [
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    files: ["next.config.mjs", "scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        TextEncoder: "readonly",
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
]
