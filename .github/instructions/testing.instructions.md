---
applyTo: 'tests/**/*.test.ts,tests/**/*.test.tsx,tests/setup/**,src/**/*.test.*'
---

# Testing Architecture Analysis

Before modifying or creating tests, you MUST:

1. **Read** `.github/docs/testing-rules.md` for Vitest + RTL patterns (zero act warnings, fake timers, NotificationProvider wrapping).
2. **Mirror src/ structure** in `tests/unit/src/` or `tests/integration/src/` — enforced by `enforceCoverage.mjs`.
3. **Use async `userEvent.setup()`** — never bare `fireEvent` for act-warning-free tests.
4. **Fake timers** are required for notification or timer-dependent tests.
5. **Mock `createPortal`** for portal-rendered components.
6. **Wrap with NotificationProvider** when testing notification-dependent code.

## Vitest Project Assignment

Tests are split into 9 projects in `vitest.config.ts` to prevent OOM. New test files are automatically assigned to a project based on their file path:

- `tests/unit/src/lib/components/**` → `unit:components`
- `tests/unit/src/lib/utils/**` → `unit:utils`
- `tests/unit/src/lib/db/**` → `unit:db`
- `tests/unit/src/lib/hooks/**` → `unit:hooks`
- `tests/unit/src/lib/metadata/**` → `unit:metadata`
- `tests/unit/src/app/api/**` → `unit:api`
- `tests/unit/src/app/**` (non-api) → `unit:app`
- `tests/integration/**` → `integration`
- Everything else → `unit:other`

Run a single project: `npx vitest run --project unit:utils`

## Task Summary Requirement

When implementation begins, create a task summary in `.ignore/tasks/` using the task-lifecycle skill. Include:

- Source files affected and their test file locations
- Whether new test files are needed (check with `npm run test:enforce`)
- Timer/notification/portal mocking requirements

## Hard Rule Verification

After implementation, `npm test` must produce zero act() warnings and zero failures.

Before saying "done" or "all done", agents must run both `npm run health:check` and `npm test`.
