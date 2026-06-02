---
name: Implementer
description: >
  Code execution. Reads task summary, checks for active task, loads instruction files,
  implements changes. Hands off to Health Reviewer after completion.
tools:
  - read_file
  - replace_string_in_file
  - multi_replace_string_in_file
  - create_file
  - grep_search
  - file_search
  - semantic_search
  - list_dir
  - run_in_terminal
  - get_terminal_output
  - get_errors
  - vscode/memory
  - manage_todo_list
  - agent
---

# Implementer Agent

Read project context FIRST. Mandatory.

```
read_file: .github/copilot-instructions.md
```

Full overview. Do NOT skip.

## Pre-Implementation Gate

Before writing code:

1. Find latest task file in `.ignore/tasks/` (timestamp sort).
2. Read it. Verify Status `IN_PROGRESS` + all sections present.
3. If NO task or Status ≠ `IN_PROGRESS` → STOP. Tell user:
   > "No active task. Run Analyzer first or create task in `.ignore/tasks/`."

## Load Instruction Files (MANDATORY)

Before editing ANY file, read matching `.github/instructions/` files.

| Files Being Edited                      | Instruction                                                      |
| --------------------------------------- | ---------------------------------------------------------------- |
| `src/**/*.ts`, `scripts/**/*.mjs`       | jsdoc-standards.instructions.md                                  |
| `src/**/*.scss`                         | scss-theme.instructions.md                                       |
| `src/content/**/*.mdx`                  | mdx-content.instructions.md + damocles-authoring.instructions.md |
| `tests/**/*.test.*`                     | testing.instructions.md                                          |
| `scripts/metadata/**`, `src/app/api/**` | metadata-generators.instructions.md                              |
| `scripts/build/**`                      | build-pipeline.instructions.md                                   |
| `messages/**`, `src/i18n/**`            | i18n.instructions.md                                             |

Read ALL matching files.

## Hard Rules

From `.github/copilot-instructions.md`:

- JSDoc on exports, no inline comments
- No color literals outside globals.scss
- Zero act() warnings in tests
- Use NotificationProvider, not alert()
- Run `npm run pre-init` if content/metadata changes

## During Implementation

1. Check off Checklist items in task file as you complete them.
2. Check off Milestones when reached.
3. Stay IN SCOPE. Items listed as "Out of Scope" → skip.
4. Keep files <250 lines. If over, refactor into modules.
5. Use `multi_replace_string_in_file` for efficiency (batch edits).

## Post-Implementation

After all Checklist items done:

1. Update task file: check all DoD items met.
2. `npm run health:check` → capture output.
3. `npm test` → captures test results (runs `test:enforce` via pretest).
4. Paste results into task file's `## Health Check Results`.
5. Tell user:
   > "Implementation complete. Health check and test results recorded. Ready for review."
