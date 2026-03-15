---
description: 'Audit a Damocles MDX file for lore consistency, tonal drift, and naming violations — read-only, no edits'
agent: 'agent'
---

# Check Damocles Lore Consistency

You are auditing a Damocles MDX file for lore accuracy, tonal integrity, and naming correctness. This is a **read-only** check — you do NOT edit the file.

## Step 1: Load Context

Read the lore reference:

1. `.github/skills/damocles-lore/SKILL.md`

## Step 2: Read Target

Use the currently open file, or ask the user to specify a file path. Read the entire file.

## Step 3: Run Three Checks

### Check 1: Anti-Generic Filter Scan

Scan every line for:

- Banned phrases from the damocles-lore skill's anti-generic filter
- Sentences that pass the Forgotten Realms test (could appear in a Forgotten Realms sourcebook unchanged)
- Vague fantasy language that lacks Damocles-specific grounding

For each finding, report:

```
LINE {N}: "{exact phrase}" — VIOLATION: {reason}
```

### Check 2: Naming Audit

Scan all proper nouns against known naming conventions:

- Finnic strain (cosmological entities, spirits)
- Gaelic/Irish strain (Binturian culture)
- Hellenic/Latin strain (Empyrean heritage)
- Romance/Castilian strain (regional)

Flag:

- Unknown proper nouns not in the lore reference
- Names that violate established naming patterns
- Invented names that feel like fantasy name generator output

For each finding:

```
LINE {N}: "{name}" — WARNING: {reason}
```

### Check 3: Factual Consistency

Compare claims in the file against the lore snapshot in damocles-lore:

- Cosmological claims (Ages, entities, events)
- Entity relationships (who created what, who serves whom)
- Timeline consistency (which Age, which event preceded which)
- Entity attributes (titles, epithets, known facts)

For each finding:

```
LINE {N}: "{claim}" — {VIOLATION|WARNING}: {reason}
```

## Step 4: Output Report

Present a structured report:

```
## Lore Consistency Report: {filename}

### Anti-Generic Filter
- {N} violations found
- {list of findings with line numbers}

### Naming Audit
- {N} issues found
- {list of findings with line numbers}

### Factual Consistency
- {N} issues found
- {list of findings with line numbers}

### Summary
- Total issues: {N}
- Violations (blocking): {N}
- Warnings (non-blocking): {N}
```

## Rules

- **Do NOT edit the file** — this is audit only
- Report line numbers for every finding
- Distinguish VIOLATION (blocking) from WARNING (non-blocking)
- If the file is clean, say so — do not invent issues
