/**
 * Why: Name-vs-behavior mismatch causes high-risk production mistakes.
 * How: This rule compares method intent keywords with detected body operations.
 * Example: `getUser()` calling `repo.delete()` is flagged as destructive mismatch.
 */
import { isIdentifier, splitNameIntoTokens } from "./shared";

type AstNode = { type: string; [key: string]: unknown };
type MessageId = "destructiveMismatch" | "missingCreateBehavior" | "invalidValidateBehavior";
type BehaviorFlags = {
  hasDestructiveCall: boolean;
  destructiveOperation: string | null;
  hasCreateCall: boolean;
  hasBooleanReturn: boolean;
  hasThrow: boolean;
};

const READ_INTENT_PREFIXES = ["get", "find", "fetch", "read"] as const;
const CREATE_INTENT_PREFIXES = ["create", "add"] as const;
const VALIDATE_INTENT_PREFIXES = ["validate", "check"] as const;

const DESTRUCTIVE_OPERATIONS = new Set(["delete", "remove", "drop", "archive"]);
const CREATE_OPERATIONS = new Set(["create", "save", "insert"]);
const CREATE_METHOD_FIRST = new Set([...CREATE_OPERATIONS, ...CREATE_INTENT_PREFIXES]);
const COMPARE_OPERATORS = new Set([
  "==",
  "!=",
  "===",
  "!==",
  "<",
  "<=",
  ">",
  ">=",
  "in",
  "instanceof",
]);
const BOOLEANISH_METHODS = new Set([
  "includes",
  "startsWith",
  "endsWith",
  "some",
  "every",
  "test",
  "has",
  "hasOwnProperty",
]);
const TRANSPARENT_EXPRESSIONS = new Set([
  "ParenthesizedExpression",
  "ChainExpression",
  "TSAsExpression",
  "TSNonNullExpression",
]);
const AST_KEYS_TO_SKIP = new Set(["parent", "loc", "range"]);

const isNode = (value: unknown): value is AstNode => {
  return typeof value === "object" && value !== null && "type" in value;
};

const getFirstNameToken = (name: string): string | null => {
  const [firstToken] = splitNameIntoTokens(name);
  return firstToken ?? null;
};

const startsWithIntent = (name: string, intents: readonly string[]): boolean => {
  const firstToken = getFirstNameToken(name);
  return Boolean(firstToken && intents.includes(firstToken));
};

const unwrapExpression = (node: unknown): AstNode | null => {
  let current = node;
  for (let i = 0; i < 6; i++) {
    if (!isNode(current)) {
      return null;
    }
    if (!TRANSPARENT_EXPRESSIONS.has(current.type)) {
      return current;
    }
    current = current.expression;
  }
  return isNode(current) ? current : null;
};

const getMemberPropertyName = (callee: AstNode): string | null => {
  const isMemberExpression =
    callee.type === "MemberExpression" || callee.type === "OptionalMemberExpression";
  if (!isMemberExpression || !isNode(callee.property) || callee.property.type !== "Identifier") {
    return null;
  }
  return String(callee.property.name);
};

const isBooleanExpression = (node: AstNode): boolean => {
  if (node.type === "Literal" && typeof node.value === "boolean") {
    return true;
  }
  if (node.type === "UnaryExpression" && node.operator === "!") {
    return true;
  }
  if (node.type === "BinaryExpression" && typeof node.operator === "string" && COMPARE_OPERATORS.has(node.operator)) {
    return true;
  }
  if (node.type === "LogicalExpression" && (node.operator === "&&" || node.operator === "||")) {
    return (
      isNode(node.left) &&
      isNode(node.right) &&
      isBooleanExpression(node.left) &&
      isBooleanExpression(node.right)
    );
  }
  if (node.type === "CallExpression" && isNode(node.callee)) {
    const propertyName = getMemberPropertyName(node.callee);
    if (propertyName && BOOLEANISH_METHODS.has(propertyName)) {
      return true;
    }
  }
  return false;
};

const updateBehaviorFromCall = (flags: BehaviorFlags, propertyName: string): void => {
  const operation = propertyName.toLowerCase();

  if (DESTRUCTIVE_OPERATIONS.has(operation)) {
    flags.hasDestructiveCall = true;
    if (!flags.destructiveOperation) {
      flags.destructiveOperation = operation;
    }
  }

  const firstToken = getFirstNameToken(propertyName);
  if (CREATE_OPERATIONS.has(operation) || Boolean(firstToken && CREATE_METHOD_FIRST.has(firstToken))) {
    flags.hasCreateCall = true;
  }
};

const collectBehaviorFlags = (bodyNode: unknown): BehaviorFlags => {
  const flags: BehaviorFlags = {
    hasDestructiveCall: false,
    destructiveOperation: null,
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

    if (node.type === "ReturnStatement" && node.argument != null) {
      const unwrapped = unwrapExpression(node.argument);
      if (unwrapped && isBooleanExpression(unwrapped)) {
        flags.hasBooleanReturn = true;
      }
    }

    if (node.type === "CallExpression" && isNode(node.callee)) {
      const propertyName = getMemberPropertyName(node.callee);
      if (propertyName) {
        updateBehaviorFromCall(flags, propertyName);
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (AST_KEYS_TO_SKIP.has(key)) {
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
      messageId: MessageId;
      data: { name: string; operation?: string };
    }) => void;
  }) {
    const reportSemanticMismatch = (
      node: unknown,
      name: string,
      behavior: BehaviorFlags,
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
