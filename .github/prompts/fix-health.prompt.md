---
description: 'Fix health check failures — runs health gate, diagnoses issues, applies targeted fixes'
agent: 'agent'
---

# Fix Health Check Failures

Diagnose and fix all health check failures.

## Step 1: Run Health Gate and PAW Violations

```bash
npm run health:check
npm run paw:violations
```

Record the output of both commands.

### Health Gate

The composite gate runs these checks:

| Check         | Script                    | What It Catches                            |
| ------------- | ------------------------- | ------------------------------------------ |
| File length   | `check-file-length.mjs`   | Files exceeding line limits                |
| Duplicate CSS | `check-duplicate-css.mjs` | Redundant CSS declarations                 |
| JSDoc quality | `check-jsdoc-quality.mjs` | Missing/malformed JSDoc                    |
| Antipatterns  | `check-antipatterns.mjs`  | `alert()`, color literals, inline comments |
| Test gaps     | `check-test-gaps.mjs`     | Source files without corresponding tests   |
| MDX format    | `check-mdx-format.mjs`    | MDX structural violations                  |

### PAW Violations

`npm run paw:violations` lists any unresolved PAW enforcement violations (project-scoped or session-scoped). These must be fixed before proceeding — PAW will block tool use until they are resolved. See the PAW skill (`.github/skills/paw/SKILL.md`) for the violation lifecycle and fix strategies.

## Step 2: Classify Findings

Separate results into:

- **CRITICAL** (blocking): Must be fixed before the task can complete
- **WARNING** (non-blocking): Should be noted but do not block
- **PAW violations**: Always blocking — fix immediately per the PAW enforcement loop

## Step 3: Fix Critical Issues

For each critical finding:

1. Read the affected file
2. Read the relevant architecture doc:
   - JSDoc issues → `.github/docs/jsdoc.md`
   - CSS issues → `.github/docs/scss-theme-rules.md`
   - Test issues → `.github/docs/testing-rules.md`
   - MDX issues → `.github/skills/mdx-format/SKILL.md`
   - Antipatterns → `.github/copilot-instructions.md` (Hard Rules)
3. Apply the minimum fix required
4. Do NOT refactor surrounding code

**Suppressing a finding (false positives only):**
If the violation is a confirmed false positive (e.g. a generated file, or an intentional structural deviation), suppress it inline with a `paw:gate:` directive instead of commenting out the check:

```ts
/* paw:gate:{gate-id}:{rule} ignore */ // whole file
/* paw:gate:{gate-id} ignore-nextline */ // next line only
```

For MDX: `{/* paw:gate:content-format:missing-h1 ignore */}`

Never suppress `missing-test` — create the test file instead. See the PAW skill for full syntax.

## Step 4: Re-run Health Gate and PAW

```bash
npm run health:check
npm run paw:violations
```

Repeat Steps 3-4 until all critical issues and PAW violations are resolved.

## Step 5: Report

Summarize what was found and fixed. List any remaining warnings that were not addressed.
