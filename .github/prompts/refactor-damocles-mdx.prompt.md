---
description: 'Refactor an existing Damocles MDX file — normalize structure, fix tone, remove redundancy'
mode: 'agent'
---

# Refactor Damocles MDX

You are refactoring an existing MDX file for the Damocles setting.

## Step 1: Identify Target

Use the currently open file, or ask the user to specify a file path.

## Step 2: Determine Scope

Ask the user which refactor scope to apply:

| Scope            | Effect                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| `structure-only` | Fix headings, knowledge tiers, separators, formatting only             |
| `tone-only`      | Fix generic phrases, tighten prose, remove filler only                 |
| `full`           | All audit categories — structure, tone, naming, formatting, redundancy |

If the user does not specify, default to `full`.

## Step 3: Invoke Refactor Workflow

Load the Damocles Refactor agent's workflow by reading these skills in order:

1. `.github/skills/damocles-lore/SKILL.md`
2. `.github/instructions/mdx-content.instructions.md`
3. `.github/skills/damocles-page-types/SKILL.md`

Then follow the Damocles Refactor agent's full workflow:

- Create task file in `.ignore/tasks/`
- Read the target file completely
- Audit for issues (structure, tone, naming, formatting, redundancy, lore flags)
- Apply fixes in priority order
- Flag lore concerns with inline markers

## Step 4: Report

Output:

- Summary of issues found (by category)
- Changes made (with before/after for significant rewrites)
- All `[UNCERTAIN]` / `[POSSIBLE CONTRADICTION]` / `[NEEDS SOURCE]` flags
- Issues NOT addressed and why

Apply the changes to the file, or present a diff for the user to review.
