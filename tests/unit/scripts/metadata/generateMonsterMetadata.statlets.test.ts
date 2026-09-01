/**
 * @fileoverview Monster Generator — Statlet Tests
 * @description Quoted creature statlets and object blocks become sub-records
 * with their own features; sub-record tags roll up into the parent.
 *
 * @module tests/unit/scripts/metadata/generateMonsterMetadata.statlets.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { parseMonsterSource } from '@scripts/metadata/generateMonsterMetadata';
import { loadSharedData } from '@scripts/metadata/sharedData';
import { beforeAll, describe, expect, it } from 'vitest';

let sharedData: Awaited<ReturnType<typeof loadSharedData>>;

beforeAll(async () => {
  sharedData = await loadSharedData();
});

const PATH = 'src/content/en/monsters/hive.sheet.mdx';

const SHEET = `---
source: Ikuisuus
contentType: monsters
---

# Hive Mother
_Large Aberration, Neutral Evil_

| **Armor Class** | **Hit Points** | **Speed** |
| --------------- | -------------- | --------- |
| 16 (natural) | 120 ([% 16d10 +32 %]) | [= 6 stride =] |

| STR | DEX | CON | INT | WIS | CHA |
| --- | --- | --- | --- | --- | --- |
| 18 (+4) | 12 (+1) | 14 (+2) | 10 (+0) | 12 (+1) | 8 (-1) |

- **Senses**: darkvision [= 12 stride =]
- **Challenge**: 8 (3,900 XP)

---

## Traits

#### Brood Link
The mother knows the location of every drone.

---

## Actions

#### Bite
_Melee Weapon Attack:_ +8 to hit, reach [= 1 stride =], one target.
_Hit:_ 12 ([% 2d8 +4 piercing %]).

---

## Brood

> ### **Drone**
>
> _Small Aberration_
>
> | **Armor Class** | **Hit Points** | **Speed** |
> | --------------- | -------------- | --------- |
> | 13 | 20 ([% 4d6 +6 %]) | [= 8 stride =], fly [= 8 stride =] |
>
> | STR | DEX | CON | INT | WIS | CHA |
> | --- | --- | --- | --- | --- | --- |
> | 8 (-1) | 16 (+3) | 12 (+1) | 4 (-3) | 10 (+0) | 4 (-3) |
>
> - **Resistances**: Poison
> - **Senses**: Blindsight [= 6 stride =]
>
> - **Actions — Sting.** _Melee Weapon Attack:_ +5 to hit; **5 ([% 1d4 +3 poison %])**.
> - **Deathburst.** When reduced to 0 HP, creatures within [= 1 stride =] take [% 1d6 chemical %].

---

> #### Wax Comb
>
> | **Armor Class** | **Hit Points** | **Damage Threshold** |
> | --------------- | -------------- | -------------------- |
> | 12              | 60             | 10                   |
>
> - **Size**: Large object
> - **Immunities**: **Poison**, **Psychic**
> - **Sticky**: A creature that touches the comb is restrained until it succeeds on a DC 14 Strength save.

---

## Major Actions

#### Swarm Call
Every drone within [= 12 stride =] moves up to its speed.

## Minor Actions

#### Skitter
The mother moves [= 2 stride =] without provoking.

## Legendary Deed: Act

#### **Overrun** (Costs 1 Deed)
The mother moves up to her speed through creatures.
`;

describe('parseMonsterSource — statlets', () => {
  it('should keep features written after a statlet on the sheet creature, not the statlet', () => {
    const [mother, drone] = parseMonsterSource(SHEET, PATH, sharedData) as Array<{
      title: string;
      features: Array<{ name: string; heading?: string }>;
    }>;
    expect(mother.features.map((f) => f.name)).toEqual(
      expect.arrayContaining(['Brood Link', 'Bite', 'Swarm Call', 'Skitter', 'Overrun']),
    );
    expect(drone.features.map((f) => f.name)).toEqual(['Sting', 'Deathburst']);
  });

  it('should carry the rendered heading when it differs from the feature name', () => {
    const [mother] = parseMonsterSource(SHEET, PATH, sharedData) as Array<{
      features: Array<{ name: string; heading?: string }>;
    }>;
    const deed = mother.features.find((f) => f.name === 'Overrun')!;
    expect(deed.heading).toBe('Overrun (Costs 1 Deed)');
    expect(mother.features.find((f) => f.name === 'Bite')!.heading).toBeUndefined();
  });

  it('should emit the creature, the quoted drone, and the object as three records', () => {
    const records = parseMonsterSource(SHEET, PATH, sharedData) as Array<
      Record<string, unknown>
    >;
    expect(records.map((r) => r.subSlug)).toEqual([
      'hive-mother',
      'drone',
      'hive-wax-comb',
    ]);
    expect(records[2].kind).toBe('object');
    expect(records[2].link).toBe('/library/monsters/hive#wax-comb');
    expect(records[2].damageThreshold).toBe(10);
    expect((records[2].ac as { value: number }).value).toBe(12);
    expect(records[2].tags).toContain('meta:content:object');
  });

  it('should give the quoted drone its own tagged features with the group prefix stripped', () => {
    const [, drone] = parseMonsterSource(SHEET, PATH, sharedData) as Array<{
      features: Array<{ name: string; trigger?: string; tags?: string[] }>;
    }>;
    const names = drone.features.map((f) => f.name);
    expect(names).toEqual(['Sting', 'Deathburst']);
    expect(drone.features[0].tags).toContain('damage:poison');
    expect(drone.features[1].tags).toContain('damage:chemical');
    expect(drone.features[1].tags).toContain('range:close');
  });

  it('should give the object its colon-labelled trait and no stat lines as features', () => {
    const [, , comb] = parseMonsterSource(SHEET, PATH, sharedData) as Array<{
      features: Array<{ name: string }>;
    }>;
    expect(comb.features.map((f) => f.name)).toEqual(['Sticky']);
  });

  it('should keep the parent creature features to its own blocks', () => {
    const [mother] = parseMonsterSource(SHEET, PATH, sharedData) as Array<{
      features: Array<{ name: string }>;
    }>;
    expect(mother.features.map((f) => f.name)).toEqual(['Brood Link', 'Bite', 'Swarm Call', 'Skitter', 'Overrun']);
  });

  it('should roll every sub-record tag up into the parent, and not the reverse', () => {
    const [mother, drone, comb] = parseMonsterSource(
      SHEET,
      PATH,
      sharedData,
    ) as Array<{ tags: string[] }>;
    const parent = new Set(mother.tags);
    for (const t of [...drone.tags, ...comb.tags]) {
      if (/^(meta|rarity):/.test(t)) continue;
      expect(parent.has(t)).toBe(true);
    }
    expect(mother.tags).toContain('size:small');
    expect(drone.tags).not.toContain('size:large');
  });

  it('should not roll meta or rarity tags up into the parent', () => {
    const [mother] = parseMonsterSource(SHEET, PATH, sharedData) as Array<{
      tags: string[];
    }>;
    expect(mother.tags).not.toContain('meta:content:object');
    expect(mother.tags.filter((t) => t.startsWith('rarity:'))).toEqual([
      'rarity:rare',
    ]);
  });

  it('should strip working fields from the emitted records', () => {
    for (const r of parseMonsterSource(SHEET, PATH, sharedData) as Array<
      Record<string, unknown>
    >) {
      expect(r).not.toHaveProperty('blockStart');
      expect(r).not.toHaveProperty('isObject');
    }
  });
});
