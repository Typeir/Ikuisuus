---
name: check-damocles-lore-consistency
description: >
  Read-only audit of a Damocles MDX file. Checks knowledge-tier structure,
  anti-generic filter, naming strains, and factual consistency against the lore
  snapshot, then runs the MDX health checks. Reports findings with line numbers,
  never edits.
---

# Check Damocles Lore Consistency

## Purpose

Audit one MDX file for lore accuracy, tonal integrity, structure, and naming.
Read-only. The caller decides what to fix.

## 1. Load Context

Read in order:

1. `.github/skills/damocles-lore/SKILL.md` — canon, naming strains, anti-generic filter
2. `.github/skills/damocles-page-types/SKILL.md` — canonical structure per page type
3. `.github/skills/mdx-format-world/SKILL.md` — tier rules (skip for `.sheet.mdx`)

## 2. Target

Use the open file or a path from the caller. Read the entire file. Classify it
from the suffix:

| Suffix | Audit |
| --- | --- |
| `.lore.mdx` | Tiers, tone, naming, facts |
| `.sheet.mdx` | Tone, naming, facts. Stat-block format belongs to `mdx-format-monsters` |
| other `.mdx` | Tone, naming, facts. Format belongs to the matching `mdx-format-*` skill |

## 3. Structural Check (`.lore.mdx` only)

- One `#` H1, no missing title
- Tier headings present and in order: `## _Common_`, `## _Advanced_`, `## _Deep_`, `## _Truth_`
- Every tier has body content; an empty or single-line Truth tier is a violation
- Truth tier states concrete hidden facts, not hedged restatements
- Lower tiers are self-contained: no Deep-tier fact leaks into Common
- Truth contradictions are intentional, not accidental drift from an edited lower tier

```
LINE {N}: {finding} — STRUCTURE: {reason}
```

## 4. Anti-Generic Check

Scan every line:

- Banned phrases from the anti-generic section of `damocles-lore`
- Sentences interchangeable with a generic D&D sourcebook (Forgotten Realms test)
- Fantasy language with no Damocles-specific grounding

```
LINE {N}: "{exact phrase}" — VIOLATION: {reason}
```

## 5. Naming Check

Compare every proper noun against the strains in `damocles-lore`:

- Finnic — cosmological entities, spirits, ancient geography
- Gaelic / Irish — Binturian culture, northern nations
- Hellenic / Latin — Empyrean heritage, scholars, ancient figures
- Romance / Castilian — southern and western regions

Flag unknown nouns, strain mismatches, and generator-flavoured invented names.

```
LINE {N}: "{name}" — WARNING: {reason}
```

## 6. Factual Check

Compare claims against the lore snapshot:

- Cosmological claims: Ages, entities, events
- Entity relationships: who made what, who serves whom
- Timeline: which Age, which event preceded which
- Attributes: titles, epithets, established facts

```
LINE {N}: "{claim}" — {VIOLATION|WARNING}: {reason}
```

## 7. Format Check

```bash
npm run health:check
```

Report the `mdx-format` and `orphaned-mdx-links` results for this file. Never
suppress a finding to make the audit pass.

## 8. Report

```
## Lore Consistency Report: {filename}

### Structure
- {N} violations
- {findings with line numbers}

### Anti-Generic Filter
- {N} violations
- {findings with line numbers}

### Naming
- {N} issues
- {findings with line numbers}

### Factual Consistency
- {N} issues
- {findings with line numbers}

### Format
- mdx-format: {PASS|FAIL} — {detail}

### Summary
- Total: {N}
- Violations (blocking): {N}
- Warnings (non-blocking): {N}
```

## Rules

- Do not edit the file
- Line number on every finding
- VIOLATION blocks publication, WARNING does not
- Clean file: say so. Never invent findings
