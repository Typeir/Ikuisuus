---
name: feature-extraction
description: >
  Workflow for extracting and enriching monster features from `.sheet.mdx`
  files. Covers the `--file` CLI singleton filter, `<Meta>` MDX directives
  for complex mechanics, the enrichment pipeline, and iterative verification.
---

# Feature Extraction Skill

## Overview

Monster feature extraction converts `.sheet.mdx` stat blocks into structured
`MonsterFeature[]` data for the Foundry VTT export pipeline and API consumption.
The system uses a three-stage approach: automatic parsing, body enrichment,
and `<Meta>` tag overrides for mechanics that resist automated extraction.

## Quick Start — Single Monster Iteration

```bash
# Generate base metadata + features for one monster
npx tsx scripts/metadata/generateMonsterMetadata.ts --file <slug>.sheet.mdx
npx tsx scripts/metadata/generateFeatureMetadata.ts --file <slug>.sheet.mdx

# Inspect output
cat .meta/en/monsters/<slug>.metadata.json | node -e "
  const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
  const f=(Array.isArray(d)?d[0]:d).features;
  f.forEach((x,i)=>console.log(i+1+'.',x.name,'|',x.trigger,
    x.attack?'ATK':'',x.damage||'',x.meta?JSON.stringify(x.meta):''));
"
```

## Pipeline Architecture

```
.sheet.mdx
  → classifySections()        # traits, actions, reactions, deeds, spellcasting
  → extractFeaturesFromSection()  # switch on section type
    → extractTraits / extractActions / extractDeedActs / ...
      → enrichFromBody()      # attack, damage, save, range, autoFail, crit, reaction
  → resolveMultiattackRefs()  # link multiattack to child feature IDs
  → parseMetaTags() + merge   # apply <Meta> directives by featureId
  → MonsterFeature[]
```

## `enrichFromBody()` — What It Extracts

| Pattern                             | Field Set                      | Example                              |
| ----------------------------------- | ------------------------------ | ------------------------------------ |
| `_Melee Weapon Attack:_ +X to hit`  | `attack`                       | `+22 to hit, reach 10 ft.`           |
| `_Hit:_ N (XdY + Z) type damage`    | `damage`, `damageType`         | `51 (7d10 + 10) bludgeoning`         |
| `plus N (XdY) type damage`          | `damageFlat`, `damageFlatType` | `plus 31 (7d8) radiant`              |
| `DC N Ability saving throw`         | `saving_throw`                 | `DC 25 Strength saving throw`        |
| `N-foot radius/cone/line`           | `target`                       | `30-foot-radius sphere`              |
| `automatically fails`               | `auto_fail_saves` + flag       | `automatically fails all saves`      |
| `each subsequent/consecutive`       | `escalation` flag              | `each subsequent hit deals +1d6`     |
| `critically strikes on a roll of N` | `meta.critRange`               | `critically strikes on a roll of 18` |
| `uses her/his/its reaction`         | `trigger = 'reaction'`         | `can use her reaction to force`      |

## `<Meta>` Tag System

For mechanics too complex or irregular for automated parsing, add a `<Meta>`
tag in the MDX source immediately after the feature heading.

### Schema (Simplified)

```mdx
<Meta
  target='generator'
  type='feature'
  featureId='slug/feature-name'
  customHandler='handler_name'
/>
```

- **`target="generator"`** — Required. Tells the parser this is for the generator.
- **`type="feature"`** — Required. Directive type.
- **`featureId`** — Required. Must match the feature's generated ID (`slug/kebab-name`).
- **`customHandler`** — The handler name. The handler knows what to extract from context.
- Additional freeform attributes are passed through as `meta` key-value pairs.

### Handler Catalog

| Handler                  | Mechanic                                | Tier |
| ------------------------ | --------------------------------------- | ---- |
| `mark_target`            | Applies a mark condition                | 1    |
| `auto_hit`               | Attack that cannot miss, flat damage    | 1    |
| `summon`                 | Deploys linked creatures                | 1    |
| `destructible_component` | Destroyable sub-objects with AC/HP      | 2    |
| `geometry_teleport`      | Repositioning without standard movement | 2    |
| `environmental_zone`     | Persistent zone with conditions         | 2    |
| `damage_reflection`      | Damage dealt reflected back             | 2    |
| `text_pipe`              | Passthrough — Foundry handler resolves  | 3    |

> **Complexity tiers**: See `.github/skills/feature-complexity-parser/SKILL.md`
> for the 5-axis scoring framework that determines when JSONB metadata suffices
> (Tier 1–2) vs when to defer to a Foundry-side handler (Tier 3).

### Decision Tree: Parser vs Meta

```
Can enrichFromBody() extract the key data?
  YES → No Meta needed. The automatic pipeline handles it.
  NO  → Does the mechanic fit a known handler?
    YES → Add <Meta> with customHandler="handler_name"
    NO  → Add <Meta> with customHandler="custom" + freeform attrs
```

## Feature Completeness Checklist

For a monster to be "Foundry-plausible", verify each feature has:

- [ ] `trigger` set (action/reaction/passive/bonus_action)
- [ ] `attack` populated for weapon attacks
- [ ] `damage` + `damageType` for attacks
- [ ] `saving_throw` for save-based features
- [ ] `target` for ranged/area effects
- [ ] `legendary_deed` category for deed features
- [ ] `recharge` for limited-use abilities
- [ ] `meta.customHandler` for complex/unparseable mechanics
- [ ] `meta.critRange` for non-standard crit ranges

## Key Files

| File                                          | Purpose                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| `src/lib/utils/monsterFeatureExtractor.ts`    | Core extraction: traits, actions, `enrichFromBody()` |
| `src/lib/utils/monsterDeedExtractor.ts`       | Deed extraction: act, stratagem, lair, phase         |
| `src/lib/utils/monsterSectionClassifier.ts`   | Section classification from H2/H3 headings           |
| `src/lib/utils/monsterTokens.ts`              | Token recognizers: attack, hit, save, recharge       |
| `src/lib/utils/metaTagParser.ts`              | `<Meta>` tag parser from raw MDX                     |
| `src/lib/components/mdx/meta/meta.tsx`        | Noop React component for MDX rendering               |
| `scripts/metadata/generateFeatureMetadata.ts` | Orchestrator: scan, extract, merge, write            |
| `src/lib/metadata/cliRunner.ts`               | CLI: `--file` and `--persist` flag handling          |
| `src/lib/types/feature.ts`                    | Type definitions: `MonsterFeature`, `FeatureFlag`    |
