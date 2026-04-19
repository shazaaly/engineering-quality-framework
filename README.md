# Engineering Quality Framework

Governance toolkit for NestJS repositories.

This project demonstrates a practical quality-gate system that enforces naming, semantic intent, and documentation standards before code can merge.

## What This Repo Contains

- `eslint-plugin/`: custom governance rules
- `test-repo/`: sample NestJS app used as a governed target
- `.github/workflows/quality-gate.yml`: CI quality + docs artifact flow
- `standards/engineering-handbook.md`: source policy document
- `scripts/generate-docs.mjs`: docs generator (Compodoc + handbook copy)
- `scaffold/`: copy-ready templates for adopting this in another repo

## Tools Used in Engineering Quality Framework

| Tool | Purpose | Implementation |
|------|---------|----------------|
| **Compodoc** | Generates API documentation from TSDoc in Nest-style TypeScript | Invoked from `scripts/generate-docs.mjs` against `test-repo/tsconfig.docs.json`; output under `docs/api/` |
| **ESLint** | Core lint engine for custom governance rules | Flat config in `eslint.config.js`; rules in `eslint-plugin/rules/` |
| **Husky** | Git hooks so quality runs before commit | Template in `scaffold/.husky/pre-commit` (copy into target repos) |
| **lint-staged** | Lint only staged files for fast pre-commit | Template in `scaffold/.lintstagedrc.json` |
| **GitHub Actions** | CI quality gates and docs artifact on PR / `main` | `.github/workflows/quality-gate.yml` |
| **TypeScript + @typescript-eslint/parser** | Parse TS/decorators so rules can inspect the AST | Wired in `eslint.config.js`; rules traverse ESTree nodes |
| **marked** | Render the engineering handbook as HTML for docs | Used in `scripts/generate-docs.mjs` → `docs/engineering-handbook.html` |

### Notes

- Local hooks (Husky + lint-staged) catch issues early; CI (GitHub Actions) is the non-bypassable gate when branch protection is enabled.
- Meaningful Compodoc output depends on TSDoc; that expectation is aligned with `standards/engineering-handbook.md`.
- Adoption templates live under `scaffold/`; see `EXTERNAL_REPO_ADOPTION_GUIDE.md` for copying into another repo.

### Further reading (in this repo)

- [standards/engineering-handbook.md](standards/engineering-handbook.md) — policy source
- [EXTERNAL_REPO_ADOPTION_GUIDE.md](EXTERNAL_REPO_ADOPTION_GUIDE.md) — external repo setup steps

## Current Rule Set

The flat ESLint config at `eslint.config.js` enables these rules on `test-repo/src/**/*.ts`. For a **per-rule case matrix** (forbidden names, semantic prefixes, DTO paths, TSDoc thresholds), see [demo.md](demo.md#cases-covered-by-governance-rules).

1. `no-generic-names`
   - blocks vague identifiers like `data`, `temp`, `result`
2. `semantic-mismatch`
   - detects intent vs behavior mismatches (example: `get*` calling delete)
3. `nest-naming-conventions`
   - enforces suffix patterns for `@Controller`, `@Injectable`, DTOs
4. `require-tsdoc`
   - requires method-level TSDoc with:
     - exact `@param` names/order
     - minimum summary/description lengths
     - `@returns`
   - provides auto-fix template insertion when docs are missing

## Quick Start

```bash
npm ci
npm ci --prefix test-repo
```

Run quality gates:

```bash
npm run demo:check
```

Generate docs locally:

```bash
npm run docs:generate
```

Open generated docs:

- `docs/index.html` (landing page)
- `docs/api/index.html` (Compodoc API docs)
- `docs/engineering-handbook.md` (policy copy)

## NPM Scripts

- `npm run typecheck` - TypeScript type check for toolkit files
- `npm run lint:quality` - run all active governance rules on `test-repo/src/**/*.ts`
- `npm run lint:demo` - alias of `lint:quality`
- `npm run lint:fix` - auto-fix supported lint issues
- `npm run check:semantic` - alias of `lint:quality`
- `npm run demo:check` - canonical quality command for local + CI
- `npm run docs:generate` - generate Compodoc + handbook + docs landing page
- `npm run ci:full` - `demo:check` then `docs:generate`

## CI Workflow

Workflow: `.github/workflows/quality-gate.yml`

Triggers:

- `pull_request` on `main`
- `push` on `main`
- manual run (`workflow_dispatch`)

Jobs:

1. `quality`
   - installs root + `test-repo` dependencies
   - runs `npm run demo:check`
2. `documentation` (runs only if `quality` passes)
   - runs `npm run docs:generate`
   - uploads artifact `governed-nest-docs`

This keeps governance non-bypassable in CI while producing downloadable docs for every successful run.

## Documentation After Push to `main`

After every successful push to `main`, the workflow generates and exports documentation automatically.

What is generated:

- `docs/api/` - Compodoc output from `test-repo`
- `docs/engineering-handbook.md` - copied policy reference
- `docs/index.html` - landing page linking both outputs

Where to find it:

1. GitHub repository -> **Actions**
2. Open latest successful `quality-gate` run
3. Open job `documentation`
4. Download artifact: `governed-nest-docs`

This gives a consistent, version-aligned documentation bundle for every successful CI run on `main`.

## Deployment (Netlify Option A)

This repo is configured for Netlify native Git integration (no PAT required in GitHub Actions).

In Netlify project settings:

- Build command: `npm run docs:generate`
- Publish directory: `docs`

Netlify then deploys on connected branch updates and PR previews using its own integration.

## Demo Walkthrough

1. Show policy source: `standards/engineering-handbook.md`
2. Run `npm run demo:check` and show failure on an intentional violation
3. Fix code to satisfy naming/semantic/TSDoc rules
4. Re-run checks and show pass
5. Run `npm run docs:generate`
6. Open `docs/api/index.html` and show generated API docs
7. Show CI workflow + artifact from GitHub Actions

## Notes

- `docs/` is generated and ignored in git (`.gitignore`).
- `test-repo/` is an in-repo governed sample, not the product itself.
- Source-of-truth policy remains in `standards/engineering-handbook.md`.

## TODO

- unit tests for each custom lint rule
- richer semantic analysis across files/services
- packaged distribution for drop-in adoption in external repos
