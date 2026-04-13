---
applyTo: 'scripts/metadata/**,scripts/core/shared-data.json,src/lib/metadata/**,src/app/api/**'
---

# Metadata Generation Architecture Analysis

Before modifying metadata generators or API routes, you MUST:

1. **Read** `.github/docs/metadata-generation.md` for the three-layer architecture (build → API → client).
2. **Shared utilities** live in `src/lib/metadata/` — use `runGenerator()` exported from `@/lib/metadata` for new generators.
3. **Game data** comes from `scripts/core/shared-data.json` — loaded via `loadSharedData()` from `@/lib/metadata`.
4. **API routes** use `getContentFolder(locale)` helper for paths and flatten arrays with `.flat()` for multi-variant files.
5. **Client layer** uses `MetadataTable` generic component with specialized wrappers.
6. **Run `npm run generate-metadata`** after changes to verify output.
7. **All generators are TypeScript** in `scripts/metadata/*.ts` and import from `@/lib/metadata`.

## Task Summary Requirement

When implementation begins, create a task summary in `.ignore/tasks/` using the task-lifecycle skill. Include:

- Which layer(s) are affected (build/API/client)
- Schema changes and their downstream impact
- Whether `.metadata.json` output format changes

## Validation

After implementation, run `npm run generate-metadata` and verify `.metadata.json` files are correct.
