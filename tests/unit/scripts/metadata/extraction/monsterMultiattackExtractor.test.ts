/**
 * @fileoverview Monster Multiattack Extractor Tests
 * @description Tests for multiattack parent/child splitting, feature ID
 * generation, and inline bold-label attack extraction.
 *
 * @module tests/unit/src/lib/utils/monsterMultiattackExtractor.test
 */

import type { SubSection } from '@scripts/metadata/extraction/monsterFeatureExtractor';
import {
    extractMultiattack,
    featureId,
} from '@scripts/metadata/extraction/monsterMultiattackExtractor';
import { describe, expect, it } from 'vitest';

describe('featureId', () => {
  it('generates kebab-case slug/name ID', () => {
    expect(featureId('abominable-avian', 'Gnawing Bite')).toBe(
      'abominable-avian/gnawing-bite',
    );
  });

  it('strips non-alphanumeric characters', () => {
    expect(featureId('war-machine', 'Nulled Blade (Recharge 4–6)')).toBe(
      'war-machine/nulled-blade-recharge-4-6',
    );
  });
});

describe('extractMultiattack', () => {
  it('creates parent and child features from inline attacks', () => {
    const multiSub: SubSection = {
      name: 'Multiattack',
      lines: ['The avian makes one bite attack and one talons attack.'],
      origin: 'heading',
    };

    const childSubs: SubSection[] = [
      {
        name: 'Bite',
        lines: [
          '- **Bite.**  ',
          '  _Melee Weapon Attack:_ +8 to hit, reach 5 ft., one target.  ',
          '  _Hit:_ 13 (2d8 + 4) piercing damage.',
        ],
        origin: 'bold',
      },
      {
        name: 'Talons',
        lines: [
          '- **Talons.**  ',
          '  _Melee Weapon Attack:_ +8 to hit, reach 5 ft., one target.  ',
          '  _Hit:_ 11 (2d6 + 4) slashing damage.',
        ],
        origin: 'bold',
      },
    ];

    const features = extractMultiattack(multiSub, childSubs, 'action');

    expect(features).toHaveLength(3);

    const parent = features[0];
    expect(parent.name).toBe('Multiattack');
    expect(parent.multiattack).toBeDefined();
    expect(parent.multiattack!.attacks.length).toBeGreaterThan(0);

    const bite = features[1];
    expect(bite.name).toBe('Bite');
    expect(bite.attack).toBeDefined();
    expect(bite.attack!.type).toBe('melee');
    expect(bite.attack!.bonus).toBe(8);
    expect(bite.damage).toBe('2d8 + 4');
    expect(bite.damageType).toBe('piercing');

    const talons = features[2];
    expect(talons.name).toBe('Talons');
    expect(talons.damage).toBe('2d6 + 4');
    expect(talons.damageType).toBe('slashing');
  });

  it('handles multiattack with no inline children', () => {
    const multiSub: SubSection = {
      name: 'Multiattack',
      lines: ['The creature makes two claw attacks.'],
      origin: 'heading',
    };

    const features = extractMultiattack(
      multiSub,
      [],
      'test.sheet.mdx',
      10,
      15,
      'action',
    );

    expect(features).toHaveLength(1);
    expect(features[0].name).toBe('Multiattack');
    expect(features[0].multiattack).toBeDefined();
  });

  it('parses recharge on child attacks', () => {
    const multiSub: SubSection = {
      name: 'Multiattack',
      lines: ['Makes three attacks.'],
      origin: 'heading',
    };

    const childSubs: SubSection[] = [
      {
        name: 'Nulled Blade (Recharge 4–6)',
        lines: [
          '- **Nulled Blade (Recharge 4–6).**  ',
          '  _Melee Weapon Attack:_ +15 to hit, reach 10 ft., one target.  ',
          '  _Hit:_ 22 (4d10 + 9) force damage.',
        ],
        origin: 'bold',
      },
    ];

    const features = extractMultiattack(multiSub, childSubs, 'action');

    const blade = features[1];
    expect(blade.name).toBe('Nulled Blade (Recharge 4–6)');
    expect(blade.recharge).toBeDefined();
    expect(blade.recharge!.min).toBe(4);
    expect(blade.recharge!.max).toBe(6);
    expect(blade.damage).toBe('4d10 + 9');
    expect(blade.damageType).toBe('force');
  });

  it('parses saving throw on child attacks', () => {
    const multiSub: SubSection = {
      name: 'Multiattack',
      lines: ['Makes two attacks.'],
      origin: 'heading',
    };

    const childSubs: SubSection[] = [
      {
        name: 'Acid Shotgun',
        lines: [
          '- **Acid Shotgun.**  ',
          '  Each creature in a 30-foot cone must make a DC 19 Dexterity saving throw, taking 37 (8d8) chemical damage on a failure.',
        ],
        origin: 'bold',
      },
    ];

    const features = extractMultiattack(multiSub, childSubs, 'action');

    const shotgun = features[1];
    expect(shotgun.saving_throw).toBeDefined();
    expect(shotgun.saving_throw!.ability).toBe('dex');
    expect(shotgun.saving_throw!.dc).toBe(19);
  });
});
