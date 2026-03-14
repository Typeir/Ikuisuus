---
applyTo: 'scripts/metadata/**,scripts/core/shared-utils.mjs,scripts/core/shared-data.json,src/app/api/**'
---

# Metadata Generation Architecture Analysis

Before modifying metadata generators or API routes, you MUST:

1. **Read** `.github/docs/metadata-generation.md` for the three-layer architecture (build → API → client).
2. **Shared utilities** live in `scripts/core/shared-utils.mjs` — use `MetadataGeneratorUtils.runGenerator()` for new generators.
3. **Game data** comes from `scripts/core/shared-data.json` — single source of truth for damage types, conditions, abilities, spell schools.
4. **API routes** use `getContentFolder(locale)` helper for paths and flatten arrays with `.flat()` for multi-variant files.
5. **Client layer** uses `MetadataTable` generic component with specialized wrappers.
6. **Run `npm run generate-metadata`** after changes to verify output.

## Task Summary Requirement

When implementation begins, create a task summary in `.ignore/tasks/` using the task-lifecycle skill. Include:

- Which layer(s) are affected (build/API/client)
- Schema changes and their downstream impact
- Whether `.metadata.json` output format changes

## Validation

After implementation, run `npm run generate-metadata` and verify `.metadata.json` files are correct.
