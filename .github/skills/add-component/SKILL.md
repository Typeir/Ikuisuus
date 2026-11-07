---
name: add-component
description: >
  Scaffold a React component in the correct Ikuisuus tree. Picks
  modules/library presentation vs lib/components primitive, enforces folder
  structure, the five required JSDoc header tags, CSS-module theming, MDX
  registration through both barrels, and the mirrored test file.
---

# Add Component

## Purpose

Creates one component plus its styles, barrel, registration, and test. Placement
is the usual failure: MDX-visible components live in the library module, not in
`src/lib/components/`.

## 1. Choose the Tree

| Need | Path | Notes |
| --- | --- | --- |
| Usable in `.mdx` as `<Tag />` | `src/modules/library/presentation/components/{PascalCase}/` | Registered in the MDX component map |
| Renders a content type from frontmatter/slots | `src/modules/library/presentation/components/slots/{type}/` | Spread through `slotComponents` in `slots/index.ts` |
| Generic primitive for app code | `src/lib/components/ui/{camelCase}/` | Exported from `src/lib/components/ui/index.ts` |
| Single-consumer visual widget | `src/lib/components/{feature}/` | Not MDX-visible |

Folders are PascalCase inside the library module, camelCase inside
`src/lib/components`. Match the sibling folder, never invent casing.

## 2. Requirements

Establish before writing:

- Tag name used in MDX (PascalCase)
- Props and their types
- Interactivity: events, hooks, browser APIs
- Translations: namespace under `messages/{locale}/`
- Whether content needs it (registration) or only app code (no registration)

## 3. Files

```
{Name}/
  {Name}.tsx
  {Name}.module.scss
  index.ts
```

`index.ts` re-exports the component and its prop types:

```typescript
export { Name } from './Name';
export type { NameProps } from './Name';
```

## 4. JSDoc

Header carries all five tags. Missing any fails `health:check`.

```tsx
/**
 * @fileoverview One sentence on what the component renders.
 * @description Optional second sentence on behaviour or data source.
 *
 * @module modules/library/presentation/components/Name/Name
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react
 * @requires next-intl
 *
 * @example
 * ```mdx
 * <Name value='x' />
 * ```
 */
```

Props use `@typedef` + `@property`, component uses `@component` + `@param`.
`@module` path drops the `src/` prefix. No inline comments anywhere.

## 5. Client Boundary

Declare `'use client'` when the component uses hooks, events, refs, or browser
APIs. Most MDX components are client components; do not force a server component
that needs interactivity. Keep the directive directly under the header block.

## 6. Styling

- CSS module next to the component, imported as `styles`
- Colours only through `var(--color-*)` from `globals.scss`; no hex, rgb, hsl
- Tailwind class names only for layout utilities, never for colour
- Constants for sizes in SCSS, class names composed with template literals

## 7. Registration

MDX-visible components need both barrels:

```typescript
// src/modules/library/presentation/components/{Name}/index.ts
export { Name } from './Name';

// src/modules/library/presentation/components/index.tsx
import { Name } from './Name';

export const components = {
  Name,
  // ...
};
```

Sibling imports in `index.tsx` are relative; cross-module imports use `@/`.

## 8. Test

`tests/unit/src/{mirror of source path}.test.tsx`. See the `add-test` skill.
`npm run test:enforce` fails when a source file has no test.

## 9. Verify

```bash
npm run test:file -- tests/unit/src/modules/library/presentation/components/{Name}/{Name}.test.tsx
npm run health:check
```
