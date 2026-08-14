/**
 * @fileoverview Tests featureTransformer (dnd5e 5.3 Activity model).
 * @description Verifies MonsterFeature records transform into dnd5e
 * Activity-model Foundry Items and that ParserRegistry overrides merge
 * when a handler exists for a feature.
 *
 * @module tests/unit/scripts/foundry/featureTransformer.test
 * @version 2.0.0
 * @author Typeir
 * @since 2026-04-14
 */

import { describe, expect, it } from 'vitest';
import { ParserRegistry } from '../../../../foundry/scripts/handlers/registry';
import type {
    AttackActivity,
    SaveActivity,
    UtilityActivity,
} from '../../../../foundry/scripts/handlers/types';
import { YskeiaParser } from '../../../../foundry/scripts/parsers/yskeiaParser';
import {
    parseDamageFormula,
    transformFeature,
} from '../../../../foundry/scripts/transformers/featureTransformer';
import type { MonsterFeature } from '../../../../src/lib/types/feature';

/** @returns {ParserRegistry} Registry pre-loaded with YskeiaParser */
function createRegistry(): ParserRegistry {
  return new ParserRegistry([YskeiaParser as unknown as new () => any]);
}

/** @returns {MonsterFeature} Minimal attack feature for testing */
function makeAttackFeature(): MonsterFeature {
  return {
    id: 'war-goddess-yskeia/spear-of-retribution',
    name: 'Spear of Retribution',
    trigger: 'action',
    attack: {
      type: 'ranged',
      bonus: 22,
      targets: 'one target',
      reach: 20,
      range: { normal: 120, long: 360 },
    },
    damage: '12d8+13',
    damageType: 'piercing',
    damageFlat: '7d8',
    damageFlatType: 'radiant',
    saving_throw: { ability: 'str', dc: 25 },
    target: { range: 20 },
    flags: [],
    meta: { critRange: '18' },
  };
}

/** @returns {MonsterFeature} Passive trait with no attack or damage */
function makePassiveFeature(): MonsterFeature {
  return {
    id: 'war-goddess-yskeia/primeval-plating',
    name: 'Primeval Plating',
    trigger: 'passive',
    flags: [],
    meta: { customHandler: 'destructible_component' },
  };
}

/** @returns {MonsterFeature} Feature with multiattack */
function makeMultiattackFeature(): MonsterFeature {
  return {
    id: 'test/multiattack',
    name: 'Multiattack',
    trigger: 'action',
    flags: [],
    multiattack: {
      attacks: [
        { name: 'Claw', count: 2 },
        { name: 'Bite', count: 1 },
      ],
      mode: 'all',
    },
  };
}

/** @returns {MonsterFeature} Feature that has a parser handler */
function makeHandledFeature(): MonsterFeature {
  return {
    id: 'war-goddess-yskeia/faterender-railgun-recharge-6',
    name: 'Faterender Railgun (Recharge 6)',
    trigger: 'action',
    saving_throw: { ability: 'dex', dc: 35 },
    target: { type: 'line', range: 10 },
    recharge: { min: 6, max: 6 },
    flags: [],
    legendary_deed: { category: 'act', cost: 1 },
    meta: { customHandler: 'faterender_railgun', instantDeath: 'true' },
  };
}

describe('parseDamageFormula', () => {
  it('parses standard formula', () => {
    expect(parseDamageFormula('2d6+4')).toEqual({
      count: 2,
      sides: 6,
      bonus: '+4',
    });
  });

  it('parses formula with spaces', () => {
    expect(parseDamageFormula('12d8 + 13')).toEqual({
      count: 12,
      sides: 8,
      bonus: '+13',
    });
  });

  it('parses formula without bonus', () => {
    expect(parseDamageFormula('10d10')).toEqual({
      count: 10,
      sides: 10,
      bonus: '',
    });
  });

  it('returns null for unparseable', () => {
    expect(parseDamageFormula('sum(abilities)')).toBeNull();
  });
});

describe('transformFeature — weapon attack (Activity model)', () => {
  const registry = createRegistry();

  it('generates a deterministic _id', () => {
    const item = transformFeature(
      makeAttackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    expect(item._id).toHaveLength(16);
    expect(item._id).toMatch(/^[A-Za-z0-9]+$/);
    expect(item._id).toBe(
      transformFeature(makeAttackFeature(), registry, 'testActor123456xx', 0)
        ._id,
    );
  });

  it('maps weapon attacks to "weapon" type', () => {
    const item = transformFeature(
      makeAttackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    expect(item.type).toBe('weapon');
  });

  it('sets system.type to natural weapon', () => {
    const item = transformFeature(
      makeAttackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    expect(item.system.type).toEqual({ value: 'natural', baseItem: '' });
  });

  it('sets system.damage.base as DamageField', () => {
    const item = transformFeature(
      makeAttackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const dmg = item.system.damage as { base: Record<string, unknown> };
    expect(dmg.base).toEqual({
      number: 12,
      denomination: 8,
      bonus: '+13',
      types: ['piercing'],
      custom: { enabled: false, formula: '' },
    });
  });

  it('sets system.equipped and proficient', () => {
    const item = transformFeature(
      makeAttackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    expect(item.system.equipped).toBe(true);
    expect(item.system.proficient).toBe(1);
  });

  it('creates Attack Activity with correct ability', () => {
    const item = transformFeature(
      makeAttackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const activities = item.system.activities as Record<string, AttackActivity>;
    const atk = activities['dnd5eactivity000'];
    expect(atk.type).toBe('attack');
    expect(atk.attack.ability).toBe('dex');
    expect(atk.attack.bonus).toBe('22');
    expect(atk.attack.flat).toBe(true);
    expect(atk.attack.type.value).toBe('ranged');
    expect(atk.attack.type.classification).toBe('weapon');
  });

  it('creates Save Activity when feature has saving_throw', () => {
    const item = transformFeature(
      makeAttackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const activities = item.system.activities as Record<string, SaveActivity>;
    const save = activities['dnd5eactivity100'];
    expect(save.type).toBe('save');
    expect(save.save.ability).toBe('str');
    expect(save.save.dc.formula).toBe('25');
  });

  it('includes secondary damage in Save Activity', () => {
    const item = transformFeature(
      makeAttackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const activities = item.system.activities as Record<string, SaveActivity>;
    const save = activities['dnd5eactivity100'];
    expect(save.damage.parts).toHaveLength(1);
    expect(save.damage.parts[0].types).toEqual(['radiant']);
  });

  it('preserves meta as flags', () => {
    const item = transformFeature(
      makeAttackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const flags = item.flags['ikuisuus-damocles'] as Record<string, unknown>;
    expect(flags.critRange).toBe('18');
    expect(flags.featureId).toBe('war-goddess-yskeia/spear-of-retribution');
  });

  it('sets range from attack data', () => {
    const item = transformFeature(
      makeAttackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const range = item.system.range as Record<string, unknown>;
    expect(range.reach).toBe(20);
    expect(range.long).toBe(360);
    expect(range.units).toBe('ft');
  });
});

describe('transformFeature — passive (Activity model)', () => {
  const registry = createRegistry();

  it('maps passive traits to "feat" type', () => {
    const item = transformFeature(
      makePassiveFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    expect(item.type).toBe('feat');
  });

  it('sets system.type to monster feat', () => {
    const item = transformFeature(
      makePassiveFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    expect(item.system.type).toEqual({ value: 'monster', subtype: '' });
  });

  it('has empty activities', () => {
    const item = transformFeature(
      makePassiveFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    expect(item.system.activities).toEqual({});
  });

  it('sets identifier from name', () => {
    const item = transformFeature(
      makePassiveFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    expect(item.system.identifier).toBe('primeval-plating');
  });
});

describe('transformFeature — multiattack (Activity model)', () => {
  const registry = createRegistry();

  it('creates feat with Utility Activity', () => {
    const item = transformFeature(
      makeMultiattackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    expect(item.type).toBe('feat');
    const activities = item.system.activities as Record<
      string,
      UtilityActivity
    >;
    expect(activities['dnd5eactivity000'].type).toBe('utility');
  });

  it('builds descriptive text from attack list', () => {
    const item = transformFeature(
      makeMultiattackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const desc = item.system.description as { value: string };
    expect(desc.value).toContain('2 Claw attacks');
    expect(desc.value).toContain('1 Bite attack');
  });

  it('sets action activation', () => {
    const item = transformFeature(
      makeMultiattackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const activities = item.system.activities as Record<
      string,
      UtilityActivity
    >;
    expect(activities['dnd5eactivity000'].activation.type).toBe('action');
  });
});

describe('transformFeature — recharge (Activity model)', () => {
  const registry = createRegistry();

  it('maps recharge to dnd5e uses with recovery', () => {
    const feat: MonsterFeature = {
      id: 'test/recharge-test',
      name: 'Recharge Test',
      trigger: 'action',
      recharge: { min: 5, max: 6 },
      flags: [],
    };
    const item = transformFeature(feat, registry, 'testActor123456xx', 0);
    expect(item.system.uses).toEqual({
      spent: 0,
      max: '1',
      recovery: [{ period: 'recharge', formula: '5-6' }],
    });
  });

  it('formats single-value recharge', () => {
    const feat: MonsterFeature = {
      id: 'test/recharge-6',
      name: 'Recharge 6',
      trigger: 'action',
      recharge: { min: 6, max: 6 },
      flags: [],
    };
    const item = transformFeature(feat, registry, 'testActor123456xx', 0);
    const uses = item.system.uses as { recovery: { formula: string }[] };
    expect(uses.recovery[0].formula).toBe('6');
  });
});

describe('transformFeature — lair deeds (Activity model)', () => {
  const registry = createRegistry();

  it('sets lair activation for lair deeds', () => {
    const feat: MonsterFeature = {
      id: 'war-goddess-yskeia/arms-race',
      name: 'Arms Race',
      trigger: 'action',
      legendary_deed: { category: 'lair', cost: 1 },
      flags: [],
    };
    const item = transformFeature(feat, registry, 'testActor123456xx', 0);
    const activities = item.system.activities as Record<string, SaveActivity>;
    expect(activities['dnd5eactivity000'].activation.type).toBe('lair');
  });
});

describe('transformFeature — handler overrides (Activity model)', () => {
  const registry = createRegistry();

  it('applies handler activities for Faterender Railgun', () => {
    const item = transformFeature(
      makeHandledFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const activities = item.system.activities as Record<string, SaveActivity>;
    const save = activities['dnd5eactivity000'];
    expect(save.type).toBe('save');
    expect(save.save.ability).toBe('dex');
    expect(save.save.dc.formula).toBe('35');
  });

  it('sets handler target template', () => {
    const item = transformFeature(
      makeHandledFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const activities = item.system.activities as Record<string, SaveActivity>;
    expect(activities['dnd5eactivity000'].target.template.type).toBe('line');
    expect(activities['dnd5eactivity000'].target.template.value).toBe(3000);
  });

  it('includes custom damage formula', () => {
    const item = transformFeature(
      makeHandledFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const activities = item.system.activities as Record<string, SaveActivity>;
    const parts = activities['dnd5eactivity000'].damage.parts;
    expect(parts).toHaveLength(1);
    expect(parts[0].custom.enabled).toBe(true);
    expect(parts[0].custom.formula).toBe('sum(abilities)');
    expect(parts[0].types).toEqual(['force']);
  });

  it('merges handler flags with base flags', () => {
    const item = transformFeature(
      makeHandledFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const flags = item.flags['ikuisuus-damocles'] as Record<string, unknown>;
    expect(flags.featureId).toBe(
      'war-goddess-yskeia/faterender-railgun-recharge-6',
    );
    expect(flags.textPipe).toBe(true);
    expect(flags.sequentialTargeting).toBe(true);
    expect(flags.instantDeathThreshold).toBe(20);
  });

  it('applies overrides for Arms Race', () => {
    const feat: MonsterFeature = {
      id: 'war-goddess-yskeia/arms-race',
      name: 'Arms Race',
      trigger: 'action',
      legendary_deed: { category: 'lair', cost: 1 },
      flags: [],
    };
    const item = transformFeature(feat, registry, 'testActor123456xx', 0);
    const flags = item.flags['ikuisuus-damocles'] as Record<string, unknown>;
    expect(flags.maelstromCount).toBe(2);
    expect(flags.collisionDamage).toBe(100);
  });

  it('applies overrides for Tides of Ruin', () => {
    const feat: MonsterFeature = {
      id: 'war-goddess-yskeia/tides-of-ruin',
      name: 'Tides of Ruin',
      trigger: 'action',
      legendary_deed: { category: 'lair', cost: 1 },
      flags: [],
    };
    const item = transformFeature(feat, registry, 'testActor123456xx', 0);
    const flags = item.flags['ikuisuus-damocles'] as Record<string, unknown>;
    expect(flags.wallThickness).toBe(10);
    expect(flags.shrapnelDamage).toBe('40d10');
    expect(flags.destroysTerrain).toBe(true);
  });

  it('does not apply overrides for unregistered features', () => {
    const item = transformFeature(
      makeAttackFeature(),
      registry,
      'testActor123456xx',
      0,
    );
    const flags = item.flags['ikuisuus-damocles'] as Record<string, unknown>;
    expect(flags.textPipe).toBeUndefined();
  });
});
