---
applyTo: 'src/content/**/*.mdx,src/lib/components/mdx/**'
---

# MDX Content Architecture Analysis

Before modifying any MDX content or MDX component, you MUST:

1. **Read** `.github/docs/content-system.md` for the full content architecture (filesystem routing, locale handling, MDX compilation).
2. **Verify** file naming: kebab-case only, `.mdx` extension, `.sheet.mdx` for monster stat blocks.
3. **Check locale mirroring**: changes to `src/content/en/` must be mirrored in `es/` and `fi/` if translations exist.
4. **Confirm component registration**: any new MDX component must be registered in `src/lib/components/mdx/index.tsx`.
5. **Run `npm run pre-init`** after content changes to regenerate metadata and merge locales.

## Task Summary Requirement

When implementation begins, create a task summary in `.ignore/tasks/` using the task-lifecycle skill. Include:

- Which MDX files are affected and their locale coverage
- Whether metadata generators need updating
- Component registration changes if any
- Build pipeline impact assessment

## Critical Checks

- No color literals in TSX components (use CSS variables from `globals.scss`)
- JSDoc on all component declarations
- Monster `.sheet.mdx` files must parse correctly with metadata generators
