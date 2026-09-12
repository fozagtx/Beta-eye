import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/**", "coverage/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.worker,
        module: "readonly",
        globalThis: "readonly",
        TextEncoder: "readonly",
        importScripts: "readonly",
      },
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "no-control-regex": "off",
    },
  },
  {
    files: ["eslint.config.mjs", "scripts/**/*.mjs", "tests/**/*.js"],
    languageOptions: {
      sourceType: "module",
      globals: { ...globals.node, ...globals.vitest },
    },
  },
];
