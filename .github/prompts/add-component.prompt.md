---
description: 'Add a new React component — scaffolds file, styles, JSDoc, test, and MDX registration'
agent: 'agent'
---

# Add Component

Scaffold a new React component following project conventions.

## Step 1: Gather Requirements

From the user's request, determine:

- **Component name** (PascalCase)
- **Location** (which feature area in `src/lib/components/`)
- **Client or Server** — default to server component unless interactivity is needed
- **MDX usage** — whether it should be registered in `src/lib/components/mdx/index.tsx`

## Step 2: Read Architecture Docs

1. Read `.github/docs/jsdoc.md` for JSDoc requirements.
2. Read `.github/docs/scss-theme-rules.md` for styling rules ( NO color literals, CSS variables only).
3. If the component will be used in MDX, read `.github/docs/content-system.md` for the registration pattern.

## Step 3: Create the Component

Create the following files:

1. **Component file** (`{componentName}.tsx`):
   - `@fileoverview` JSDoc at top
   - `@component` tag with `@param` for each prop
   - Use CSS modules for styling (`.module.scss`)
   - Use `'use client'` directive ONLY if needed for interactivity

2. **Styles** (`{componentName}.module.scss`):
   - All colors via CSS variables (`var(--color-*)`)
   - No color literals (#hex, rgb, hsl)

3. **Barrel export** in the nearest `index.ts`

## Step 4: Register in MDX (If Applicable)

If the component should be available in `.mdx` files, add it to the component map in `src/lib/components/mdx/index.tsx`.

## Step 5: Create Test File

Create a test file in the mirrored location under `tests/unit/src/` following `.github/docs/testing-rules.md` patterns:

- Use `@testing-library/react` with `userEvent.setup()`
- Wrap with necessary providers
- Cover core rendering and key interactions

## Step 6: Verify

- Run `npm test` — zero act() warnings, zero failures
- Run `npm run health:check` — no critical findings
