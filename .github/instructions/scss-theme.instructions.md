---
applyTo: 'src/**/*.scss,src/**/*.module.scss,src/app/**/globals.scss,src/**/*.tsx'
---

# SCSS Theme Architecture Analysis

Before modifying any SCSS or styled component, you MUST:

1. **Read** `.github/docs/scss-theme-rules.md` for the theme token rules (NO color literals outside `globals.scss`).
2. **Read** `.github/docs/theme-system.md` for CSS variable architecture, FOUC prevention, and cascade order.
3. **ALL colors** must use CSS variables: `var(--color-*)`. No hex, rgb, rgba, hsl, hsla, or named colors.
4. **New color tokens** go ONLY in `src/app/[locale]/globals.scss` under `:root`, `[data-theme='light']`, and `[data-theme='dark']`.
5. **Cascade order** in globals.scss: SCSS variables → theme variables → Tailwind imports → `@layer base` overrides.

## Task Summary Requirement

When implementation begins, create a task summary in `.ignore/tasks/` using the task-lifecycle skill. Include:

- Whether new color tokens are needed and where they'll be defined
- CSS specificity impact assessment
- Theme consistency check (light + dark variants)

## Hard Rule Verification

After implementation, `grep -rn "#[0-9a-fA-F]" src/ --include="*.tsx"` must return 0 results.
