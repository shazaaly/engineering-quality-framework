/**
 * Why: NestJS architecture becomes inconsistent without naming contracts.
 * How: This rule will map decorators to expected class suffixes (Controller/Service/Dto).
 * Example: `@Controller() export class UserHandler` should be `UsersController`.
 */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce NestJS naming conventions",
    },
    schema: [],
    messages: {
      invalidClassName:
        "Class '{{name}}' does not follow Nest naming convention for its role.",
    },
  },
  create() {
    return {};
  },
};

export default rule;
