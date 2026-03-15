---
description: 'Reconcile task completion — verify all checklist items, remediate if needed, generate report'
agent: 'agent'
---

# Reconcile Completion

Verify that the current task is fully complete, remediate any gaps, and generate the final report.

## Step 1: Find Latest Task File

List `.ignore/tasks/` and read the most recent file (by filename timestamp).

## Step 2: Verify Completion

Parse the task file and check:

1. **All DoD items** — every `- [ ]` under `## Definition of Done` must be `- [x]`
2. **All Milestones** — every `- [ ]` under `## Milestones` must be `- [x]`
3. **All Checklist items** — every `- [ ]` under `## Checklist` must be `- [x]`
4. **Health Check Results** — section must be populated with no CRITICAL failures
5. **Status** — must be `IN_PROGRESS` (not `BLOCKED` or `FAILED`)

## Step 3: Remediate (if needed)

If ANY items are incomplete:

1. List the incomplete items clearly.
2. For code issues: fix them directly and re-run the relevant health check.
3. For test gaps: create test files or update existing ones.
4. After fixes, re-read the task file and verify again.
5. Repeat until all items pass.

## Step 4: Generate Completion Report

After all items pass:

1. Update task file Status to `COMPLETED`.
2. Create a report in `.ignore/reports/` with filename:
   `{YYYY-MM-DD-HHMMSS}-report-{kebab-task-title}.md`
3. Include ALL sections from the Completion Auditor report template
   (see `.github/agents/completion-auditor.agent.md`).

## Step 5: Confirm

Tell the user:

> "Task COMPLETED. Report written to `.ignore/reports/{filename}`."
