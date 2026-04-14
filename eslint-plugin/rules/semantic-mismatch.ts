/**
 * Why: Name-vs-behavior mismatch causes high-risk production mistakes.
 * How: This rule compares method intent keywords with detected body operations.
 * Example: `getUser()` calling `repo.delete()` is flagged as destructive mismatch.
 */
import { isIdentifier, splitNameIntoTokens } from "./shared";

const READ_INTENT_PREFIXES = ["get", "find", "fetch", "read"];
const CREATE_INTENT_PREFIXES = ["create", "add"];
const VALIDATE_INTENT_PREFIXES = ["validate", "check"];

const DESTRUCTIVE_OPERATION_PATTERN = /\.(delete|remove|drop|archive)\s*\(/i;
const CREATE_OPERATION_PATTERN = /\.(create|save|insert)\s*\(/i;
const BOOLEAN_RETURN_PATTERN = /return\s+(true|false|!![\w.()[\]]+)/i;
const THROW_PATTERN = /\bthrow\b/i;

const startsWithIntent = (name: string, intents: string[]): boolean => {
  const [firstToken] = splitNameIntoTokens(name);
  return firstToken ? intents.includes(firstToken) : false;
};

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Detect semantic mismatch between method name and behavior",
    },
    schema: [],
    messages: {
      destructiveMismatch:
        "Function '{{name}}' suggests read behavior but performs destructive operations. Rename or split logic.",
      missingCreateBehavior:
        "Function '{{name}}' suggests create behavior but no create operation was detected.",
      invalidValidateBehavior:
        "Function '{{name}}' suggests validation behavior but does not return boolean or throw.",
    },
  },
  create(context: {
    report: (descriptor: {
      node: unknown;
      messageId: "destructiveMismatch" | "missingCreateBehavior" | "invalidValidateBehavior";
      data: { name: string };
    }) => void;
    sourceCode?: { getText: (node: unknown) => string };
    getSourceCode?: () => { getText: (node: unknown) => string };
  }) {
    const sourceCode = context.sourceCode ?? context.getSourceCode?.();
    if (!sourceCode) {
      return {};
    }

    const reportSemanticMismatch = (
      node: unknown,
      name: string,
      bodyText: string,
    ): void => {
      if (startsWithIntent(name, READ_INTENT_PREFIXES) && DESTRUCTIVE_OPERATION_PATTERN.test(bodyText)) {
        context.report({
          node,
          messageId: "destructiveMismatch",
          data: { name },
        });
      }

      if (startsWithIntent(name, CREATE_INTENT_PREFIXES) && !CREATE_OPERATION_PATTERN.test(bodyText)) {
        context.report({
          node,
          messageId: "missingCreateBehavior",
          data: { name },
        });
      }

      if (
        startsWithIntent(name, VALIDATE_INTENT_PREFIXES) &&
        !BOOLEAN_RETURN_PATTERN.test(bodyText) &&
        !THROW_PATTERN.test(bodyText)
      ) {
        context.report({
          node,
          messageId: "invalidValidateBehavior",
          data: { name },
        });
      }
    };

    return {
      FunctionDeclaration(node: { id?: unknown; body?: unknown }) {
        if (!node.id || !isIdentifier(node.id) || !node.body) {
          return;
        }

        const bodyText = sourceCode.getText(node.body);
        reportSemanticMismatch(node.id, node.id.name, bodyText);
      },

      MethodDefinition(node: { key: unknown; value?: { body?: unknown } }) {
        if (!isIdentifier(node.key) || !node.value?.body) {
          return;
        }

        const bodyText = sourceCode.getText(node.value.body);
        reportSemanticMismatch(node.key, node.key.name, bodyText);
      },
    };
  },
};

export default rule;
