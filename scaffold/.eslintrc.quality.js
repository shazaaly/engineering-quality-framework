/**
 * Why: Target NestJS repos need a drop-in ESLint config for governance adoption.
 * How: This file extends the framework recommended preset.
 * Example: Copy this file into a repo and run `eslint --ext .ts src`.
 */
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "engineering-quality-framework"],
  extends: ["plugin:engineering-quality-framework/recommended"],
};
