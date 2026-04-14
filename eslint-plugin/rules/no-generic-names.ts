/**
 * Why: Generic names hide intent and make reviews slower.
 * How: This rule flags generic identifiers and weak function/method verbs.
 * Example: `const data = ...` should become `const userPayload = ...`.
 */
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

const splitNameIntoTokens = (rawName: string): string[] => {
  return rawName
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]/g, "_")
    .split("_")
    .map((token) => token.toLowerCase())
    .filter(Boolean);
};

const isIdentifier = (node: unknown): node is { type: "Identifier"; name: string } => {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "name" in node &&
    (node as { type: string }).type === "Identifier" &&
    typeof (node as { name: string }).name === "string"
  );
};

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
        "Avoid generic name '{{name}}'. Use a domain-specific name like 'userPayload' or 'orderSummary'.",
      weakMethodName:
        "Method '{{name}}' starts with a weak verb. Prefer a specific action like 'deleteUser' or 'validateOrder'.",
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
