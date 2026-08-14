---
description: 'Add tests for a source file — scaffolds test file with proper mocking and coverage'
agent: 'agent'
---

# Add Test

Create tests for a source file following project conventions.

## Step 1: Identify Target

From the user's request, determine:

- **Source file** to test
- **Test type**: unit (`tests/unit/src/`) or integration (`tests/integration/src/`)
- **Current coverage**: check if a test file already exists

## Step 2: Read Architecture Docs

1. Read `.github/docs/testing-rules.md` for all testing patterns (act warnings, fake timers, providers, mocks).
2. Scan the source file to understand its exports, dependencies, and behavior.

## Step 3: Determine Mock Requirements

Based on the source file's imports, identify which mocks are needed:

- **next-intl**: Mock `useTranslations` if the component uses translations
- **createPortal**: Mock if the component uses React portals
- **NotificationProvider**: Wrap if the component triggers notifications
- **Fake timers**: Required if the component uses `setTimeout`, `setInterval`, or notification timing
- **fetch/API**: Mock if the component calls API routes

## Step 4: Create Test File

Create the test in the mirrored path under `tests/unit/src/` (or `tests/integration/src/`):

- `@fileoverview` JSDoc — dry caveman technical. No philosophy/prose/poetry/allegory/bible. If caveman can't explain, strict ASD-STE100
- Mirror the source file structure
- Use `describe` blocks matching exported functions/components
- Use `userEvent.setup()` for user interactions (never bare `fireEvent`)
- Cover: rendering, key interactions, edge cases, error states

## Step 5: Verify

1. Run the specific test: `npx vitest run {test-file-path}`
2. Confirm zero act() warnings in output
3. Run `npm test` for full suite — zero warnings, zero failures
