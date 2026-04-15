/**
 * Why: Definition of Done requires docs generation after quality passes (engineering-handbook §6).
 * How: Compodoc from test-repo (TSDoc §4) + copy policy handbook next to output for one artifact.
 */
import { mkdir, copyFile, writeFile, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { marked } from "marked";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs", "api");

await mkdir(outDir, { recursive: true });

const compodoc = spawnSync(
  "npx",
  [
    "compodoc",
    "-p",
    join(root, "test-repo", "tsconfig.docs.json"),
    "-d",
    outDir,
    "--silent",
    "--disableCoverage",
  ],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
);

if (compodoc.status !== 0) {
  process.exit(compodoc.status ?? 1);
}

await copyFile(
  join(root, "standards", "engineering-handbook.md"),
  join(root, "docs", "engineering-handbook.md"),
);

const handbookMarkdown = await readFile(join(root, "standards", "engineering-handbook.md"), "utf8");
const handbookBodyHtml = marked.parse(handbookMarkdown);
const handbookHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Engineering Handbook</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 56rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
    code, pre code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    pre { background: #f6f8fa; padding: 0.75rem; border-radius: 6px; overflow-x: auto; }
    h1, h2, h3 { line-height: 1.25; }
    hr { border: 0; border-top: 1px solid #d0d7de; margin: 1.5rem 0; }
    ul, ol { padding-left: 1.25rem; }
    a { color: #0969da; }
  </style>
</head>
<body>
  <p><a href="./index.html">Back to docs index</a></p>
  ${handbookBodyHtml}
</body>
</html>
`;
await writeFile(join(root, "docs", "engineering-handbook.html"), handbookHtml, "utf8");

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Engineering Quality — Documentation</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    a { color: #0969da; }
    ul { padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>Governed Nest documentation</h1>
  <p>Generated from <code>test-repo</code> (Compodoc) plus the policy handbook.</p>
  <ul>
    <li><a href="./api/index.html">API documentation (Compodoc)</a></li>
    <li><a href="./engineering-handbook.html">Engineering handbook</a></li>
  </ul>
</body>
</html>
`;
await writeFile(join(root, "docs", "index.html"), indexHtml, "utf8");

console.log("Docs written to docs/api; handbook copied + rendered to HTML; docs/index.html landing page added.");
