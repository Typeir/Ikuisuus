---
name: task-lifecycle
description: >
  Manages the agile task lifecycle for Copilot workflows. Creates timestamped task
  summary files in .ignore/tasks/ with agile methodology sections (Description,
  Definition of Done, Acceptance Criteria, Milestones, Checklist). Also validates
  task completion by reading the latest task file and checking all items.
---

# Task Lifecycle Skill

## Purpose

This skill enforces structured task planning and completion tracking for every
implementation session. It produces machine-readable markdown artifacts that the
completion reconciliation loop can verify.

## When to Use

- **At implementation start**: Generate a new task summary in `.ignore/tasks/`
- **At completion**: Read the latest task file and verify all checklist items
- **During remediation**: Update the task file with remediation notes

## Task File Convention

**Filename format**: `YYYY-MM-DD-HHMMSS-{kebab-task-title}.md`

Example: `2026-03-14-153045-add-spell-metadata-filter.md`

## Required Sections

Every task file MUST contain these sections, formatted exactly as shown:

```markdown
# Task: {Title}

**Created**: {ISO timestamp}
**Status**: {NOT_STARTED | IN_PROGRESS | BLOCKED | COMPLETED | FAILED}
**Owner**: {agent name or "user"}
**Related Files**: {comma-separated list of affected files}

---

## Description

{1-3 paragraph description of what this task accomplishes and why}

## Scope

- **In Scope**: {bullet list of what IS included}
- **Out of Scope**: {bullet list of what is explicitly excluded}

## Architecture Analysis

{Summary of which architecture domains are relevant — reference the specific
.github/instructions/_.instructions.md files and .github/docs/_.md docs consulted}

## Definition of Done (DoD)

{Bullet list of conditions that must ALL be true for this task to be complete}

- [ ] All code changes compile without errors
- [ ] All modified files have JSDoc on exported declarations
- [ ] No inline comments in modified function bodies
- [ ] No color literals outside globals.scss in modified files
- [ ] Tests exist for all modified source files
- [ ] `npm test` passes with zero act() warnings
- [ ] Files stay under 250 lines (or have documented exception)
- [ ] {task-specific DoD items}

## Acceptance Criteria

{Numbered list of user-facing behaviors that verify the task is correct}

1. {Given X, when Y, then Z}
2. {Given A, when B, then C}

## Milestones

{Ordered list of major implementation checkpoints}

- [ ] M1: {milestone description}
- [ ] M2: {milestone description}
- [ ] M3: {milestone description}

## Checklist

{Granular implementation steps — each should be checkable}

- [ ] {Step 1}
- [ ] {Step 2}
- [ ] {Step 3}

## Health Check Results

{Populated after health checks run — leave empty at creation}

## Notes

{Any additional context, decisions, or blockers encountered}
```

## Completion Validation

When validating a task file, check:

1. **Status** is `COMPLETED`
2. **All DoD items** are checked (`[x]`)
3. **All Milestones** are checked (`[x]`)
4. **All Checklist items** are checked (`[x]`)
5. **Health Check Results** section is populated with pass/fail outcomes
6. If any are unchecked, return the list of incomplete items for remediation

## Machine-Readable Markers

The skill uses these markers for automated parsing:

- `**Status**:` line — parsed for lifecycle state
- `- [ ]` — unchecked item (incomplete)
- `- [x]` — checked item (complete)
- `## Health Check Results` — section boundary for health data injection
- `**Related Files**:` — parsed for file impact analysis
