/**
 * Why: Public API surface (controllers/services) must stay self-documenting for reviews and Compodoc.
 * How: For @Controller / @Injectable classes, require JSDoc with matching @param names, min description lengths, and @returns. Missing docs get an auto-fix template.
 * Example: Parameters dto and id need @param dto / @param id lines that match names and include short descriptions.
 */
import { getDecoratorName, isAstNode, isIdentifier } from "./shared";

const TARGET_DECORATORS = new Set(["Controller", "Injectable"]);

/** Minimum chars for the summary line (before any @ tag). */
const MIN_SUMMARY_LENGTH = 10;

/** Minimum chars for text after each @param name. */
const MIN_PARAM_DESC_LENGTH = 4;

/** Minimum chars for text after @returns / @return. */
const MIN_RETURNS_DESC_LENGTH = 4;

const getMethodName = (key: unknown): string | null => {
  if (isIdentifier(key)) {
    return key.name;
  }
  if (isAstNode(key) && key.type === "Literal" && typeof key.value === "string") {
    return key.value;
  }
  return null;
};

/** Walk ESTree param nodes (incl. TSParameterProperty) and collect bound names. */
const getParamNamesFromAst = (params: unknown[] | undefined): string[] => {
  const names: string[] = [];
  for (const param of params ?? []) {
    const n = getParamName(param);
    if (n) {
      names.push(n);
    }
  }
  return names;
};

const getParamName = (param: unknown): string | null => {
  if (!isAstNode(param)) {
    return null;
  }

  if (param.type === "Identifier" && typeof param.name === "string") {
    return param.name;
  }

  if (param.type === "AssignmentPattern" && isAstNode(param.left) && param.left.type === "Identifier") {
    return String(param.left.name);
  }

  if (param.type === "RestElement" && isAstNode(param.argument) && param.argument.type === "Identifier") {
    return String(param.argument.name);
  }

  if (param.type === "TSParameterProperty" && isAstNode(param.parameter)) {
    return getParamName(param.parameter);
  }

  return null;
};

const extractJsdocText = (blockValue: string): string => {
  return blockValue.replace(/^\s*\*?/gm, "").trim();
};

/** Strip JSDoc line prefix asterisks for parsing. */
/**
 * Split doc into summary (text before first @tag) and tag segment.
 */
const splitSummaryAndTags = (docText: string): { summary: string; tagText: string } => {
  const idx = docText.search(/@\w/);
  if (idx === -1) {
    return { summary: docText.trim(), tagText: "" };
  }
  return {
    summary: docText.slice(0, idx).trim(),
    tagText: docText.slice(idx),
  };
};

const cleanDocLine = (line: string): string => {
  return line.replace(/^\s*\*?\s?/, "").trim();
};

const docLines = (docText: string): string[] => {
  return docText.split("\n").map((line) => cleanDocLine(line));
};

/**
 * Parse @param lines in order (supports optional `{type}` and wrapped descriptions).
 */
const parseParamTags = (fullTagSection: string): { name: string; description: string }[] => {
  const lines = docLines(fullTagSection);
  const params: { name: string; description: string }[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.startsWith("@param")) {
      i += 1;
      continue;
    }

    const withoutKeyword = line.replace(/^@param(?:\s+\{[^}]+\})?\s+/, "");
    const nameMatch = withoutKeyword.match(/^(\S+)/);
    if (!nameMatch) {
      i += 1;
      continue;
    }

    const paramName = nameMatch[1];
    let description = withoutKeyword.slice(paramName.length).trim();
    i += 1;
    while (i < lines.length && !lines[i].startsWith("@")) {
      description += (description ? " " : "") + lines[i];
      i += 1;
    }

    params.push({ name: paramName, description: description.trim() });
  }

  return params;
};

const parseReturnsDescription = (fullTagSection: string): string => {
  const lines = docLines(fullTagSection);
  for (let i = 0; i < lines.length; i += 1) {
    if (!/^@returns?\b/i.test(lines[i])) {
      continue;
    }

    let desc = lines[i].replace(/^@returns?\s+/i, "").trim();
    i += 1;
    while (i < lines.length && !lines[i].startsWith("@")) {
      desc += (desc ? " " : "") + lines[i];
      i += 1;
    }

    return desc.trim();
  }

  return "";
};

type ValidateResult = { ok: true } | { ok: false; reason: string };

const validateTsdoc = (docText: string, astParamNames: string[]): ValidateResult => {
  const { summary, tagText } = splitSummaryAndTags(docText.trim());

  if (summary.length < MIN_SUMMARY_LENGTH) {
    return {
      ok: false,
      reason: `summary must be at least ${MIN_SUMMARY_LENGTH} characters (before @ tags)`,
    };
  }

  if (!/@returns?\b/i.test(tagText)) {
    return { ok: false, reason: "missing @returns" };
  }

  const returnsDesc = parseReturnsDescription(tagText);
  if (returnsDesc.length < MIN_RETURNS_DESC_LENGTH) {
    return {
      ok: false,
      reason: `@returns description must be at least ${MIN_RETURNS_DESC_LENGTH} characters`,
    };
  }

  const paramTags = parseParamTags(tagText);

  if (astParamNames.length !== paramTags.length) {
    return {
      ok: false,
      reason: `expected ${astParamNames.length} @param tag(s) with matching names, found ${paramTags.length}`,
    };
  }

  for (let i = 0; i < astParamNames.length; i += 1) {
    const expected = astParamNames[i];
    const tag = paramTags[i];
    if (tag.name !== expected) {
      return {
        ok: false,
        reason: `@param order/names must match parameters: expected @param ${expected}, got @param ${tag.name}`,
      };
    }
    if (tag.description.length < MIN_PARAM_DESC_LENGTH) {
      return {
        ok: false,
        reason: `@param ${expected} description must be at least ${MIN_PARAM_DESC_LENGTH} characters`,
      };
    }
  }

  return { ok: true };
};

const findLeadingJsdoc = (
  sourceCode: { getCommentsBefore: (node: unknown) => unknown[] },
  node: unknown,
): string | null => {
  const comments = sourceCode.getCommentsBefore(node);
  for (let i = comments.length - 1; i >= 0; i -= 1) {
    const c = comments[i] as { type?: string; value?: string };
    if (c.type === "Block" && typeof c.value === "string" && c.value.startsWith("*")) {
      return extractJsdocText(c.value);
    }
  }
  return null;
};

const classTargetsTsdoc = (decorators: unknown[] | undefined): boolean => {
  for (const d of decorators ?? []) {
    const name = getDecoratorName(d);
    if (name && TARGET_DECORATORS.has(name)) {
      return true;
    }
  }
  return false;
};

type SourceCodeLike = {
  getCommentsBefore: (node: unknown) => unknown[];
  lines?: string[];
  getText: (node?: unknown) => string;
};

const getIndentBeforeNode = (sourceCode: SourceCodeLike, member: unknown): string => {
  const loc = isAstNode(member) ? (member as { loc?: { start: { line: number; column: number } } }).loc : undefined;
  const lineNumber = loc?.start.line;
  const lines = sourceCode.lines ?? sourceCode.getText?.().split(/\r?\n/);
  if (!lineNumber || !lines || lineNumber < 1) {
    return "  ";
  }
  const line = lines[lineNumber - 1] ?? "";
  const col = loc?.start.column ?? 0;
  return line.slice(0, col);
};

const buildTemplateTsdoc = (indent: string, methodName: string, paramNames: string[]): string => {
  const lines = [`${indent}/**`, `${indent} * TODO: describe what ${methodName} does.`];
  for (const p of paramNames) {
    lines.push(`${indent} * @param ${p} TODO describe ${p}.`);
  }
  lines.push(`${indent} * @returns TODO describe the return value.`);
  lines.push(`${indent} */`);
  return `${lines.join("\n")}\n`;
};

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require TSDoc for public Nest controller/service methods",
    },
    fixable: "code",
    schema: [],
    messages: {
      missingTsdoc:
        "Why: '{{name}}' is part of public API and needs documentation for maintainability. How to fix: run ESLint with --fix to insert a template, then fill summary, exact @param tags, and @returns.",
      incompleteTsdoc:
        "Why: '{{name}}' documentation is incomplete ({{detail}}). How to fix: update summary and tags to match method parameters and behavior.",
    },
  },
  create(context: {
    sourceCode?: SourceCodeLike;
    getSourceCode?: () => SourceCodeLike;
    report: (descriptor: {
      node: unknown;
      messageId: "missingTsdoc" | "incompleteTsdoc";
      data: { name: string; detail?: string };
      fix?: (fixer: {
        insertTextBefore: (node: unknown, text: string) => unknown;
      }) => unknown;
    }) => void;
  }) {
    const sourceCode = context.sourceCode ?? context.getSourceCode?.();
    if (!sourceCode?.getCommentsBefore) {
      return {};
    }

    return {
      ClassDeclaration(node: { decorators?: unknown[]; body?: { body?: unknown[] } }) {
        if (!classTargetsTsdoc(node.decorators)) {
          return;
        }

        for (const member of node.body?.body ?? []) {
          if (!isAstNode(member) || member.type !== "MethodDefinition") {
            continue;
          }

          const method = member as unknown as {
            kind?: string;
            key: unknown;
            value?: { params?: unknown[] };
            accessibility?: string;
            loc?: { start: { line: number; column: number } };
          };

          if (method.kind === "constructor") {
            continue;
          }

          if (method.accessibility === "private") {
            continue;
          }

          if (isAstNode(method.key) && method.key.type === "PrivateIdentifier") {
            continue;
          }

          const name = getMethodName(method.key);
          if (!name) {
            continue;
          }

          const astParamNames = getParamNamesFromAst(method.value?.params);
          const docRaw = findLeadingJsdoc(sourceCode, member);

          if (!docRaw) {
            const indent = getIndentBeforeNode(sourceCode, member);
            const template = buildTemplateTsdoc(indent, name, astParamNames);
            context.report({
              node: method.key,
              messageId: "missingTsdoc",
              data: { name },
              fix(fixer) {
                return fixer.insertTextBefore(member, template);
              },
            });
            continue;
          }

          const result = validateTsdoc(docRaw, astParamNames);
          if (!result.ok) {
            context.report({
              node: method.key,
              messageId: "incompleteTsdoc",
              data: { name, detail: result.reason },
            });
          }
        }
      },
    };
  },
};

export default rule;
