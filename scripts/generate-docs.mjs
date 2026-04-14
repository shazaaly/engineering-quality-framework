/**
 * Why: Definition of Done requires docs generation after quality passes (engineering-handbook §6).
 * How: Compodoc from test-repo (TSDoc §4) + copy policy handbook next to output for one artifact.
 */
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs", "api");

await mkdir(outDir, { recursive: true });

const compodoc = spawnSync(
  "npx",
  [
    "compodoc",
    "-p",
    join(root, "test-repo", "tsconfig.json"),
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
    <li><a href="./engineering-handbook.md">Engineering handbook (Markdown)</a></li>
  </ul>
</body>
</html>
`;
await writeFile(join(root, "docs", "index.html"), indexHtml, "utf8");

console.log("Docs written to docs/api; handbook copied; docs/index.html landing page added.");
