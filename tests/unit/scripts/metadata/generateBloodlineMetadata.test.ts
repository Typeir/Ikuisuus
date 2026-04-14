/**
 * @fileoverview Unit tests for bloodline metadata boon parsing.
 * @description Verifies tag-only boon extraction and robust parsing of variable
 * cost + nested collapsible structures.
 *
 * @module tests/unit/scripts/metadata/generateBloodlineMetadata
 */

import { mkdtemp, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSharedData } from '../../../../scripts/metadata';
import { parseBloodlineFile } from '../../../../scripts/metadata/generateBloodlineMetadata';

const tempDirs: string[] = [];

/**
 * Creates a temporary bloodline mdx file and returns its path.
 *
 * @param {string} contents - MDX content to write
 * @returns {Promise<string>} Absolute file path
 */
async function createTempBloodline(contents: string): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'bloodline-meta-'));
  tempDirs.push(dir);
  const filePath = path.join(dir, 'sample-bloodline.mdx');
  await writeFile(filePath, contents, 'utf8');
  return filePath;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe('generateBloodlineMetadata', () => {
  it('should parse boons with tag-only shape', async () => {
    const filePath = await createTempBloodline(`# Sample Bloodline

Lore text.

---

## Core Features

| **Ability Scores** | **Movement Speeds** | **Senses** |
| --- | --- | --- |
| <ul><li>DEX +2</li></ul> | <ul><li>Walk: 30 ft.</li></ul> | <ul><li>Darkvision 60 ft.</li></ul> |

| **Size** | **Creature Types** | **Age** |
| --- | --- | --- |
| <ul><li>Medium</li></ul> | <ul><li>Humanoid</li></ul> | <ul><li>100 years</li></ul> |

---

## Boons

You have a budget of **10 Boon Points**.

<Collapsible>

###### Arcane Focus <span>4 BP</span>

You can cast one cantrip and gain proficiency in Arcana.
You can use this a number of times equal to your proficiency bonus, regaining all uses after a **long rest**.

</Collapsible>
`);

    const sharedData = await loadSharedData();
    const parsed = (await parseBloodlineFile(filePath, sharedData)) as {
      boons: Array<Record<string, unknown>>;
    };

    expect(parsed.boons).toHaveLength(1);
    expect(parsed.boons[0]).toMatchObject({
      name: 'Arcane Focus',
      bpLabel: '4 BP',
      bpValue: 4,
      sortOrder: 0,
    });
    expect(parsed.boons[0].tags).toEqual(
      expect.arrayContaining([
        'mechanic:cantrips',
        'mechanic:long-rest-recharge',
        'mechanic:skill-proficiency:arcana',
      ]),
    );
    expect(parsed.boons[0]).not.toHaveProperty('body');
    expect(parsed.boons[0]).not.toHaveProperty('notes');
  });

  it('should parse variable-cost nested boon structures', async () => {
    const filePath = await createTempBloodline(`# Sample Bloodline

Lore text.

---

## Core Features

| **Ability Scores** | **Movement Speeds** | **Senses** |
| --- | --- | --- |
| <ul><li>CON +1</li></ul> | <ul><li>Walk: 30 ft.</li></ul> | <ul><li>Standard vision</li></ul> |

| **Size** | **Creature Types** | **Age** |
| --- | --- | --- |
| <ul><li>Medium</li></ul> | <ul><li>Humanoid</li></ul> | <ul><li>Ageless</li></ul> |

---

## Boons

You have a budget of **10 Boon Points**.

<Collapsible>

###### Defense Matrix <span>Variable - Pick Any Number</span>

Pick any of the following:

| Option | Effect | Cost |
| --- | --- | ---: |
| Iron Skin | Your AC is 13 + DEX while unarmored. | 1 |

- You gain advantage on Constitution saving throws.
- Uses refresh on a **short rest**.

<Collapsible>

###### Inner Bulwark <span>2 BP</span>

You can use your reaction when hit by a melee weapon attack to reduce extra damage.

</Collapsible>

</Collapsible>
`);

    const sharedData = await loadSharedData();
    const parsed = (await parseBloodlineFile(filePath, sharedData)) as {
      boons: Array<Record<string, unknown>>;
    };

    expect(parsed.boons).toHaveLength(2);
    expect(parsed.boons[0].bpValue).toBeUndefined();
    expect(parsed.boons[0].tags).toEqual(
      expect.arrayContaining([
        'mechanic:variable-cost',
        'mechanic:ac',
        'mechanic:saving-throw',
        'mechanic:short-rest-recharge',
      ]),
    );
    expect(parsed.boons[1].tags).toEqual(
      expect.arrayContaining([
        'mechanic:reaction',
        'mechanic:weapon',
        'mechanic:extra-damage',
      ]),
    );
  });
});
