/**
 * @fileoverview slotOptions tests.
 *
 * @module tests/unit/src/modules/character-builder/infrastructure/devApi/slotOptions.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { buildCharacterFromPayload } from '@/modules/character-builder/infrastructure/devApi/buildCharacter';
import {
  BUILDER_SLOTS,
  isBuilderSlot,
  listSlotOptions,
} from '@/modules/character-builder/infrastructure/devApi/slotOptions';
import { describe, expect, it } from 'vitest';
import {
  makeCharacter,
  makeContent,
} from '../../../../../../fixtures/builder/builderFixtures';

describe('slotOptions', () => {
  it('recognises slot names', () => {
    expect(isBuilderSlot('boons')).toBe(true);
    expect(isBuilderSlot('potions')).toBe(false);
    expect(BUILDER_SLOTS).toContain('features');
  });

  it('lists specializations of the chosen vocation only', async () => {
    const content = makeContent();
    const { character } = await buildCharacterFromPayload(
      { vocations: [{ vocation: 'wizard' }] },
      content,
    );
    const options = await listSlotOptions('specialization', character, content);
    expect(options.map((o) => o.slug)).toEqual(['evoker']);
    expect(await listSlotOptions('specialization', makeCharacter(), content)).toEqual([]);
  });

  it('lists top-level boons with affordability', async () => {
    const content = makeContent();
    const { character } = await buildCharacterFromPayload(
      { bloodline: 'empyrean', boons: ['Radiant Wings'] },
      content,
    );
    const options = await listSlotOptions('boons', character, content);
    expect(options.map((o) => o.slug)).toEqual([
      'Extended Reach',
      'Radiant Wings',
      'Celestial Gift',
    ]);
    expect(options[0].info).toMatchObject({ affordable: false, selected: false });
    expect(options[1].info).toMatchObject({ selected: true });
  });

  it('lists skill rows with eligible grants and features with unlock state', async () => {
    const content = makeContent();
    const { character } = await buildCharacterFromPayload(
      { vocations: [{ vocation: 'wizard', level: 1 }] },
      content,
    );
    const skills = await listSlotOptions('skills', character, content);
    const arcana = skills.find((s) => s.slug.endsWith('arcana'));
    expect(arcana?.info).toMatchObject({ hinted: true, eligibleGrants: ['base:skill'] });
    const features = await listSlotOptions('features', character, content);
    expect(features.map((f) => f.info?.unlocked)).toEqual([true, false]);
  });

  it('lists feats with prerequisite badges and library items', async () => {
    const content = makeContent();
    const feats = await listSlotOptions('feats', makeCharacter(), content);
    expect(feats[1].info).toMatchObject({ hasPrerequisite: true, prerequisite: 'Dex 13' });
    for (const slot of ['bloodline', 'vocation', 'heirlooms', 'trinkets', 'spells', 'trades'] as const) {
      expect(Array.isArray(await listSlotOptions(slot, makeCharacter(), content))).toBe(true);
    }
  });
});
