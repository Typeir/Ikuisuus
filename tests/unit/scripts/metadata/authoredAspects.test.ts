/**
 * @fileoverview Authored Aspects Tests
 * @description Sheet vs feature scope parsing of `aspects:` / `denyAspects:`.
 *
 * @module tests/unit/scripts/metadata/authoredAspects
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import {
  applyAuthoredAspects,
  applyAuthoredFeatureAspects,
  aspectAnchor,
  parseAuthoredAspectList,
} from '@scripts/metadata/taggingUtils';
import { describe, expect, it } from 'vitest';

describe('parseAuthoredAspectList', () => {
  it('should split bare strings and single-key maps, ignoring malformed entries', () => {
    const { sheet, features } = parseAuthoredAspectList([
      'form:blade',
      { Multiattack: ['tempo:major', 'bad entry'] },
      { '1st Level – Spellcasting': 'resource:slot' },
      'not a tag',
      42,
      null,
    ]);
    expect(sheet).toEqual(['form:blade']);
    expect(features.get('multiattack')).toEqual(['tempo:major']);
    expect(features.get('1st-level-spellcasting')).toEqual(['resource:slot']);
  });
});

describe('applyAuthoredAspects', () => {
  it('should apply only sheet-level entries', () => {
    const out = applyAuthoredAspects(['a:b'], {
      aspects: ['c:d', { bite: ['e:f'] }],
      denyAspects: ['a:b', { bite: ['c:d'] }],
    });
    expect(out).toEqual(['c:d']);
  });
});

describe('applyAuthoredFeatureAspects', () => {
  it('should match by heading or name anchor and leave others alone', () => {
    const features = [
      { name: 'Spellcasting', heading: '1st Level – Spellcasting', tags: ['x:y'] },
      { name: 'Bite', tags: ['damage:piercing'] },
      { name: 'Claw', tags: ['damage:slashing'] },
    ];
    applyAuthoredFeatureAspects(features, {
      aspects: [{ '1st Level – Spellcasting': ['form:sigil'] }, { bite: 'form:maw' }],
      denyAspects: [{ bite: ['damage:piercing'] }],
    });
    expect(features[0].tags).toEqual(['form:sigil', 'x:y']);
    expect(features[1].tags).toEqual(['form:maw']);
    expect(features[2].tags).toEqual(['damage:slashing']);
  });
});

describe('aspectAnchor', () => {
  it('should match the page anchor rule', () => {
    expect(aspectAnchor('Quacke (Recharge 5–6)')).toBe('quacke-recharge-56');
  });
});
