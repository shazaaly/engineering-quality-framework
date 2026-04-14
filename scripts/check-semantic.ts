/**
 * Why: Some teams want a dedicated “semantic” step in CI for clarity—even when checks live in ESLint.
 * How: This script delegates to the same command as `npm run check:semantic` / `lint:quality`.
 * Example: `npx ts-node scripts/check-semantic.ts` (kept for backwards compatibility with older CI snippets).
 */
import { spawnSync } from "child_process";

const result = spawnSync("npm", ["run", "lint:quality"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
