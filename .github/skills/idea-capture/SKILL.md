---
name: idea-capture
description: >
  Architectural idea capture framework. Long-term visions, POCs, multi-phase
  roadmaps stored in `.ignore/ideas/` with standardized sections, success
  criteria, phase tracking.
---

# Idea Capture

## Purpose

Capture long-term architectural ideas. Persist across sessions, remain
discoverable, include POC evidence + blockers, clarify priority/scope.

## When to Use

✅ POC proves pattern. Multi-phase vision beyond sprint. System limitation
needs design. Cross-cutting pattern emerges. Preserve exploratory lessons.

❌ Minor bugs. Routine features. Speculative talk (no evidence).

## File Format

`.ignore/ideas/YYYY-MM-DD-kebab-title.md`

### Sections (REQUIRED)

1. **Overview** — 1 para: problem + solution
2. **Motivation** — 3-5 bullets: why it matters
3. **Architecture** — 1-3 subsections: how
4. **Success Criteria** — definition of done
5. **Blockers** — known/unknown issues
6. **Roadmap** — phases + milestones

High-level design. Can include diagrams, pseudocode, or layered explanations. Reference any POCs or prototypes.

```markdown
## Architecture

### Layer 1: Sequencing (Proven)

[poc_spacy_attack_sequencer.py](../../scripts/metadata/poc_spacy_attack_sequencer.py) already works:

- Breaks prose into sentence-scoped mechanic steps
```

#### 4. **Known Challenges** (3–10 bullet points)

What's hard about this? What remains unproven? What trade-offs exist?

```markdown
## Known Challenges

### Rule Library Authorship

Need a **comprehensive d20 + Damocles mechanics lexicon**:

- ~50 targeting shapes + combinations
```

#### 5. **Roadmap** (Phases with checkboxes)

Break the vision into implementable phases. Each phase should be completable in 1–3 sprints.

```markdown
## Roadmap

### Phase 3a: Rule Library (Sprint 1)

- [ ] Author 100 core rules
- [ ] Test against Yskeia, Xanthous Angels
```

#### 6. **Success Criteria** (Checklist)

How do we know we've solved this? What measurable goals define completion?

```markdown
## Success Criteria

- [ ] **Deterministic** — same input → same output, always
- [ ] **Coverage** — rule library covers ≥90% of existing creatures
```

### Optional Sections

#### **Evidence** (if POC exists)

Link to supporting proof-of-concept code or test results.

```markdown
## Related POCs

- [poc_spacy_dc_extractor.py](scripts/metadata/poc_spacy_dc_extractor.py) — 695 features, 94.5% accuracy
- [poc_spacy_attack_sequencer.py](scripts/metadata/poc_spacy_attack_sequencer.py) — 23 attacks, 127 steps
```

#### **Blockers** (if any)

What outside work must complete first? What decisions are blocked waiting on this?

```markdown
## Blockers

- Requires redesign of feature metadata schema (currently typed as string)
- Depends on Foundry export pipeline stabilization
```

#### **Notes** (project-specific context)

Anything unusual about this idea relative to project conventions or architecture.

```markdown
## Notes

This is a **generalist platform** for TTRPG homebrew compilation. If it works,
it has applications far beyond d20 systems.
```

## Phase Naming Convention

Ideas can span multiple phases. Use this hierarchy:

| Phase           | Scope                             | Timeline    | Execution           |
| --------------- | --------------------------------- | ----------- | ------------------- |
| **Exploration** | POC validation, learn feasibility | 1–2 sprints | Analyst + mini-impl |
| **Phase 1**     | MVP, core feature, unpolished     | 2–4 sprints | Implementer agents  |
| **Phase 2**     | Production hardening, coverage    | 2–3 sprints | Implementer + tests |
| **Phase 3**     | Expansion, generalization         | 3+ sprints  | Cross-team effort   |
| **Archive**     | Decided against, superseded       | N/A         | Reference only      |

Mark your idea's starting phase:

```markdown
**Phase:** Phase 3 (Expansion)
```

## Linking Between Ideas

Ideas often depend on or contradict each other. Link them explicitly:

```markdown
## Related Ideas

- **Depends on:** [2026-04-10-foundry-export-pipeline.md](2026-04-10-foundry-export-pipeline.md)
- **Conflicts with:** [2026-02-20-regex-metadata-extraction.md](2026-02-20-regex-metadata-extraction.md)
- **Enables:** [2026-05-15-automatic-encounter-balancing.md](2026-05-15-automatic-encounter-balancing.md)
```

## Review Checklist

Before an idea document is "final," check:

- [ ] **Clarity** — Readable to someone unfamiliar with the project
- [ ] **Completeness** — All required sections present
- [ ] **Scope** — Clear start and end phases
- [ ] **Evidence** — Links to POCs or test results (if applicable)
- [ ] **Grounded** — Tied to real pain points, not speculation
- [ ] **Actionable** — Phases are concrete enough to task
- [ ] **Feedback** — Circulated to stakeholders if cross-team

## Integration with Task Lifecycle

When an idea progresses from Exploration → Phase 1, use the **task-lifecycle skill**:

1. Analyzer reads the idea document
2. Analyzer creates a Phase 1 task summary in `.ignore/tasks/`
3. Implementer agents execute the task, referencing the idea as context
4. CompletionAuditor validates completion against both task and idea success criteria

Example:

```bash
# Idea document (static context)
.ignore/ideas/2026-04-17-prose-to-mechanics-compiler.md

# Task file created when work starts (dynamic progress)
.ignore/tasks/2026-04-18-120000-build-prose-to-mechanics-rule-library.md
```

## Examples

### ✅ Well-Structured Idea

- [2026-04-17-prose-to-mechanics-compiler.md](./../../../.ignore/ideas/2026-04-17-prose-to-mechanics-compiler.md)
  - Clear overview + motivation
  - Layered architecture with POC links
  - Roadmap broken into 4 phases
  - Known challenges articulated
  - Success criteria measurable

### 📋 Template

Copy and adapt this template when capturing a new idea:

```markdown
# YYYY-MM-DD — [Title]

[One-line executive summary]

## Overview

[1 paragraph explaining problem + approach]

## Motivation

- **Point 1** — Why this matters
- **Point 2** — Current pain point
- **Point 3** — Opportunity

## Architecture

### Layer 1: [Name]

[Design + implementation approach]

## Known Challenges

- **Challenge 1** — Why it's hard + mitigation
- **Challenge 2** — Open question

## Roadmap

### Phase [X]: [Name] (Sprint N)

- [ ] Task 1
- [ ] Task 2

## Success Criteria

- [ ] Criteria 1
- [ ] Criteria 2

## Related POCs

- Link to code

---

**Author:** [Your name]  
**Date:** YYYY-MM-DD  
**Phase:** Exploration / Phase 1 / Phase 2 / Phase 3  
**Status:** Active / On Hold / Archive
```

---

## Quick Reference

| Action                      | Command                                                         |
| --------------------------- | --------------------------------------------------------------- |
| Create new idea             | Copy template above to `.ignore/ideas/YYYY-MM-DD-kebab.md`      |
| Link to POC code            | Use relative paths: `[file.py](../../scripts/metadata/file.py)` |
| Mark as Phase 3 work        | Add `**Phase:** Phase 3 (Expansion)` to doc                     |
| Schedule for implementation | Create task via task-lifecycle skill, reference idea doc        |
| Archive completed idea      | Change `Status: Active` → `Status: Archive` in metadata         |

---

**Author:** Copilot  
**Last Updated:** 2026-04-17  
**Applies To:** `.ignore/ideas/**/*.md`
