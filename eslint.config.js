/**
 * Why: ESLint v9+ uses flat config; this loads local demo rules directly.
 * How: Register parser + inline local plugin rules for test-repo TypeScript files.
 * Example: run demo lint on the test-repo source files.
 */
const tsParser = require("@typescript-eslint/parser");
require("ts-node/register/transpile-only");
const noGenericNames = require("./eslint-plugin/rules/no-generic-names.ts").default;
const semanticMismatch = require("./eslint-plugin/rules/semantic-mismatch.ts").default;

module.exports = [
  {
    files: ["test-repo/src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "engineering-quality-framework": {
        rules: {
          "no-generic-names": noGenericNames,
          "semantic-mismatch": semanticMismatch,
        },
      },
    },
    rules: {
      "engineering-quality-framework/no-generic-names": "error",
      "engineering-quality-framework/semantic-mismatch": "error",
    },
  },
];
