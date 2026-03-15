---
description: 'Full workflow — analyze, implement, health-check, and report in one pass'
agent: 'agent'
---

# Full Task Workflow

Execute the complete A→B→C workflow in sequence. This prompt orchestrates all three phases.

## Phase A: Analysis & Task Summary

1. Read the user's request carefully.
2. Identify relevant architecture domains from the request.
3. Read the corresponding `.github/docs/*.md` documentation.
4. Scan affected files for current state (line counts, JSDoc, tests).
5. Create a timestamped task summary in `.ignore/tasks/` following `.github/skills/task-lifecycle/SKILL.md`.

## Phase B: Implementation + Health Gate

1. Implement the requested changes following ALL hard rules from `.github/copilot-instructions.md`.
2. Update the task file checklist as items are completed.
3. After implementation, run the health gate:
   ```bash
   npm run health:check
   ```
4. Record health results in the task file.
5. If CRITICAL failures exist, fix them and re-run health checks until clean.

## Phase C: Reconciliation & Report

1. Re-read the task file and verify ALL items are checked.
2. Fix any remaining gaps.
3. Update task Status to `COMPLETED`.
4. Generate a detailed completion report in `.ignore/reports/`.
5. Report final status to the user.

## Constraints

- Do NOT skip any phase.
- Do NOT mark items checked until they are actually done.
- If health checks fail, you MUST fix the issues before proceeding to Phase C.
- The completion report MUST reference the task file and include all health check results.
