# Engineering Quality Framework — 2-Day Demo Plan

## What This Is

A standalone quality enforcement toolkit that governs NestJS repositories.
Drop it into any Nest codebase → get pre-commit checks, CI gates,
naming validation, and auto-generated docs.

The product is the toolkit. The sample Nest app is just a test subject.

## Tech Stack

- Toolkit: Node.js CLI + ESLint plugin + husky/lint-staged configs
- Target: Any NestJS/TypeScript repository
- AST analysis: ts-morph (reads TypeScript AST, understands decorators)
- Pre-commit: husky + lint-staged (injected into target repo)
- CI: GitHub Actions workflow (copyable template)
- Docs generation: Compodoc (NestJS-native)
- Packaging: Single npm package or a copyable scaffold

## Folder Structure

```
engineering-quality-framework/
├── README.md
├── package.json
├── tsconfig.json
│
├── standards/
│   └── engineering-handbook.md          # The rules reference doc
│
├── eslint-plugin/                       # Custom ESLint plugin
│   ├── index.ts                         # Plugin entry (exports all rules)
│   ├── rules/
│   │   ├── no-generic-names.ts          # Ban vague identifiers
│   │   ├── require-tsdoc.ts             # Enforce TSDoc on public methods
│   │   ├── nest-naming-conventions.ts   # Controller/Service/DTO naming
│   │   └── semantic-mismatch.ts         # Name vs body intent check
│   └── configs/
│       └── recommended.ts              # Preset: turn on all rules
│
├── scaffold/                            # Files to copy into target repo
│   ├── .husky/
│   │   └── pre-commit                   # Pre-commit hook script
│   ├── .lintstagedrc.json               # lint-staged config
│   ├── .github/
│   │   └── workflows/
│   │       └── quality-gate.yml         # CI pipeline template
│   └── .eslintrc.quality.js             # ESLint config extending our plugin
│
├── test-repo/                           # Fake NestJS app to demo against
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts         # Mix of good + bad code
│   │   │   └── dto/
│   │   │       └── create-user.dto.ts
│   │   └── orders/
│   │       ├── orders.module.ts
│   │       ├── orders.controller.ts
│   │       ├── orders.service.ts        # More violations to catch
│   │       └── dto/
│   │           └── create-order.dto.ts
│   ├── package.json
│   └── tsconfig.json
│
└── docs/                                # Generated (gitignored)
```

## Core Concept: What the ESLint Plugin Knows About NestJS

This is what makes the tool NestJS-aware, not just a generic linter.
It reads decorators to understand what a class IS:

| Decorator         | The tool understands it as | Rules applied                         |
| ----------------- | -------------------------- | ------------------------------------- |
| `@Controller()`   | HTTP handler layer         | Must be named `{Resource}Controller`  |
| `@Injectable()`   | Service / provider         | Must be named `{Resource}Service`     |
| `@Module()`       | Domain boundary            | Must group related files              |
| `@Get/@Post/...`  | Route handler              | Method must be verb+noun              |
| DTO classes       | Input validation           | Must be named `{Action}{Resource}Dto` |
| `@Param/@Body/..` | Input bindings             | Param names must not be generic       |

ts-morph reads the AST + decorators → the rules use that context.

## Semantic Reviewer (Rule-Based Now, AI-Ready Later)

This is the risk-reducing layer that compares function intent vs behavior.

Flow:

1. Extract function/method name
2. Analyze function body operations
3. Compare intent vs behavior
4. Flag mismatch with actionable CI feedback

Example:

- Function name: `processUser`
- Actual behavior: deletes user records
- CI comment: `"Function name does not reflect destructive behavior. Consider rename to deleteUser/archiveUser or split logic."`

Initial deterministic rules for the demo:

- `get/find/fetch*` must not call destructive ops (`delete/remove/drop/archive`)
- `create/add*` should include create ops (`create/save/insert`)
- `validate/check*` should return boolean or throw
- ambiguous names like `process/handle/do` produce warning-level feedback

Severity policy:

- Error: destructive mismatch (blocks CI)
- Warning: ambiguous naming (advisory in CI)

---

## Day 1: ESLint Plugin + Standards

### Morning — Standards + Plugin Skeleton (2-3 hrs)

**1. Engineering Handbook** (`standards/engineering-handbook.md`)

One-page rules doc. Covers:

- Method naming: verb + noun (`getUser`, `deleteOrder`, `validateEmail`)
- Forbidden names: `data`, `temp`, `info`, `result`, `stuff`, `item`, `obj`, `val`
- Class naming by role (see table above)
- TSDoc required on all public methods, must have `@param` and `@returns`
- Definition of Done checklist

**2. ESLint Plugin — Rule: `no-generic-names`**

- Walks all function/method/variable declarations
- Checks name against forbidden list
- Checks method names contain a verb (from approved list: get, create, update,
  delete, validate, find, check, send, build, parse, format, transform...)
- Error: `"Avoid generic name 'data'. Use a descriptive name like 'userData' or 'orderPayload'."`

**3. ESLint Plugin — Rule: `nest-naming-conventions`**

- Uses ts-morph to detect NestJS decorators on classes
- `@Controller()` class → must end with `Controller`
- `@Injectable()` service → must end with `Service`
- DTO files → class must match `{Verb}{Resource}Dto` pattern
- Route handler methods → must be verb-prefixed
- Error: `"Class decorated with @Controller() should be named '{Resource}Controller', got 'UserHandler'."`

### Afternoon — More Rules + Pre-commit (3-4 hrs)

**4. ESLint Plugin — Rule: `require-tsdoc`**

- All public methods in Controller/Service classes must have TSDoc
- Must include `@param` for each parameter and `@returns`
- Error: `"Public method 'createUser' is missing TSDoc. Add /** */ with @param and @returns."`

**5. ESLint Plugin — Rule: `semantic-mismatch`**

- If method name starts with `get/find/fetch` → body must NOT call `.delete()`, `.remove()`, `.drop()`
- If method name starts with `create/add` → body should contain a `.save()`, `.create()`, `.insert()` call
- If method name starts with `validate/check` → should return boolean or throw
- If method name is `process/handle/do*` → warn unless contextual noun clarifies intent
- Error: `"Method 'getUser' calls 'this.repo.delete()' — name suggests read, body suggests delete."`

**6. Scaffold: husky + lint-staged**

- `.husky/pre-commit` runs `lint-staged`
- `.lintstagedrc.json` runs ESLint with our plugin on staged `.ts` files
- Test: commit bad code in `test-repo/` → blocked with clear errors

**Day 1 Milestone:** Run ESLint plugin against test-repo, see violations caught.

---

## Day 2: CI + Docs + Test Repo + Demo

### Morning — CI Template + Test Repo (3-4 hrs)

**7. GitHub Actions Template** (`scaffold/.github/workflows/quality-gate.yml`)

Triggers on PR. Steps:

1. Checkout + install
2. ESLint with quality plugin (`eslint --ext .ts src/`)
3. Semantic reviewer pass (errors fail CI, warnings reported)
4. Jest tests + coverage (`--coverage --coverageThreshold='{"global":{"lines":60}}'`)
5. Generate docs with Compodoc
6. Upload docs as artifact
7. Any failure → PR blocked

**8. Test Repo — Intentional Violations**

`users.service.ts` — includes:

- `getData()` — generic name, triggers `no-generic-names`
- `getUser()` that calls `this.repo.delete()` — triggers `semantic-mismatch`
- `process()` — missing TSDoc, generic name, two violations
- `createUser()` — clean, passes everything (the "good" example)

`orders.service.ts` — includes:

- `UserHandler` class with `@Controller()` — triggers `nest-naming-conventions`
- `handle()` method with no docs — triggers `require-tsdoc`

### Afternoon — Docs + Demo Polish (2-3 hrs)

**9. Compodoc Integration**

- Add to scaffold: `compodoc -p tsconfig.json -s` script
- CI generates and uploads HTML docs
- Show: "good TSDoc → full browsable API docs for free"

**10. Demo Script** (~10 min live walkthrough)

1. "Here's a normal NestJS repo" → show test-repo
2. "We install the quality framework" → copy scaffold files, add plugin
3. "Developer tries to commit bad code" → pre-commit blocks, clear errors
4. "They fix violations" → commit succeeds
5. "PR opens → CI runs all gates" → show pipeline
6. "CI fails on semantic mismatch" → show the `getUser` / `delete` catch
7. "Fix everything → CI passes → docs auto-generated"
8. Close: "Standards enforced automatically. Zero human overhead."

---

## What's CUT (not in 2-day demo)

- CLI installer tool (`npx quality-init` to scaffold into a repo)
- AI-based semantic analysis
- Governance dashboard
- Multi-framework support (Express, Fastify standalone)
- npm publishing of the plugin
- Custom rule configuration (use presets only)

## Success Criteria

- [ ] ESLint plugin catches generic names, bad NestJS naming, missing TSDoc
- [ ] Semantic mismatch rule flags at least 1 name/body contradiction
- [ ] Pre-commit blocks bad commits with clear, actionable error messages
- [ ] CI pipeline template runs all checks on PR
- [ ] Compodoc generates docs from TSDoc comments
- [ ] Full demo loop: bad code → blocked → fixed → merged → docs updated
