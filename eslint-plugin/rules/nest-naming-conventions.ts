/**
 * Why: NestJS architecture becomes inconsistent without naming contracts.
 * How: This rule maps class decorators to expected suffixes and validates DTO naming.
 * Example: `@Controller() export class UserHandler` should be `UsersController`.
 */
import { getDecoratorName, isIdentifier } from "./shared";

const DECORATOR_TO_SUFFIX: Record<string, string> = {
  Controller: "Controller",
  Injectable: "Service",
};

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce NestJS naming conventions",
    },
    schema: [],
    messages: {
      invalidClassName:
        "Class '{{name}}' must end with '{{expectedSuffix}}' for @{{decorator}}.",
      invalidDtoName: "DTO class '{{name}}' must end with 'Dto'.",
    },
  },
  create(context: {
    filename?: string;
    getFilename?: () => string;
    report: (descriptor: {
      node: unknown;
      messageId: "invalidClassName" | "invalidDtoName";
      data: { name: string; expectedSuffix?: string; decorator?: string };
    }) => void;
  }) {
    const fileName = context.filename ?? context.getFilename?.() ?? "";
    const isDtoFile = /\/dto\/.*\.ts$/i.test(fileName) || /\.dto\.ts$/i.test(fileName);

    return {
      ClassDeclaration(node: { id?: unknown; decorators?: unknown[] }) {
        if (!node.id || !isIdentifier(node.id)) {
          return;
        }

        const className = node.id.name;
        const decorators = node.decorators ?? [];

        for (const decorator of decorators) {
          const decoratorName = getDecoratorName(decorator);
          if (!decoratorName) {
            continue;
          }

          const expectedSuffix = DECORATOR_TO_SUFFIX[decoratorName];
          if (!expectedSuffix) {
            continue;
          }

          if (!className.endsWith(expectedSuffix)) {
            context.report({
              node: node.id,
              messageId: "invalidClassName",
              data: { name: className, expectedSuffix, decorator: decoratorName },
            });
          }
        }

        if (isDtoFile && !className.endsWith("Dto")) {
          context.report({
            node: node.id,
            messageId: "invalidDtoName",
            data: { name: className },
          });
        }
      },
    };
  },
};

export default rule;
