/**
 * Why: Public methods without docs reduce knowledge continuity and onboarding speed.
 * How: This rule will require TSDoc blocks for public controller/service methods.
 * Example: `createUser(dto)` must include summary, `@param`, and `@returns`.
 */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require TSDoc for public Nest methods",
    },
    schema: [],
    messages: {
      missingTsdoc:
        "Public method '{{name}}' must include TSDoc with @param and @returns.",
    },
  },
  create() {
    return {};
  },
};

export default rule;
