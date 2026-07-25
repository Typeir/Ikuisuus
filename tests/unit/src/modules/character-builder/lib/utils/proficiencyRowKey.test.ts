/**
 * @fileoverview proficiencyRowKey tests
 * @description Verifies mapping of vocation grant names to table row-keys:
 * skill/trade names camelize to `skills.<camel>` / `tools.<camel>`, trade links
 * resolve via their href slug, and wildcard/category tokens return null.
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/proficiencyRowKey
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { proficiencyRowKey } from '@/modules/character-builder/lib/utils/proficiencyRowKey';
import { describe, expect, it } from 'vitest';

describe('proficiencyRowKey', () => {
  it('maps single- and multi-word skills to camelCase row-keys', () => {
    expect(proficiencyRowKey('skill', 'Arcana')).toBe('skills.arcana');
    expect(proficiencyRowKey('skill', 'Sleight of Hand')).toBe(
      'skills.sleightOfHand',
    );
    expect(proficiencyRowKey('skill', 'Animal Handling')).toBe(
      'skills.animalHandling',
    );
  });

  it('strips stray bold markers left by split table cells', () => {
    expect(proficiencyRowKey('skill', 'Medicine**')).toBe('skills.medicine');
  });

  it('maps trade display names to tool row-keys', () => {
    expect(proficiencyRowKey('trade', 'Thievery')).toBe('tools.thievery');
    expect(proficiencyRowKey('trade', 'Herbalism')).toBe('tools.herbalism');
  });

  it('resolves a trade markdown link via its href slug', () => {
    expect(
      proficiencyRowKey('trade', '[Thievery](/en/library/items/tools/thievery)'),
    ).toBe('tools.thievery');
    expect(
      proficiencyRowKey(
        'trade',
        '[Music](/en/library/items/tools/music) (choose 3 instruments)',
      ),
    ).toBe('tools.music');
  });

  it('returns null for wildcard/category tokens', () => {
    expect(proficiencyRowKey('trade', 'Trade')).toBeNull();
    expect(proficiencyRowKey('skill', 'Skills')).toBeNull();
    expect(proficiencyRowKey('trade', 'One Trade of your choice')).toBeNull();
    expect(proficiencyRowKey('skill', 'Choose any 3 skills')).toBeNull();
  });
});
