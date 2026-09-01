/**
 * @fileoverview Aspect Vocabulary Resolver Tests
 * @description valuesFrom expansion, open/meta exclusion, empty-group drop.
 *
 * @module tests/unit/src/lib/metadata/aspectVocabulary.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { resolveAspectVocabulary } from '@/lib/metadata/aspectVocabulary';
import { loadSharedData } from '@scripts/metadata/sharedData';
import { describe, expect, it } from 'vitest';

describe('resolveAspectVocabulary', () => {
  it('should expand valuesFrom references and drop open/meta groups', () => {
    const groups = resolveAspectVocabulary({
      aspects: {
        damage: { scope: '*', values: ['fire', 'frost'] },
        resistance: { scope: '*', valuesFrom: ['damage'] },
        condition: { scope: '*', valuesFrom: ['gameData.conditions'] },
        slot: { scope: ['heirlooms'], open: true },
        'meta:locale': { scope: '*', values: ['en'] },
        empty: { scope: '*', values: [] },
      },
      gameData: { conditions: [{ name: 'Blinded' }, { name: 'Prone' }] },
    });

    expect(groups.map((g) => g.group)).toEqual([
      'damage',
      'resistance',
      'condition',
    ]);
    expect(groups[1].values).toEqual(['fire', 'frost']);
    expect(groups[2].values).toEqual(['blinded', 'prone']);
  });

  it('should resolve the real shared-data including the form group', async () => {
    const groups = resolveAspectVocabulary((await loadSharedData()) as never);
    const form = groups.find((g) => g.group === 'form');
    expect(form?.values).toContain('blade');
    expect(form?.values).toHaveLength(38);
    expect(groups.some((g) => g.group.startsWith('meta:'))).toBe(false);
  });

  it('should order form first, myth second, theme last and flag theme not authored', async () => {
    const groups = resolveAspectVocabulary((await loadSharedData()) as never);
    expect(groups[0].group).toBe('form');
    expect(groups[0].authored).toBe(true);
    expect(groups[1].group).toBe('myth');
    expect(groups.at(-1)?.group).toBe('theme');
    expect(groups.at(-1)?.authored).toBe(false);
    const myth = groups[1].values;
    expect(myth).not.toContain('true-god');
    expect(myth).toContain('bilupine');
    expect(myth).toContain('vaarat');
  });
});
