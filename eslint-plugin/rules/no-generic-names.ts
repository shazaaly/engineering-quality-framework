/**
 * Why: Generic names hide intent and make reviews slower.
 * How: This rule flags generic identifiers and weak function/method verbs.
 * Example: `const data = ...` should become `const userPayload = ...`.
 */
import { isIdentifier, splitNameIntoTokens } from "./shared";

const FORBIDDEN_NAMES = new Set([
  "data",
  "temp",
  "tmp",
  "info",
  "result",
  "results",
  "stuff",
  "item",
  "obj",
  "val",
  "value",
  "payload",
]);

const WEAK_VERBS = new Set(["do", "handle", "process", "run", "manage"]);

const isGenericName = (name: string): boolean => FORBIDDEN_NAMES.has(name.toLowerCase());

const isWeakMethodName = (name: string): boolean => {
  const tokens = splitNameIntoTokens(name);
  if (tokens.length === 0) {
    return false;
  }

  const [verb, ...rest] = tokens;
  if (!WEAK_VERBS.has(verb)) {
    return false;
  }

  // `processUser` is acceptable context; `process` alone is weak.
  return rest.length === 0;
};

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow generic names like data/temp/process",
    },
    schema: [],
    messages: {
      genericName:
        "Why: '{{name}}' is too generic and hides intent. How to fix: rename using domain context (e.g. userPayload, orderSummary, invoiceTotal).",
      weakMethodName:
        "Why: '{{name}}' starts with a weak verb and does not teach behavior. How to fix: use an explicit action name (e.g. deleteUser, validateOrder, createInvoice).",
    },
  },
  create(context: {
    report: (descriptor: {
      node: unknown;
      messageId: "genericName" | "weakMethodName";
      data: { name: string };
    }) => void;
  }) {
    const reportGenericName = (node: unknown, name: string): void => {
      if (isGenericName(name)) {
        context.report({
          node,
          messageId: "genericName",
          data: { name },
        });
      }
    };

    const reportWeakMethod = (node: unknown, name: string): void => {
      if (isWeakMethodName(name)) {
        context.report({
          node,
          messageId: "weakMethodName",
          data: { name },
        });
      }
    };

    return {
      VariableDeclarator(node: { id: unknown }) {
        if (isIdentifier(node.id)) {
          reportGenericName(node.id, node.id.name);
        }
      },

      FunctionDeclaration(node: { id?: unknown; params?: unknown[] }) {
        if (node.id && isIdentifier(node.id)) {
          reportGenericName(node.id, node.id.name);
          reportWeakMethod(node.id, node.id.name);
        }

        for (const param of node.params ?? []) {
          if (isIdentifier(param)) {
            reportGenericName(param, param.name);
          }
        }
      },

      MethodDefinition(node: { key: unknown; value?: { params?: unknown[] } }) {
        if (isIdentifier(node.key)) {
          reportGenericName(node.key, node.key.name);
          reportWeakMethod(node.key, node.key.name);
        }

        for (const param of node.value?.params ?? []) {
          if (isIdentifier(param)) {
            reportGenericName(param, param.name);
          }
        }
      },
    };
  },
};

export default rule;
