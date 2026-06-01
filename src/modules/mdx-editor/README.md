# mdx-editor Module

Public entry: import from @/modules/mdx-editor only.

Boundary rules:

- External modules must not import from internal subpaths under application, domain, infrastructure, or presentation.
- Keep i18n namespace as mdxEditor.
- Next.js app route files under src/app/api and app pages should re-export or consume from this barrel.

Internal layout:

- domain: shared types and pure editor commands
- application: hooks and use-cases
- infrastructure: API clients, GitHub primitives, route handlers
- presentation: React UI components and SCSS modules
