# Library Module

This module owns MDX content rendering for the Library of Ikuisuus.

## Boundaries

- Public imports from outside this module must use `@/modules/library` only.
- Deep imports from `application/`, `domain/`, `infrastructure/`, or `presentation/` are internal and forbidden outside this module.
- Next.js route files remain in `src/app/[locale]/library/**` and compose exported use-cases/components.
- API route handlers remain in `src/app/api/**/route.ts` and may import pure helpers from this module.

## Out of Scope

- `src/lib/components/mdx/metadataTables/**`
- `src/lib/components/mdx/spellTable/**`
- `src/lib/db/content/**`
