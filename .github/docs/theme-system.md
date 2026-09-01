# Theme System

CSS custom properties with `data-theme` attribute switching. Inline script prevents FOUC.

## Files

**`src/lib/constants/themes.ts`**
```typescript
export enum Theme { Dark = 'dark', Light = 'light' }
```

**`src/lib/constants/persistentData.ts`**
```typescript
export enum PersistentData { Theme = 'data-theme' }
```

**`src/lib/utils/persistentUiScript.ts`** - Generates the inline script for FOUC prevention:
```typescript
export const getPersistentUiInitScript = () => {
  // Returns IIFE that reads cookie/storage and sets data-theme before first paint
};
```

**`src/app/[locale]/layout.tsx`** - Script injected in body:
```tsx
<html lang={locale} suppressHydrationWarning>
  <body suppressHydrationWarning>
    <script dangerouslySetInnerHTML={{ __html: getCombinedInitScript() }} />
    <NextIntlClientProvider locale={locale}>
      <ResponsiveLayoutShell tree={tree}>{children}</ResponsiveLayoutShell>
    </NextIntlClientProvider>
  </body>
</html>
```

**`src/app/[locale]/globals.scss`** - CSS variable definitions:
```scss
// 1. Theme variables BEFORE Tailwind
:root { --color-bg: #111217; /* dark defaults */ }
html[data-theme="light"] { --color-bg: #ffffff; /* ... */ }
html[data-theme="dark"] { --color-bg: #111217; /* ... */ }

// 2. Tailwind imports
@tailwind base;
@tailwind components;
@tailwind utilities;

// 3. Overrides in @layer base
@layer base {
  strong, b { font-weight: 700; }
}
```

**`src/styles/prose-theme.ts`** - Tailwind typography integration:
```typescript
export const proseTheme = {
  DEFAULT: {
    css: {
      '--tw-prose-body': 'var(--color-text)',
      '--tw-prose-links': 'var(--color-accent)',
      // Maps all --tw-prose-* vars to --color-* vars
      'blockquote strong': { color: 'var(--color-emphasis)' }, // Fix inheritance
    },
  },
};
```

**`tailwind.config.ts`**
```typescript
import { proseTheme } from './src/styles/prose-theme';
export default {
  theme: { extend: { typography: proseTheme } },
  plugins: [require('@tailwindcss/typography')],
};
```

**`src/lib/components/themeSelector/themeSelector.tsx`** - UI component:
```tsx
export const ThemeSelector = ({ defaultTheme, onThemeChange }) => {
  // Cycles through themes using rangeWrap
  // Calls onThemeChange(newTheme) when clicked
  // Parent handles DOM updates and localStorage persistence
};
```

## Flow

1. Server renders HTML without `data-theme`
2. Inline script reads `localStorage('data-theme')`, sets attribute before paint
3. CSS applies `html[data-theme="dark"]` variables → no flash
4. React hydrates, ThemeSelector reads DOM attribute
5. User clicks → parent updates DOM → saves to localStorage → updates state

## Key Patterns

**Read theme**: `document.documentElement.getAttribute('data-theme')` (DOM is source of truth)

**Set theme** (order matters):
```tsx
document.documentElement.setAttribute('data-theme', newTheme);  // 1. Visual
localStorage.setItem(PersistentData.Theme, newTheme);           // 2. Persist
setCurrentTheme(newTheme);                                      // 3. State
```

**Blockquote colors**: Don't set `color` on parent (cascades to children). Use `@layer base` with `!important` on children:
```scss
@layer base {
  .prose blockquote strong { color: var(--color-emphasis) !important; }
}
```

**Server components**: Use CSS variables directly `style={{ color: 'var(--color-text)' }}`

## Troubleshooting

- **Theme flash**: Script must be in `<body>` before React components
- **Hydration warning**: Add `suppressHydrationWarning` to `<html>` and `<body>`
- **Colors not updating**: Use `html[data-theme="..."]` (not `[data-theme]`)
- **Prose colors wrong**: Override in `@layer base` after Tailwind imports

## Related Documentation

- [Build Pipeline](./build-pipeline.md) - Pre-init stages and asset processing
- [Metadata Generation](./metadata-generation.md) - Three-layer metadata system
- [Content System](./content-system.md) - MDX architecture and routing
