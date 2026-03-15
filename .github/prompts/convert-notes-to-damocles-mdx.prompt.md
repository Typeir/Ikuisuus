---
description: 'Convert raw notes or bullet points into a formatted Damocles MDX page'
agent: 'agent'
---

# Convert Notes to Damocles MDX

You are converting raw notes, bullet points, or unstructured text into a properly formatted Damocles MDX page.

## Step 1: Gather Input

Ask the user for:

1. **Page type**: world lore / character / creature / region / spell / item / rules / monster stat block
2. **Raw notes**: paste, file path, or text in the editor
3. **Target location**: where in `src/content/en/` the output should live

If the user has raw text in the editor, use that as the input.

## Step 2: Load Context

Read these skills:

1. `.github/skills/damocles-lore/SKILL.md`
2. `.github/skills/damocles-page-types/SKILL.md`
3. `.github/instructions/mdx-content.instructions.md`

## Step 3: Convert

Transform the raw input into structured MDX:

1. **Identify facts vs. flavor** — separate mechanical claims from narrative content
2. **Map to template** — assign content to the correct sections of the page-type template
3. **Apply knowledge tiers** — for world/character/creature/region pages, sort facts into Common/Advanced/Deep/Truth based on secrecy level
4. **Add cross-references** — identify mentions of known entities and create absolute links
5. **Flag gaps** — mark anything uncertain, unsourced, or potentially contradictory
6. **Apply tone** — lore text gets controlled evocation; mechanical text gets dry precision

## Step 4: Output

Present:

- The complete MDX draft
- List of all flags (`[UNCERTAIN]`, `[NEEDS SOURCE]`, `[POSSIBLE CONTRADICTION]`)
- Notes on where input was ambiguous and how it was resolved
- Suggested filename (kebab-case, `.mdx` extension)

## Rules

- **NEVER** add facts not present in the user's notes
- **NEVER** silently fill gaps — flag them explicitly
- **NEVER** use banned phrases from the anti-generic filter
- **ALWAYS** preserve all information from the original notes, even if placement is uncertain
- If a note is ambiguous about which knowledge tier it belongs to, place it in the most restrictive tier and flag it
