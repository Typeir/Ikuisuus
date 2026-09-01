/**
 * @fileoverview Unit tests for library domain content tag guards.
 * @module tests/unit/src/lib/mdx/content-tags.test
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import {
    ContentKind,
    isSpellTag,
    type MonsterTag,
    type SpellTag,
} from '@/modules/library/domain/contentTags';
import { describe, expect, it } from 'vitest';

describe('library domain content tags', () => {
  it('evaluates spell tag guards correctly', () => {
    const spellTag: SpellTag = {
      id: 'spell-1',
      kind: ContentKind.Spell,
      title: 'Test Spell',
      level: 1,
      school: 'evocation',
      actionType: 'action',
      range: 'Self',
      ritual: false,
      concentration: false,
      duration: 'Instantaneous',
      components: {
        v: true,
        s: true,
        m: false,
      },
    };

    const monsterTag: MonsterTag = {
      id: 'monster-1',
      kind: ContentKind.Monster,
      title: 'Test Monster',
      cr: 1,
      size: 'Medium',
      creatureType: 'humanoid',
    };

    expect(isSpellTag(spellTag)).toBe(true);
    expect(isSpellTag(monsterTag)).toBe(false);
  });
});
