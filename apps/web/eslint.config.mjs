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

  {
    files: ["components/**/*.ts", "components/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/lib/api*", "**/lib/auth", "**/lib/sim-state", "**/lib/server*", "**/lib/agent-state-server", "**/lib/trading"],
              message: "Render components must remain presentation-only. Move API/domain/server wiring into lib/hooks or route containers.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["components/**/*.ts", "components/**/*.tsx", "app/**/*.ts", "app/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^(#(?:[0-9a-fA-F]{3,8})|(?:rgb|hsl)a?\\()/]",
          message: "Use token-backed CSS variables/classes from app/globals.css instead of raw color literals.",
        },
      ],
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
]
