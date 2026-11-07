# Damocles Authoring Playbook

Operational guide for populating WIP lore files and writing companion stat blocks.
Editorial constraints live in `damocles-authoring.instructions.md`; canon lives in
`damocles-lore`; templates live in `damocles-page-types` and the `mdx-format-*` skills.
This file covers process only.

## 1. Find Work

```bash
grep -rl "^WIP" src/content/en/ --include="*.mdx" | sort
```

Priority order. Higher tiers underpin the rest, so write them first.

| Priority | Directory | Why |
| --- | --- | --- |
| 1 | `world/gods-and-demigods/` | Foundational entities; everything references them |
| 2 | `world/ages/` | Epochs underpin all other lore |
| 3 | `world/the-creatures-of-damocles/` | Creature lore enables stat blocks |
| 4 | `world/characters-and-actors/` | Named figures with cosmological roles |
| 5 | `world/events/` | Events that link other pages |
| 6 | `world/the-lands-of-damocles/` | Regions |
| 7 | `world/structures/` | Specific locations |
| 8 | `world/artifacts/` | Legendary items |

Never carry a cached WIP list. Run the grep; the list changes every session.

## 2. Research Before Writing

Grep `src/content/en/` for every term the subject touches: name, epithet, aliases,
associated places, associated creatures, events. Assume nothing.

```bash
grep -rn "Kuutar\|Mother Moon\|lunar\|moon" src/content/en/ --include="*.mdx" | head -60
```

Quote the lines you relied on in the report. An unsourced sentence is a defect.

## 3. Write

- Pick the template from `damocles-page-types` or the matching `mdx-format-*` skill
- Lore pages use the four tiers: `## _Common_`, `## _Advanced_`, `## _Deep_`, `## _Truth_`
- Flag uncertainty inline: `[UNCERTAIN: …]`, `[NEEDS SOURCE: …]`, `[POSSIBLE CONTRADICTION: …]`, `[REQUIRES AUTHORING - WIP]`
- Every creature, god-tier entity, or recurring threat described in a lore page gets a companion `.sheet.mdx` following `mdx-format-monsters`
- Keep every file under the line limit; split before exceeding it

## 4. Report

One report per edited file, in `.ignore/reports/`:

```
.ignore/reports/{YYYY-MM-DD-HHMMSS}-{kebab-file-name}.md
```

Required sections:

```markdown
# Authoring Report: {File Name}

**File**: `src/content/en/{path}/{filename}.mdx`
**Date**: {ISO timestamp}
**Type**: {lore | stat-block | white-room | refactor}
**Related stat blocks created**: {list or "none"}

## Summary

What was written and why it is structured that way.

## Research Findings

Quoted passages from grep, with source file and line.

## Naming Etymology

| Name | Source Language | Breakdown | Meaning |
| --- | --- | --- | --- |

## Editorial Decisions

Tier choices, imagery, deliberate ambiguity. Every joke explained.

## Flags

| Flag type | Location | Description |
| --- | --- | --- |

## White-Room Assumptions

Invented details and the context that justified them. Omit when not applicable.

## Stat Block Notes

Lethality justification, deed count and subtype rationale. Omit when not applicable.
```

## 5. QA

```bash
npm run health:check    # mdx-format, orphaned links, jsdoc, antipatterns, anchors, aspects
npm run mdx-compiles    # every MDX file compiles
npm test                # enforce gate, then full suite
```

Manual sweeps:

```bash
grep -rn "ancient evil\|mystical realm\|arcane runes\|chosen one\|legendary hero" src/content/en/ --include="*.mdx"
grep -rn "#[0-9a-fA-F]" src/content/en/ --include="*.mdx"
```

Checklist:

- [ ] No banned phrases
- [ ] Forgotten Realms test passes per paragraph
- [ ] Naming matches the strain for the culture
- [ ] Etymology documented for every proper noun
- [ ] Every uncertain claim carries a flag
- [ ] Tier pages have all four tiers, each with real content
- [ ] Stat blocks have Lethality, ability scores, and correct deed structure
- [ ] Report written
