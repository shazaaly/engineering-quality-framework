/**
 * Why: Name-vs-behavior mismatch causes high-risk production mistakes.
 * How: This rule compares method intent keywords with detected body operations.
 * Example: `getUser()` calling `repo.delete()` is flagged as destructive mismatch.
 */
import { isIdentifier, splitNameIntoTokens } from "./shared";

const READ_INTENT_PREFIXES = ["get", "find", "fetch", "read"];
const CREATE_INTENT_PREFIXES = ["create", "add"];
const VALIDATE_INTENT_PREFIXES = ["validate", "check"];

const DESTRUCTIVE_OPERATIONS = new Set(["delete", "remove", "drop", "archive"]);
const CREATE_OPERATIONS = new Set(["create", "save", "insert"]);

const startsWithIntent = (name: string, intents: string[]): boolean => {
  const [firstToken] = splitNameIntoTokens(name);
  return firstToken ? intents.includes(firstToken) : false;
};

const isNode = (value: unknown): value is { type: string; [key: string]: unknown } => {
  return typeof value === "object" && value !== null && "type" in value;
};

const isBooleanExpression = (node: { type: string; [key: string]: unknown }): boolean => {
  if (node.type === "Literal" && typeof node.value === "boolean") {
    return true;
  }

  if (node.type === "UnaryExpression" && (node.operator === "!" || node.operator === "!!")) {
    return true;
  }

  return false;
};

const collectBehaviorFlags = (bodyNode: unknown): {
  hasDestructiveCall: boolean;
  hasCreateCall: boolean;
  hasBooleanReturn: boolean;
  hasThrow: boolean;
} => {
  const flags = {
    hasDestructiveCall: false,
    hasCreateCall: false,
    hasBooleanReturn: false,
    hasThrow: false,
  };
  const visited = new WeakSet<object>();

  const visit = (node: unknown): void => {
    if (!isNode(node)) {
      return;
    }
    if (visited.has(node)) {
      return;
    }
    visited.add(node);

    if (node.type === "ThrowStatement") {
      flags.hasThrow = true;
    }

    if (node.type === "ReturnStatement" && isNode(node.argument) && isBooleanExpression(node.argument)) {
      flags.hasBooleanReturn = true;
    }

    if (node.type === "CallExpression" && isNode(node.callee)) {
      const callee = node.callee;
      if (callee.type === "MemberExpression" && isNode(callee.property) && callee.property.type === "Identifier") {
        const operation = String(callee.property.name).toLowerCase();
        if (DESTRUCTIVE_OPERATIONS.has(operation)) {
          flags.hasDestructiveCall = true;
        }
        if (CREATE_OPERATIONS.has(operation)) {
          flags.hasCreateCall = true;
        }
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === "parent" || key === "loc" || key === "range") {
        continue;
      }
      if (Array.isArray(value)) {
        for (const child of value) {
          visit(child);
        }
      } else {
        visit(value);
      }
    }
  };

  visit(bodyNode);
  return flags;
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
  }) {
    const reportSemanticMismatch = (
      node: unknown,
      name: string,
      behavior: {
        hasDestructiveCall: boolean;
        hasCreateCall: boolean;
        hasBooleanReturn: boolean;
        hasThrow: boolean;
      },
    ): void => {
      if (startsWithIntent(name, READ_INTENT_PREFIXES) && behavior.hasDestructiveCall) {
        context.report({
          node,
          messageId: "destructiveMismatch",
          data: { name },
        });
      }

      if (startsWithIntent(name, CREATE_INTENT_PREFIXES) && !behavior.hasCreateCall) {
        context.report({
          node,
          messageId: "missingCreateBehavior",
          data: { name },
        });
      }

      if (
        startsWithIntent(name, VALIDATE_INTENT_PREFIXES) &&
        !behavior.hasBooleanReturn &&
        !behavior.hasThrow
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

        const behavior = collectBehaviorFlags(node.body);
        reportSemanticMismatch(node.id, node.id.name, behavior);
      },

      MethodDefinition(node: { key: unknown; value?: { body?: unknown } }) {
        if (!isIdentifier(node.key) || !node.value?.body) {
          return;
        }

        const behavior = collectBehaviorFlags(node.value.body);
        reportSemanticMismatch(node.key, node.key.name, behavior);
      },
    };
  },
};

export default rule;
