/**
 * Why: Teams need a single preset to adopt governance quickly.
 * How: This config turns on all framework rules with sensible severities.
 * Example: extends: ["plugin:engineering-quality-framework/recommended"].
 */
const recommended = {
  rules: {
    "engineering-quality-framework/no-generic-names": "error",
    "engineering-quality-framework/nest-naming-conventions": "error",
    "engineering-quality-framework/require-tsdoc": "error",
    "engineering-quality-framework/semantic-mismatch": "warn",
  },
};

export default recommended;
