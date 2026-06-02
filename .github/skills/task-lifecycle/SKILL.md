---
name: task-lifecycle
description: >
  Agile task lifecycle. Creates task summaries in .ignore/tasks/ with
  Description, DoD, Acceptance Criteria, Milestones, Checklist. Validates
  completion by verifying all items checked.
---

# Task Lifecycle Skill

## Purpose

Structured task planning + completion tracking. Machine-readable markdown artifacts
for completion reconciliation loop.

## When to Use

- At start: Generate new task summary in `.ignore/tasks/`
- At completion: Read latest task file, verify all checklist items
- During remediation: Update task file with remediation notes

## Task File Convention

Filename: `YYYY-MM-DD-HHMMSS-{kebab-task-title}.md`

Example: `2026-03-14-153045-add-spell-metadata-filter.md`

## Required Sections

Every task file MUST have ALL sections, exactly formatted:

```markdown
# Task: {Title}

**Created**: {ISO timestamp}
**Status**: {NOT_STARTED | IN_PROGRESS | BLOCKED | COMPLETED | FAILED}
**Owner**: {agent name or "user"}
**Related Files**: {comma-separated list}

---

## Description

{1-3 paragraphs: what, why}

## Scope

- **In Scope**: {bullet list}
- **Out of Scope**: {bullet list}

## Architecture Analysis

{Summary of domains. Reference specific .github/instructions/_.instructions.md
and .github/docs/_.md consulted}

## Definition of Done (DoD)

{Conditions ALL must be true for completion}

- [ ] Compile without errors
- [ ] JSDoc on exports
- [ ] No inline comments
- [ ] No color literals outside globals.scss
- [ ] Tests exist for modified source
- [ ] `npm test` passes, zero act() warnings
- [ ] Files stay <250 lines (or documented exception)
- [ ] {task-specific DoD items}

## Acceptance Criteria

{Numbered list: user-facing behaviors verify correctness}

1. Given X, when Y, then Z
2. Given A, when B, then C

## Milestones

{Ordered checkpoints}

- [ ] M1: {description}
- [ ] M2: {description}
- [ ] M3: {description}

## Checklist

{Granular steps, each checkable}

- [ ] {Step 1}
- [ ] {Step 2}
- [ ] {Step 3}

## Health Check Results

{Empty at creation, populated after checks run}

## Notes

{Context, decisions, blockers}
```

## Completion Validation

To validate task:

1. Status = `COMPLETED`
2. ALL DoD items checked (`[x]`)
3. ALL Milestones checked (`[x]`)
4. ALL Checklist items checked (`[x]`)
5. Health Check Results populated with pass/fail
6. If any unchecked → return list for remediation

## Machine-Readable Markers

- `**Status**:` line — parsed for lifecycle state
- `- [ ]` — unchecked (incomplete)
- `- [x]` — checked (complete)
- `## Health Check Results` — section boundary
- `**Related Files**:` — parsed for file impact
