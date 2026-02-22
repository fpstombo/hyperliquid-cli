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
  js.configs.recommended,
  ...tseslint.configs.recommended,
]
