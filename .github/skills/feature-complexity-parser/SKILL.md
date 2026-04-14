---
name: feature-complexity-parser
description: >
  Classifies monster feature mechanics by complexity tier to decide whether
  JSONB metadata is sufficient or a dedicated Foundry-side handler is needed.
  Load alongside feature-extraction when deciding how to implement new handlers.
---

# Feature Complexity Parser Skill

## The Core Question

When a monster feature can't be extracted by `enrichFromBody()` and needs a
`<Meta customHandler>`, you must decide:

> **Can Foundry automate this mechanic from flat key-value metadata alone,
> or does it need a dedicated handler that parses the raw text itself?**

This skill gives you the framework to answer that for ANY mechanic.

## Classification Axes

Score a mechanic on these five axes. Each YES adds 1 point.

| #   | Axis                        | Question                                                                                                    |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | **Resolution steps**        | Does the mechanic require more than one sequential resolution? (e.g. roll damage → check threshold → apply) |
| 2   | **Round-persistent state**  | Does the mechanic change or accumulate state across rounds? (growth, advancement, escalation)               |
| 3   | **Multi-target resolution** | Does the mechanic resolve differently per target or pierce through multiple? (not just "all in area")       |
| 4   | **Conditional branching**   | Does the outcome fork into 2+ distinct paths based on a mid-resolution check? (not just save-for-half)      |
| 5   | **Cross-reference**         | Does the mechanic reference another actor's sheet, another feature, or compose with a sub-handler?          |

### Interpreting the Score

| Score | Tier       | Where the logic lives                                             |
| ----- | ---------- | ----------------------------------------------------------------- |
| 0–1   | **Tier 1** | Full extraction in metaHandlers.ts → JSONB → Foundry generic item |
| 2     | **Tier 2** | Full extraction in metaHandlers.ts → JSONB → Foundry item macro   |
| 3+    | **Tier 3** | Anchor-only in metaHandlers.ts → Foundry-side dedicated handler   |

## Tier Definitions

### Tier 1 — JSONB Sufficient

The mechanic maps directly to a Foundry automation primitive. Metadata is
the complete source of truth. No custom Foundry code needed beyond generic
item configuration.

**Structural signature**: Single resolution step, no persistent state, one
outcome path.

**Foundry primitives that cover Tier 1**:

- Apply/remove a condition (ActiveEffect)
- Roll damage without an attack roll (DamageRoll)
- Spawn linked actor tokens (TokenDocument.create)
- Set a flag on a target (Actor.setFlag)

**Example mechanic**: "Target is **Stunned** until end of next turn."
→ 0 axes triggered. Tier 1. Extract `{condition, duration}`, done.

### Tier 2 — JSONB Sufficient, Needs Item Macro

The mechanic is self-contained in metadata but requires conditional logic
to automate — a small item macro or module hook, not just Foundry config.

**Structural signature**: One branching point OR one cross-reference, but
fields don't depend on each other for interpretation.

**Foundry patterns that cover Tier 2**:

- Spawn sub-actor with stats from metadata (destructible object)
- Place measured template + apply conditions from a list
- Hook into damage pipeline to redirect/reflect

**Example mechanic**: "Creates a 40-foot-radius zone of darkness for 3 rounds.
Creatures inside are [Blinded] and [Deafened]."
→ Axis 2 (persists across rounds). Score = 1… but zone needs placement +
condition list application ≈ small macro. Tier 2.

### Tier 3 — Foundry-Side Handler Required

The metadata cannot fully represent the mechanic without reproducing the
resolution logic. Foundry needs to read raw text and implement a dedicated
handler.

**Structural signature**: Multiple resolution steps that depend on each
other's outcomes, OR round-persistent state with per-round mutations, OR
composition with other handlers.

**Red flags that always mean Tier 3**:

- "If X, then Y; otherwise Z" where Y and Z are themselves multi-field effects
- Per-round state changes (radius grows, wall advances, damage escalates)
- Handler calls another handler (composition)
- Mechanic pierces through targets with per-target resolution
- Mechanic requires animation sequencing or ordered target iteration

Use `customHandler='text_pipe'` for all Tier 3 mechanics. The handler sets a
`textPipe: 'true'` flag and passes through any freeform attributes. No
extraction logic — Foundry's `@handler(featureId)` decorated methods parse
raw text directly.

## Decision Flowchart

```
Can enrichFromBody() handle it?
│
YES → Done. No handler needed.
NO  ↓
│
Score the 5 axes.
│
├─ Score 0–1 → TIER 1
│  Write handler in metaHandlers.ts.
│  Extract ALL fields. Foundry reads meta directly.
│
├─ Score 2 → TIER 2
│  Write handler in metaHandlers.ts.
│  Extract ALL fields. Foundry needs a small item macro.
│
└─ Score 3+ → TIER 3
   Use customHandler='text_pipe'.
   Sets textPipe flag only — Foundry-side @handler reads raw text directly.
```

## Implementation Patterns

### Tier 1–2: Full Extraction

Handler extracts every field. `feature.meta` is the sole data contract
with Foundry. No raw text re-parsing.

```typescript
function handleMyMechanic(feat, body, attrs) {
  feat.meta = { ...feat.meta, mechanicFlag: 'true' };
  const match = body.match(/relevant pattern/);
  if (match) feat.meta = { ...feat.meta, fieldName: match[1] };
  applyPassthroughAttrs(feat, attrs);
}
```

### Tier 3: text_pipe Passthrough

No per-mechanic handler needed. Use `customHandler='text_pipe'` in the MDX.
The handler sets `textPipe: 'true'` and passes through freeform attributes.
Foundry's decorated `@handler(featureId)` methods own all resolution logic,
reading raw text directly.

```mdx
<Meta
  target='generator'
  type='feature'
  featureId='slug/complex-mechanic'
  customHandler='text_pipe'
/>
```

## Promotion and Demotion

**Promote** (lower tier → higher):

- A new variant of the mechanic adds conditional branching or round state
- Foundry testing reveals the generic consumer can't handle edge cases
- Composition with another mechanic pushes the score up

**Demote** (higher tier → lower):

- Foundry adds a native primitive (e.g. a "piercing beam" template type)
- The mechanic is simplified in game design
- A pattern recurs across enough monsters to justify a generic Foundry module

## Quick-Reference Scoring Examples

| Mechanic Pattern                            | Axes Triggered           | Score | Tier |
| ------------------------------------------- | ------------------------ | ----- | ---- |
| Apply condition until end of next turn      | —                        | 0     | 1    |
| Auto-hit flat damage, no save               | —                        | 0     | 1    |
| Summon N linked creatures within range      | 5 (cross-ref actor)      | 1     | 1    |
| Destroyable sub-object with AC/HP/resists   | 5 (cross-ref sub-actor)  | 1     | 2    |
| Save-or-condition zone lasting N rounds     | 2 (round state)          | 1     | 2    |
| Damage link: reflect damage + drain heals   | 1 (multi-step), 4 (fork) | 2     | 2    |
| Save-or-die with score threshold + fallback | 1, 4                     | 2     | 3    |
| Growing AOE with per-round radius increase  | 1, 2, 4                  | 3     | 3    |
| Advancing wall with save + escape DC chain  | 1, 2, 4                  | 3     | 3    |
| Piercing beam with per-target resolution    | 1, 3, 4, 5               | 4     | 3    |

## Key Files

| File                                          | Purpose                                 |
| --------------------------------------------- | --------------------------------------- |
| `scripts/metadata/extraction/metaHandlers.ts` | Handler registry and implementations    |
| `.github/skills/feature-extraction/SKILL.md`  | Pipeline architecture and Meta tag docs |
| `src/lib/types/feature.ts`                    | MonsterFeature type with `meta` field   |
| `scripts/metadata/generateFeatureMetadata.ts` | Orchestrator that calls handlers        |
