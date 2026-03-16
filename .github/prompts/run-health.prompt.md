---
description: 'Run the mandatory code health gate — checks file length, CSS, JSDoc, antipatterns, tests'
agent: 'agent'
---

# Run Health Check

Execute the mandatory code health gate. This MUST run before any task can be marked complete.

## Step 1: Run Composite Health Check

```bash
npm run health:check
```

If the composite script is not available, run each check individually:

```bash
node .github/scripts/check-file-length.mjs
node .github/scripts/check-duplicate-css.mjs
node .github/scripts/check-jsdoc-quality.mjs
node .github/scripts/check-antipatterns.mjs
node .github/scripts/check-test-gaps.mjs
npm run lint
npm test
```

## Step 2: Classify Results

For each finding, classify as:

- **CRITICAL**: build/test failures, hard-rule violations, files >250 lines, duplicate CSS, missing tests, anti-patterns
- **WARNING**: minor style suggestions, near-duplicates, non-blocking improvements

## Step 3: Update Task File

Find the latest task file in `.ignore/tasks/` and update the `## Health Check Results` section with:

- Each check name, result (PASS/FAIL), and details
- Summary counts: total checks, passed, failed, warnings

## Step 4: Report Verdict

If critical findings exist:

> "BLOCKED: {N} critical issue(s) found. Fix before completion."

If only warnings:

> "PASSED with {N} warning(s). Ready for completion audit."
