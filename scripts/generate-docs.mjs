/**
 * Why: Definition of Done requires docs generation after quality passes (engineering-handbook §6).
 * How: Compodoc from test-repo (TSDoc §4) + copy policy handbook next to output for one artifact.
 */
import { mkdir, copyFile } from "node:fs/promises";
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

console.log("Docs written to docs/api; handbook copied to docs/engineering-handbook.md");
