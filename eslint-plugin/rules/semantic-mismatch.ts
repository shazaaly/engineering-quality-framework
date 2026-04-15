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

  if (node.type === "BinaryExpression" || node.type === "LogicalExpression" || node.type === "ConditionalExpression") {
    return true;
  }

  if (node.type === "UnaryExpression" && (node.operator === "!" || node.operator === "!!")) {
    return true;
  }

  return false;
};

const collectBehaviorFlags = (bodyNode: unknown): {
  hasDestructiveCall: boolean;
  destructiveOperation: string | null;
  hasCreateCall: boolean;
  hasBooleanReturn: boolean;
  hasThrow: boolean;
} => {
  const flags = {
    hasDestructiveCall: false,
    destructiveOperation: null as string | null,
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
          if (!flags.destructiveOperation) {
            flags.destructiveOperation = operation;
          }
        }
        if (
          CREATE_OPERATIONS.has(operation) ||
          CREATE_INTENT_PREFIXES.some((prefix) => operation.startsWith(prefix))
        ) {
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
        "Why: '{{name}}' suggests read-only behavior, but code calls '{{operation}}'. How to fix: rename to a destructive verb (e.g. delete/remove) or split read and write logic into separate methods.",
      missingCreateBehavior:
        "Why: '{{name}}' suggests create behavior but no create/save/insert operation was detected. How to fix: call a create operation or rename method to match actual behavior.",
      invalidValidateBehavior:
        "Why: '{{name}}' implies validation, but it neither returns boolean nor throws on invalid input. How to fix: return true/false or throw a validation error.",
    },
  },
  create(context: {
    report: (descriptor: {
      node: unknown;
      messageId: "destructiveMismatch" | "missingCreateBehavior" | "invalidValidateBehavior";
      data: { name: string; operation?: string };
    }) => void;
  }) {
    const reportSemanticMismatch = (
      node: unknown,
      name: string,
      behavior: {
        hasDestructiveCall: boolean;
        destructiveOperation: string | null;
        hasCreateCall: boolean;
        hasBooleanReturn: boolean;
        hasThrow: boolean;
      },
    ): void => {
      if (startsWithIntent(name, READ_INTENT_PREFIXES) && behavior.hasDestructiveCall) {
        context.report({
          node,
          messageId: "destructiveMismatch",
          data: { name, operation: behavior.destructiveOperation ?? "delete/remove/drop/archive" },
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
