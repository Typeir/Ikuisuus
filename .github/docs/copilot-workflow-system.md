# Copilot Workflow System

> Complete guide to the enforced A→B→C agentic workflow: Analysis → Health Gate → Completion Reconciliation.

## Overview

Every implementation task follows a mandatory three-phase lifecycle:

```
Phase A: Analysis & Task Summary
  └─ Scoped architecture analysis
  └─ Agile task file created in .ignore/tasks/

Phase B: Implementation + Health Gate
  └─ Code changes with hard-rule compliance
  └─ Mandatory health check (5 sub-checks)
  └─ Results recorded in task file

Phase C: Completion Reconciliation & Report
  └─ All checklist/DoD/milestone items verified
  └─ Remediation loop if incomplete
  └─ Timestamped report in .ignore/reports/
```

## Architecture

### Customization Files

| Type         | Location                                 | Purpose                                                                                            |
| ------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Instructions | `.github/instructions/*.instructions.md` | Architecture-scoped analysis (auto-match via `applyTo`)                                            |
| Agents       | `.github/agents/*.agent.md`              | Role-separated agents (analyzer, implementer, health-reviewer, completion-auditor)                 |
| Skills       | `.github/skills/task-lifecycle/SKILL.md` | Task artifact format and lifecycle validation                                                      |
| Prompts      | `.github/prompts/*.prompt.md`            | User-invokable workflows (`/start-task`, `/run-health`, `/reconcile-completion`, `/full-workflow`) |
| Hooks        | `.github/hooks/copilot-hooks.json`       | Deterministic enforcement (post-edit lint, on-stop health gate)                                    |

### Health Check Scripts

| Script                               | npm command                    | What it checks                           | Severity         |
| ------------------------------------ | ------------------------------ | ---------------------------------------- | ---------------- |
| `scripts/ci/health-check.mjs`        | `npm run health:check`         | Composite orchestrator                   | —                |
| `scripts/ci/check-file-length.mjs`   | `npm run health:file-length`   | Files >250 lines                         | CRITICAL         |
| `scripts/ci/check-duplicate-css.mjs` | `npm run health:duplicate-css` | Duplicate CSS selectors                  | CRITICAL         |
| `scripts/ci/check-jsdoc-quality.mjs` | `npm run health:jsdoc`         | Inline comments, color literals, alert() | CRITICAL         |
| `scripts/ci/check-antipatterns.mjs`  | `npm run health:antipatterns`  | console.log, any type, force casts       | CRITICAL/WARNING |
| `scripts/ci/check-test-gaps.mjs`     | `npm run health:test-gaps`     | Missing test files for changed code      | CRITICAL         |

### Reconciliation Scripts

| Script                          | npm command                | Purpose                     |
| ------------------------------- | -------------------------- | --------------------------- |
| `scripts/ci/reconcile-task.mjs` | `npm run health:reconcile` | Verify task file completion |
| `scripts/ci/write-report.mjs`   | `npm run health:report`    | Generate completion report  |

---

## Critical Failure Taxonomy

These findings **block** task completion:

| Category            | Detection                       | Fix                                    |
| ------------------- | ------------------------------- | -------------------------------------- |
| Build/test failures | `npm test` exits non-zero       | Fix failing tests                      |
| Inline comments     | `grep "// "` in src/ bodies     | Extract to helper functions with JSDoc |
| Color literals      | `#hex` in `.tsx` files          | Use `var(--color-*)` from globals.scss |
| alert() calls       | `alert(` in src/                | Use NotificationProvider               |
| Files >250 lines    | Line count check                | Split into smaller modules             |
| Duplicate CSS       | Exact selector+properties match | Extract to mixin or shared class       |
| console.log         | `console.log(` in src/          | Remove or use project logger           |
| Missing tests       | No `.test.ts` for changed `.ts` | Create test file                       |

## Warning Taxonomy

These findings are **reported but do not block**:

| Category             | Detection                       | Recommendation                 |
| -------------------- | ------------------------------- | ------------------------------ |
| Hardcoded setTimeout | Numeric literal in setTimeout   | Extract to named constant      |
| Explicit `any` type  | `: any` in source               | Use specific type or `unknown` |
| Force cast `as any`  | `as any` in source              | Use type narrowing             |
| Near-duplicate CSS   | Similar but not identical rules | Consider consolidation         |

---

## Usage

### Quick Start (Single Command)

Type `/full-workflow` in Copilot chat to run all three phases automatically.

### Step-by-Step

1. **Start task**: Type `/start-task` or use `@Analyzer` agent
2. **Implement**: Make code changes (or use `@Implementer` agent)
3. **Health check**: Type `/run-health` or use `@HealthReviewer` agent
4. **Complete**: Type `/reconcile-completion` or use `@CompletionAuditor` agent

### Manual Health Check

```bash
npm run health:check          # All checks
npm run health:file-length    # Just file length
npm run health:jsdoc          # Just JSDoc/hard rules
npm run health:reconcile      # Verify task completion
npm run health:report         # Generate report
```

---

## File-Length Allowlist

Files that are permitted to exceed 250 lines can be added to `.github/file-length-allowlist.json`:

```json
["src/app/[locale]/globals.scss"]
```

Each entry must be reviewed in PRs and should include a justification comment in the PR description.

---

## Override Protocol

If critical issues cannot be resolved immediately:

1. Use `@CompletionAuditor` and say "override" or "force complete"
2. The report will be generated with Status `COMPLETED_WITH_OVERRIDE`
3. Unchecked items appear in a `## Overridden Items` section
4. These should be tracked as tech debt and resolved in a follow-up task

---

## Extending the System

### Adding a New Health Check

1. Create `scripts/ci/check-{name}.mjs` following the existing pattern (JSON output, exit code 0/1)
2. Add entry to the `CHECKS` array in `scripts/ci/health-check.mjs`
3. Add npm script: `"health:{name}": "node scripts/ci/check-{name}.mjs"`
4. Update this doc's tables

### Adding a New Architecture Domain

1. Create `.github/instructions/{domain}.instructions.md` with `applyTo` glob
2. Create or update the corresponding `.github/docs/{domain}.md`
3. Add the domain to the Analyzer agent's domain mapping table

### Adding a New Agent

1. Create `.github/agents/{name}.agent.md` with tools list and instructions
2. Add to the handoff documentation in agent instructions
3. Update the prompt files if the agent participates in the workflow

---

## Hooks (Preview)

The hooks in `.github/hooks/copilot-hooks.json` use VS Code Copilot's preview hook system:

- **PostToolUse**: Runs quick lint after every file edit/create to catch hard-rule violations early
- **Stop**: Runs the full health gate before a session ends — blocks on critical failures

These are deterministic (not model-dependent) and provide the strongest enforcement guarantee.
