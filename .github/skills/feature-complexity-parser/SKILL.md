---
name: feature-complexity-parser
description: >
  Classifies monster feature complexity: JSONB metadata sufficient, or needs
  dedicated Foundry handler? Load alongside feature-extraction when implementing
  handlers.
---

# Feature Complexity Parser

## Core Question

Can Foundry automate from JSONB metadata alone, or needs dedicated handler?

## Classification: 5 Axes

Score 1 point per YES:

1. **Multiple resolution steps?** (roll → check → apply)
2. **Round-persistent state?** (grows, advances, escalates)
3. **Per-target resolution?** (different per target, pierces through)
4. **Conditional branching?** (2+ outcome paths, not just save-for-half)
5. **Cross-reference?** (other actor sheet, other feature, composition)

## Tier Interpretation

| Score | Tier | Implementation |
| --- | --- | --- |
| 0–1 | **Tier 1** | metaHandlers → JSONB → Foundry generic |
| 2 | **Tier 2** | metaHandlers → JSONB → item macro |
| 3+ | **Tier 3** | metaHandlers anchor → Foundry-side handler |

### Tier 1 — JSONB Sufficient

Single step, no state, one path. Example: "Stunned until EOT" → {condition, duration}.

### Tier 2 — JSONB + Small Macro

One branch OR cross-ref, fields independent. Example: 40-ft darkness zone, 3 rounds,
Blinded + Deafened.

### Tier 3 — Handler Required

Multi-step + state-dependent, OR per-round mutations, OR composition, OR per-target
resolution. Use `customHandler='text_pipe'`.
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
