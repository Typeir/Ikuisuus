---
name: add-test
description: >
  Add tests for an Ikuisuus source file. Mirrored path under tests/unit or
  tests/integration, five-tag JSDoc header, next-intl mock via intlMock, act-clean
  userEvent patterns, and the test:enforce coverage gate.
---

# Add Test

## Purpose

Creates the test file `test:enforce` demands and keeps the suite act-clean.
Placement is mechanical: path mirrors the source path.

## 1. Target

| Source | Unit test | Integration test |
| --- | --- | --- |
| `src/x/y.ts` | `tests/unit/src/x/y.test.ts` | `tests/integration/src/x/y.test.ts` |
| `src/x/y.tsx` | `tests/unit/src/x/y.test.tsx` | `tests/integration/src/x/y.test.tsx` |

`tests/scripts/enforceCoverage.ts` accepts either. It ignores `.d.ts`, `*.config.*`,
`index.*`, `types.*`, `*.stories.*`, `*.module.scss`.

Use integration only when the test crosses a real boundary: route handler plus
repository, content files on disk, multi-provider mounting.

## 2. Header

All five tags, one sentence each:

```typescript
/**
 * @fileoverview {Name} tests
 * @description What behaviour the cases cover.
 *
 * @module tests/unit/src/{mirror path}
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */
```

## 3. Imports

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
```

Vitest globals are not enabled; import every helper you use.

## 4. next-intl

Never hand-write `useTranslations`. Use the real-catalogue mock:

```typescript
vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});
```

The mock reads `messages/en/*.json` and interpolates `{param}`. A key missing from
those files resolves to the key text, which surfaces translation gaps as test
failures.

## 5. Providers

- `tests/setup/renderWithActiveSheet.tsx` — components reading the active sheet context
- `tests/setup/serverOnlyStub.ts` — modules importing `server-only`
- `tests/setup/vitest.setup.ts` — global setup, do not duplicate matchers

## 6. Interaction

`userEvent.setup()` for everything that touches state:

```typescript
const user = userEvent.setup();
await user.click(screen.getByRole('button', { name: 'Save' }));
```

`fireEvent` is allowed only for events that cannot change state, such as
`fireEvent.blur` on an uncontrolled input or scroll/resize dispatch. Bare
`fireEvent.click` on a handler that calls `setState` produces an act warning and
fails the suite.

Timers: `vi.useFakeTimers()`, advance with `await act(async () => { await vi.advanceTimersByTimeAsync(ms); })`,
restore in `afterEach`. Never mix fake timers with `userEvent` unless `advanceTimers` is wired.

## 7. Shape

- `describe` per exported symbol, `it` per behaviour
- Cover render, key interaction, edge case, error state
- Query by role and accessible name; `getByTestId` only when no role exists
- Assert user-visible output, not implementation details

## 8. Run

```bash
npm run test:file -- tests/unit/src/{path}.test.tsx
npm run test:components     # all component tests
npm run test:modules        # all module tests
npm test                    # enforce gate, then full suite
```

`npm test` runs `test:enforce` first through `pretest`. A source file without a
test fails before any test executes.

## 9. Done

- Target test passes
- No act warnings in output
- `npm run test:enforce` passes
