import js from "@eslint/js"
import tseslint from "typescript-eslint"

export default [
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    files: ["next.config.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
]
