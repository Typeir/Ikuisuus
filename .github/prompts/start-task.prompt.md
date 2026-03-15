---
description: 'Start a new implementation task — analyzes architecture, creates agile task summary'
agent: 'agent'
---

# Start Task

You are beginning a new implementation task. Follow this workflow exactly:

## Step 1: Identify Architecture Domains

Based on the user's request, determine which architecture domains are relevant:

- **MDX content**: files in `src/content/`, `src/lib/components/mdx/`
- **JSDoc/code style**: any `.ts`/`.tsx` file in `src/`
- **SCSS/theme**: `.scss` files, `globals.scss`, styled components
- **Testing**: `tests/` directory, test files
- **Metadata**: `scripts/metadata/`, `scripts/core/`, API routes
- **World sim**: `src/lib/components/worldSim/`
- **Build pipeline**: `scripts/` build/content processing
- **Encounter module**: encounter planner components

## Step 2: Read Architecture Docs

For each relevant domain, read the corresponding documentation:

| Domain    | Read These                                                         |
| --------- | ------------------------------------------------------------------ |
| MDX       | `.github/docs/content-system.md`                                   |
| JSDoc     | `.github/docs/jsdoc.md`                                            |
| SCSS      | `.github/docs/scss-theme-rules.md`, `.github/docs/theme-system.md` |
| Testing   | `.github/docs/testing-rules.md`                                    |
| Metadata  | `.github/docs/metadata-generation.md`                              |
| World sim | `.github/docs/world-sim-module.md`                                 |
| Build     | `.github/docs/build-pipeline.md`                                   |
| Encounter | `.github/docs/encounter-module.md`                                 |

## Step 3: Scan Affected Files

Use search tools to identify files that will be modified. For each, note:

- Current line count
- JSDoc compliance
- Test file existence

## Step 4: Create Task Summary

Create a file in `.ignore/tasks/` following the format in `.github/skills/task-lifecycle/SKILL.md`.

**Filename**: `{YYYY-MM-DD-HHMMSS}-{kebab-task-title}.md`

Use the current timestamp. Include ALL required sections with real analysis data.

## Step 5: Report

Tell the user what task file was created and summarize the scope.
