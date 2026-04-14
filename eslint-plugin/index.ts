/**
 * Why: This is the plugin entrypoint that exposes all governance rules in one place.
 * How: ESLint loads this file and reads the exported `rules` and `configs` objects.
 * Example: In target repo config -> plugins: ["engineering-quality-framework"].
 */
import noGenericNames from "./rules/no-generic-names";
import nestNamingConventions from "./rules/nest-naming-conventions";
import requireTsdoc from "./rules/require-tsdoc";
import semanticMismatch from "./rules/semantic-mismatch";
import recommended from "./configs/recommended";

const plugin = {
  rules: {
    "no-generic-names": noGenericNames,
    "nest-naming-conventions": nestNamingConventions,
    "require-tsdoc": requireTsdoc,
    "semantic-mismatch": semanticMismatch,
  },
  configs: {
    recommended,
  },
};

export default plugin;
