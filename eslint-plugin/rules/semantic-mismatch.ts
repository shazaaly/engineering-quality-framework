/**
 * Why: Name-vs-behavior mismatch causes high-risk production mistakes.
 * How: This rule will compare method intent keywords with destructive/read/create operations.
 * Example: `processUser()` calling `repo.delete()` should be renamed or split.
 */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Detect semantic mismatch between method name and behavior",
    },
    schema: [],
    messages: {
      destructiveMismatch:
        "Function name does not reflect destructive behavior. Rename or split logic.",
    },
  },
  create() {
    return {};
  },
};

export default rule;
