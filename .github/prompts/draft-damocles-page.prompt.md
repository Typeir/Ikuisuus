---
description: 'Draft a new Damocles MDX page from notes, context, or a topic prompt'
agent: 'agent'
---

# Draft Damocles Page

You are drafting a new MDX content page for the Damocles setting.

## Step 1: Gather Input

Ask the user for:

1. **Page type**: world lore / character / creature / region / spell / item / rules / monster stat block
2. **Available notes**: raw text, bullet points, or context to work from
3. **Known cross-references**: other pages this content should link to
4. **Placement**: where in `src/content/en/` this file should live

If the user has a file open in the editor, use it as additional context.

## Step 2: Invoke Drafter Workflow

Load the Damocles Drafter agent's workflow by reading these skills in order:

1. `.github/skills/damocles-lore/SKILL.md`
2. `.github/skills/damocles-page-types/SKILL.md`
3. `.github/instructions/mdx-content.instructions.md`

Then follow the Damocles Drafter agent's full workflow:

- Identify page type
- Create task file in `.ignore/tasks/`
- Survey adjacent content for contradictions and cross-references
- Draft the page following the canonical template
- Run self-audit (anti-generic filter, naming audit, fact check, structure check)
- Output complete MDX with all flags

## Step 3: Present Draft

Provide:

- The complete MDX draft
- List of all `[UNCERTAIN]` / `[NEEDS SOURCE]` / `[POSSIBLE CONTRADICTION]` flags
- Cross-references added
- Any editorial decisions made

Ask the user if they want to save the file or make changes.
