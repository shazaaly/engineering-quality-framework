/**
 * Why: Shared helpers keep rule files focused and avoid duplicated logic.
 * How: Rule modules import these utils for token parsing and identifier checks.
 * Example: `splitNameIntoTokens("getUserById")` -> ["get", "user", "by", "id"].
 */
export const splitNameIntoTokens = (rawName: string): string[] => {
  return rawName
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]/g, "_")
    .split("_")
    .map((token) => token.toLowerCase())
    .filter(Boolean);
};

export const isIdentifier = (node: unknown): node is { type: "Identifier"; name: string } => {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "name" in node &&
    (node as { type: string }).type === "Identifier" &&
    typeof (node as { name: string }).name === "string"
  );
};

export const isAstNode = (value: unknown): value is { type: string; [key: string]: unknown } => {
  return typeof value === "object" && value !== null && "type" in value;
};

/**
 * Reads Nest/class decorator name from ESTree decorator node (@Controller(), @Injectable).
 */
export const getDecoratorName = (decorator: unknown): string | null => {
  if (!isAstNode(decorator) || !isAstNode(decorator.expression)) {
    return null;
  }

  if (decorator.expression.type === "CallExpression" && isAstNode(decorator.expression.callee)) {
    const callee = decorator.expression.callee;
    if (callee.type === "Identifier" && typeof callee.name === "string") {
      return callee.name;
    }
  }

  if (decorator.expression.type === "Identifier" && typeof decorator.expression.name === "string") {
    return decorator.expression.name;
  }

  return null;
};
