/**
 * Unit tests for the Meta Handler Registry.
 *
 * @module tests/unit/scripts/metadata/extraction/metaHandlers.test
 */

import type { MonsterFeature } from '@/lib/types/feature';
import {
  applyMetaHandler,
  getRegisteredHandlers,
} from '@scripts/metadata/extraction/metaHandlers';
import { describe, expect, it } from 'vitest';

/**
 * Creates a minimal MonsterFeature fixture for testing.
 *
 * @param {Partial<MonsterFeature>} [overrides] - Fields to override
 * @returns {MonsterFeature} Test fixture
 */
function makeFeat(overrides: Partial<MonsterFeature> = {}): MonsterFeature {
  return {
    id: 'test/feature',
    name: 'Test Feature',
    flags: [],
    ...overrides,
  };
}

describe('applyMetaHandler', () => {
  it('should return false and flag unparseable for unknown handlers', () => {
    const feat = makeFeat();
    const result = applyMetaHandler(feat, '', 'nonexistent_handler', {});
    expect(result).toBe(false);
    expect(feat.flags).toContain('unparseable');
    expect(feat.meta?.unknownHandler).toBe('nonexistent_handler');
  });

  it('should return true for known handlers', () => {
    const feat = makeFeat();
    const result = applyMetaHandler(feat, 'some body text', 'mark_target', {
      customHandler: 'mark_target',
    });
    expect(result).toBe(true);
  });
});

describe('getRegisteredHandlers', () => {
  it('should return all 8 registered handler names', () => {
    const handlers = getRegisteredHandlers();
    expect(handlers).toHaveLength(8);
    expect(handlers).toContain('destructible_component');
    expect(handlers).toContain('mark_target');
    expect(handlers).toContain('auto_hit');
    expect(handlers).toContain('summon');
    expect(handlers).toContain('geometry_teleport');
    expect(handlers).toContain('damage_reflection');
    expect(handlers).toContain('text_pipe');
    expect(handlers).toContain('environmental_zone');
  });
});

describe('destructible_component handler', () => {
  const body = `Yskeia has 4 Primeval Platings that can be destroyed.

> #### Primeval Plating
>
> | **Armor Class** | **Hit Points** | **Damage Threshold** |
> | --------------- | -------------- | -------------------- |
> | 30              | 100            | 25                   |
>
> - **Resistances**: All damage except **Force**
> - **Immunities**: **Poison**, **Psychic**, **Necrotic**, **Radiant**`;

  it('should extract component AC, HP, and damage threshold', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'destructible_component', {
      customHandler: 'destructible_component',
    });
    expect(feat.meta?.componentAC).toBe('30');
    expect(feat.meta?.componentHP).toBe('100');
    expect(feat.meta?.damageThreshold).toBe('25');
  });

  it('should extract component count', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'destructible_component', {
      customHandler: 'destructible_component',
    });
    expect(feat.meta?.componentCount).toBe('4');
  });

  it('should extract resistances and immunities', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'destructible_component', {
      customHandler: 'destructible_component',
    });
    expect(feat.meta?.componentResistances).toBe('All damage except **Force**');
    expect(feat.meta?.componentImmunities).toBe(
      '**Poison**, **Psychic**, **Necrotic**, **Radiant**',
    );
  });
});

describe('mark_target handler', () => {
  const body =
    "When Yskeia strikes a creature with any of its attacks, the target is **Marked for Decommission** until the end of Yskeia's next turn. Only one creature can be marked at a time.";

  it('should extract mark condition and duration', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'mark_target', {
      customHandler: 'mark_target',
    });
    expect(feat.meta?.markCondition).toBe('Marked for Decommission');
    expect(feat.meta?.markDuration).toContain('end of');
  });

  it('should detect single-target limit', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'mark_target', {
      customHandler: 'mark_target',
    });
    expect(feat.meta?.markLimit).toBe('1');
  });
});

describe('auto_hit handler', () => {
  const body =
    'Yskeia targets a creature of her choice within **1 mile**.\nThe targeted creature takes **23 force damage**. This attack cannot miss except by the usage of the _shield_ spell.\nThe attack ignores cover and resistance.';

  it('should set autoHit flag and extract damage', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'auto_hit', { customHandler: 'auto_hit' });
    expect(feat.meta?.autoHit).toBe('true');
    expect(feat.meta?.autoHitDamage).toBe('23');
    expect(feat.meta?.autoHitDamageType).toBe('force');
  });

  it('should extract range', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'auto_hit', { customHandler: 'auto_hit' });
    expect(feat.meta?.autoHitRange).toBe('1 mile');
  });

  it('should extract bypass condition', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'auto_hit', { customHandler: 'auto_hit' });
    expect(feat.meta?.autoHitBypass).toContain('shield');
  });
});

describe('summon handler', () => {
  const body = `As a Major Action, Yskeia deploys up to four **Warlings** into empty spaces within 30 ft. of her.

> #### Warling
>
> | **Armor Class** | **Hit Points** | **Speed**          |
> | --------------- | -------------- | ------------------ |
> | 18              | 50             | 40 ft., fly 60 ft. |
>
> **Tethered**: When Yskeia is incapacitated, all active Warlings immediately fall inert.`;

  it('should extract summon count and name', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'summon', { customHandler: 'summon' });
    expect(feat.meta?.summonCount).toBe('four');
    expect(feat.meta?.summonName).toBe('Warlings');
  });

  it('should NOT extract AC/HP (resolved from linked actor sheet)', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'summon', { customHandler: 'summon' });
    expect(feat.meta?.summonAC).toBeUndefined();
    expect(feat.meta?.summonHP).toBeUndefined();
  });

  it('should detect tethered relationship', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'summon', { customHandler: 'summon' });
    expect(feat.meta?.summonTethered).toBe('true');
  });
});

describe('geometry_teleport handler', () => {
  const body =
    'Yskeia instantly relocates to any point that maintains the exact same distance from the creature currently **Marked for Decommission**.\nThis movement does not provoke opportunity attacks, ignores terrain, and renders her immune to all damage and effects until the repositioning ends.';

  it('should set geometry teleport flag and constraint', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'geometry_teleport', {
      customHandler: 'geometry_teleport',
    });
    expect(feat.meta?.geometryTeleport).toBe('true');
    expect(feat.meta?.teleportConstraint).toBe('fixed_distance');
  });

  it('should extract anchor and immunity', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'geometry_teleport', {
      customHandler: 'geometry_teleport',
    });
    expect(feat.meta?.teleportAnchor).toBe('Marked for Decommission');
    expect(feat.meta?.teleportImmunity).toBe('true');
    expect(feat.meta?.teleportNoAoO).toBe('true');
  });
});

describe('damage_reflection handler', () => {
  const body =
    'Yskeia designates one creature she can see within 300 feet.\nThe target must succeed on a **DC 32 Charisma saving throw** or become linked to her for 1 minute.\nWhile linked, all damage the target deals to Yskeia is reflected back to it as **true damage**, and any healing the creature receives is instead granted to Yskeia.';

  it('should set reflection flag and extract range', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'damage_reflection', {
      customHandler: 'damage_reflection',
    });
    expect(feat.meta?.damageReflection).toBe('true');
    expect(feat.meta?.reflectionRange).toBe('300');
  });

  it('should extract save DC and ability', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'damage_reflection', {
      customHandler: 'damage_reflection',
    });
    expect(feat.meta?.reflectionSaveDC).toBe('32');
    expect(feat.meta?.reflectionSaveAbility).toBe('charisma');
  });

  it('should detect healing drain', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'damage_reflection', {
      customHandler: 'damage_reflection',
    });
    expect(feat.meta?.reflectionHealing).toBe('drain');
  });
});

describe('text_pipe handler', () => {
  const body =
    'Yskeia fires a blinding rail of divine kinetic energy in a line. All creatures in the area must make a saving throw.';

  it('should set textPipe flag and nothing else', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'text_pipe', {
      customHandler: 'text_pipe',
    });
    expect(feat.meta?.textPipe).toBe('true');
  });

  it('should pass through extra attributes', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'text_pipe', {
      customHandler: 'text_pipe',
      notes: 'complex mechanic',
    });
    expect(feat.meta?.textPipe).toBe('true');
    expect(feat.meta?.notes).toBe('complex mechanic');
  });
});

describe('environmental_zone handler', () => {
  const body =
    'For the next **3 rounds**, the sky over a **1-mile radius** becomes a field of superheated debris.\nAll creatures gain the conditions **[Burning](/en/library/rules/conditions)** and **[Suffocating](/en/library/rules/conditions)** until they exit.\nVisibility is reduced to **30 feet** due to radiant overexposure.';

  it('should set zone flag and extract duration/radius', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'environmental_zone', {
      customHandler: 'environmental_zone',
    });
    expect(feat.meta?.environmentalZone).toBe('true');
    expect(feat.meta?.zoneDuration).toBe('3 rounds');
    expect(feat.meta?.zoneRadius).toBe('1 mile');
  });

  it('should extract linked conditions', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'environmental_zone', {
      customHandler: 'environmental_zone',
    });
    expect(feat.meta?.zoneConditions).toContain('Burning');
    expect(feat.meta?.zoneConditions).toContain('Suffocating');
  });

  it('should extract visibility restriction', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'environmental_zone', {
      customHandler: 'environmental_zone',
    });
    expect(feat.meta?.zoneVisibility).toBe('30 feet');
  });
});

describe('passthrough attributes', () => {
  it('should pass non-reserved attributes to feat.meta', () => {
    const feat = makeFeat();
    applyMetaHandler(feat, 'some body', 'mark_target', {
      customHandler: 'mark_target',
      notes: 'extra info',
      variant: 'alpha',
    });
    expect(feat.meta?.notes).toBe('extra info');
    expect(feat.meta?.variant).toBe('alpha');
  });

  it('should not overwrite handler-set keys with passthrough attrs', () => {
    const body =
      'the target is **Doom Marked** until the end of the turn. Only one creature can be marked at a time.';
    const feat = makeFeat();
    applyMetaHandler(feat, body, 'mark_target', {
      customHandler: 'mark_target',
      markLimit: '5',
    });
    expect(feat.meta?.markLimit).toBe('1');
  });
});
