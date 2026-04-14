# Engineering Quality Handbook (NestJS Demo)

## Purpose

This handbook defines the minimum engineering rules for NestJS repositories.
The goal is simple: make code readable, enforceable, and safe to merge.

---

## 1) Non-Negotiables

1. No direct push to `main`; changes go through PR.
2. Every PR must pass local hooks and CI quality gates.
3. No generic names (`data`, `temp`, `info`, `result`, `stuff`, `item`).
4. Public methods in controllers/services require TSDoc.
5. No dead code, no unused imports, no debug `console.log` in production code.

---

## 2) Naming and Semantics

### 2.1 Classes (NestJS)

- `@Controller()` classes must end with `Controller`.
- `@Injectable()` business classes must end with `Service`.
- DTO classes must use `{Action}{Resource}Dto` (example: `CreateUserDto`).
- Module files use `{resource}.module.ts`.

### 2.2 Methods

Use method names that reflect behavior:

- `get*` / `find*` / `fetch*` -> read-only behavior
- `create*` / `add*` -> create behavior
- `update*` -> update behavior
- `delete*` / `remove*` -> destructive behavior
- `validate*` / `check*` -> boolean or explicit validation error
- `parse*` / `transform*` -> data shape conversion

If a method name says `get`, it must not delete data.

### 2.4 Semantic Reviewer Rule

The semantic reviewer checks whether method names match method behavior.
It does not need to be perfect; it is a risk-reducing safeguard.

Core checks:

- Extract method name
- Analyze called operations in method body
- Compare expected intent vs observed behavior
- Report mismatch in CI with a fix suggestion

Example mismatch:

- Method: `processUser`
- Behavior: calls delete/remove/archive operations
- CI message: `"Function name does not reflect destructive behavior. Consider rename to deleteUser/archiveUser or split logic."`

Severity:

- Error: destructive mismatch (blocks merge)
- Warning: ambiguous names like `process/handle/do` (advisory)

### 2.3 Variables

- Prefer descriptive names over short names.
- Avoid single-letter names except loop indexes (`i`, `j`).
- Long and clear is better than short and ambiguous.

---

## 3) Structure and Readability

1. Keep nesting shallow (target: max 3 levels).
2. Prefer early returns over long `else if` chains.
3. Split repeated logic into shared utilities/services.
4. Keep one level of abstraction per function.
5. Keep modules focused by business domain.

---

## 4) Documentation Standard (TSDoc)

All public controller/service methods must include:

- One-line intent
- `@param` for each parameter
- `@returns` behavior

Example:

```ts
/**
 * Create a new user in the system.
 * @param dto User creation payload.
 * @returns Created user id and email.
 */
async createUser(dto: CreateUserDto): Promise<UserSummary> {
  // implementation
}
```

---

## 5) Commit and PR Standard

### 5.1 Commit Format

Use conventional commits:

- `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`, `perf`

Format:

`type(scope): short imperative summary`

Example:

`feat(users): add semantic validation for service methods`

### 5.2 PR Minimum

Each PR should include:

- Why change is needed
- What changed
- Risks/impact
- Test evidence (screenshots or command output)

---

## 6) Definition of Done

A change is done only when:

- Lint passes
- Naming rules pass
- Semantic reviewer passes (no error-level mismatch)
- TSDoc rules pass
- Tests pass (minimum coverage target met)
- CI passes
- Docs are generated successfully

---

## 7) Demo Scope (2-Day)

For the demo, only high-impact rules are enforced as blockers:

1. NestJS naming conventions
2. Generic name ban
3. TSDoc on public methods
4. Semantic mismatch error detection
5. Test and CI pass requirement

Warning-level semantic findings are shown but do not block merge.
