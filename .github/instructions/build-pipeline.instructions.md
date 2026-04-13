---
applyTo: 'scripts/build/**,scripts/assets/**,scripts/content/**,scripts/i18n/**'
---

# Build Pipeline Architecture Analysis

Before modifying build scripts or pipeline stages, you MUST:

1. **Read** `.github/docs/build-pipeline.md` for the full pipeline architecture (6 stages, dependency graph, extension points).
2. **Pipeline order is critical**: compress-assets → kebabify-content → md-to-mdx → generate-metadata → merge-locales → find-reusable-mdx-outliers. Stages have dependencies — do not reorder.
3. **`npm run pre-init`** runs the full pipeline. It must succeed before `npm run dev` or `npm run build`.
4. **Asset compression** (Stage 1) uses Sharp for WebP conversion to `public/library/`. Never reference `public/full-size/` in content.
5. **Kebabify** (Stage 2) normalizes filenames to kebab-case in `src/content/`. Uses `toKebabCase` utility.
6. **Metadata generation** (Stage 4) uses the `src/lib/metadata/` shared module. All generators are TypeScript in `scripts/metadata/*.ts`. Use `runGenerator()` from `@/lib/metadata` for new generators.

## Key Files

- `scripts/assets/compressAssets.ts` — Stage 1
- `scripts/content/kebabifyContent.ts` — Stage 2
- `scripts/content/mdToMdx.ts` — Stage 3
- `scripts/metadata/generateMetadata.ts` — Stage 4 orchestrator
- `scripts/i18n/mergeMessages.ts` — Stage 5
- `scripts/content/findReusableMdxOutliers/index.ts` — Stage 6

## Task Summary Requirement

When implementation begins, create a task summary in `.ignore/tasks/` using the task-lifecycle skill. Include:

- Which pipeline stage(s) are affected
- Upstream/downstream dependency impact
- Whether `pre-init` execution order changes

## Hard Rule Verification

After changes, run `npm run pre-init` and verify all stages complete without errors. Then `npm run build` must succeed.
