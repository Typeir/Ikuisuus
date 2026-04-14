/**
 * @fileoverview Unit tests for Feature Extractor Type Definitions
 * @description Tests for TypeScript interfaces used in the feature extraction
 * pipeline. Validates interface structure, type compatibility, and extension
 * relationships.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/types/feature - Feature type definitions
 */

import type {
    ActionToken,
    AttackToken,
    AutoFailToken,
    ChargeRechargeToken,
    DamageToken,
    DCToken,
    DeclareResolveToken,
    DeedCostToken,
    DiceToken,
    DurationToken,
    Feature,
    FeatureFlag,
    HitToken,
    MonsterFeature,
    MultiattackToken,
    PhaseToken,
    RangeToken,
    RechargeToken,
    ResourceToken,
    SaveToken,
    TemplateToken,
} from '@/lib/types/feature';
import { describe, expect, it } from 'vitest';

describe('feature types', () => {
  describe('DiceToken interface', () => {
    it('should be assignable with required properties', () => {
      const token: DiceToken = { count: 2, sides: 6 };
      expect(token.count).toBe(2);
      expect(token.sides).toBe(6);
    });

    it('should accept optional modifier', () => {
      const token: DiceToken = { count: 1, sides: 8, modifier: '+3' };
      expect(token.modifier).toBe('+3');
    });
  });

  describe('DamageToken interface', () => {
    it('should be assignable with dice only', () => {
      const token: DamageToken = { dice: { count: 3, sides: 10 } };
      expect(token.dice.count).toBe(3);
    });

    it('should accept damage type', () => {
      const token: DamageToken = { dice: { count: 2, sides: 6 }, type: 'fire' };
      expect(token.type).toBe('fire');
    });
  });

  describe('DCToken interface', () => {
    it('should be assignable with flat DC', () => {
      const token: DCToken = { flat: 16 };
      expect(token.flat).toBe(16);
    });

    it('should be assignable with formula DC', () => {
      const token: DCToken = { formula: '8 + Prof + CHA mod' };
      expect(token.formula).toBe('8 + Prof + CHA mod');
    });
  });

  describe('SaveToken interface', () => {
    it('should be assignable with ability and DC', () => {
      const token: SaveToken = { ability: 'dex', dc: { flat: 15 } };
      expect(token.ability).toBe('dex');
      expect(token.dc.flat).toBe(15);
    });
  });

  describe('RangeToken interface', () => {
    it('should be assignable with distance only', () => {
      const token: RangeToken = { distance: 30 };
      expect(token.distance).toBe(30);
    });

    it('should accept shape and dimensions', () => {
      const token: RangeToken = { distance: 60, shape: 'cone', width: 10 };
      expect(token.shape).toBe('cone');
    });
  });

  describe('AttackToken interface', () => {
    it('should be assignable for melee attack', () => {
      const token: AttackToken = {
        type: 'melee',
        bonus: 7,
        reach: 5,
        targets: 'one target',
      };
      expect(token.type).toBe('melee');
      expect(token.bonus).toBe(7);
    });

    it('should be assignable for ranged attack', () => {
      const token: AttackToken = {
        type: 'ranged',
        bonus: 5,
        range: { normal: 80, long: 320 },
        targets: 'one creature',
      };
      expect(token.range?.long).toBe(320);
    });
  });

  describe('MultiattackToken interface', () => {
    it('should be assignable with attack list', () => {
      const token: MultiattackToken = {
        attacks: [
          { name: 'claw', count: 2 },
          { name: 'bite', count: 1 },
        ],
        mode: 'all',
      };
      expect(token.attacks).toHaveLength(2);
    });
  });

  describe('PhaseToken interface', () => {
    it('should accept numeric threshold', () => {
      const token: PhaseToken = { name: 'wounded', threshold: 75 };
      expect(token.threshold).toBe(75);
    });

    it('should accept slain threshold', () => {
      const token: PhaseToken = { name: 'slain', threshold: 'slain' };
      expect(token.threshold).toBe('slain');
    });
  });

  describe('FeatureFlag type', () => {
    it('should accept all defined flag values', () => {
      const flags: FeatureFlag[] = [
        'unparseable',
        'ambiguous_resource',
        'ambiguous_target',
        'multi_option',
        'cross_reference',
        'scaling',
        'nested_feature',
        'template_expr',
        'weird_mechanic',
        'auto_fail',
        'escalation',
        'conditional_multiattack',
        'multi_aspect',
        'shared_resource',
      ];
      expect(flags).toHaveLength(14);
    });
  });

  describe('Feature interface', () => {
    it('should be assignable with minimal required properties', () => {
      const feature: Feature = {
        id: 'rimelord/avalanche-blade',
        name: 'Avalanche Blade',
        source: { start: 10, end: 25, archetype: 'C' },
        description: 'Summons an ice blade.',
        rawText: '## Avalanche Blade\nSummons an ice blade.',
        flags: [],
      };
      expect(feature.id).toBe('rimelord/avalanche-blade');
      expect(feature.flags).toEqual([]);
    });

    it('should accept all optional properties', () => {
      const feature: Feature = {
        id: 'test/full',
        name: 'Full Feature',
        source: { start: 1, end: 50, archetype: 'A' },
        trigger: 'action',
        target: { type: 'creature', range: 30, scope: 'single' },
        damage: { dice: { count: 2, sides: 6 }, type: 'fire' },
        healing: { dice: { count: 1, sides: 8 }, modifier: '+WIS' },
        saving_throw: { ability: 'dex', dc: { flat: 15 } },
        save_effect: 'damage:half',
        range: 60,
        duration: { value: '1 minute', concentration: true },
        resource: {
          type: 'charges',
          cost: 2,
          max: 5,
          recharge: { timing: 'long_rest' },
        },
        scaling: [{ level: 5, value: '3d6' }],
        children: [],
        pick_mode: 'choose_one',
        description: 'A fully populated feature.',
        rawText: 'Raw MDX text.',
        confidence: 0.95,
        flags: ['scaling', 'template_expr'],
      };
      expect(feature.trigger).toBe('action');
      expect(feature.resource?.recharge?.timing).toBe('long_rest');
    });
  });

  describe('MonsterFeature interface', () => {
    it('should extend Feature with monster-specific fields', () => {
      const feature: MonsterFeature = {
        id: 'mucklord/tentacle',
        name: 'Tentacle',
        flags: [],
        attack: { type: 'melee', bonus: 9, reach: 10, targets: 'one target' },
      };
      expect(feature.attack?.type).toBe('melee');
    });

    it('should accept multiattack token', () => {
      const feature: MonsterFeature = {
        id: 'mucklord/multiattack',
        name: 'Multiattack',
        flags: [],
        multiattack: {
          attacks: [{ name: 'tentacle', count: 2 }],
          mode: 'all',
        },
      };
      expect(feature.multiattack?.attacks[0].count).toBe(2);
    });

    it('should accept legendary deed data', () => {
      const feature: MonsterFeature = {
        id: 'yskeia/void-lance',
        name: 'Void Lance',
        flags: [],
        legendary_deed: { category: 'act', cost: 2 },
      };
      expect(feature.legendary_deed?.cost).toBe(2);
    });

    it('should accept phase trigger data', () => {
      const feature: MonsterFeature = {
        id: 'rubedo/bloodied',
        name: 'Bloodied Phase',
        flags: ['escalation'],
        phase: {
          hp_threshold: 50,
          name: 'bloodied',
          features_added: ['blood_nova'],
          features_modified: ['multiattack'],
        },
      };
      expect(feature.phase?.hp_threshold).toBe(50);
    });

    it('should accept all monster-specific optional fields', () => {
      const feature: MonsterFeature = {
        id: 'test/monster-full',
        name: 'Full Monster Feature',
        flags: ['weird_mechanic', 'auto_fail'],
        recharge: { min: 5, max: 6, charges: 3 },
        spellcasting: {
          level: 12,
          ability: 'cha',
          dc: 17,
          attack_bonus: 9,
          slots: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 1 },
          spells: ['fireball', 'counterspell'],
        },
        custom_condition: {
          name: 'Enthralled',
          effects: ['charmed', 'cannot move away'],
          cure: 'DC 15 Wisdom saving throw at end of turn',
        },
        relationship: 'shared_body',
        auto_fail_saves: true,
        escalation_mechanic: {
          type: 'crit_range',
          trigger: 'each round',
          per: 'round',
        },
      };
      expect(feature.auto_fail_saves).toBe(true);
      expect(feature.spellcasting?.spells).toHaveLength(2);
    });
  });

  describe('remaining token interfaces', () => {
    it('ResourceToken should be assignable', () => {
      const token: ResourceToken = { type: 'charges', amount: 3 };
      expect(token.type).toBe('charges');
    });

    it('RechargeToken should be assignable', () => {
      const token: RechargeToken = { timing: 'long_rest', amount: 2 };
      expect(token.timing).toBe('long_rest');
    });

    it('ActionToken should be assignable', () => {
      const token: ActionToken = { type: 'bonus_action' };
      expect(token.type).toBe('bonus_action');
    });

    it('DurationToken should be assignable', () => {
      const token: DurationToken = { value: '1 minute', concentration: true };
      expect(token.concentration).toBe(true);
    });

    it('TemplateToken should be assignable', () => {
      const token: TemplateToken = { expr: 'ability:WIS' };
      expect(token.expr).toBe('ability:WIS');
    });

    it('HitToken should be assignable', () => {
      const token: HitToken = {
        average: 12,
        dice: '2d8 + 3',
        type: 'slashing',
      };
      expect(token.average).toBe(12);
    });

    it('DeedCostToken should be assignable', () => {
      const token: DeedCostToken = { cost: 2 };
      expect(token.cost).toBe(2);
    });

    it('DeclareResolveToken should be assignable', () => {
      const token: DeclareResolveToken = { phase: 'declare' };
      expect(token.phase).toBe('declare');
    });

    it('AutoFailToken should be assignable', () => {
      const token: AutoFailToken = { fails: true };
      expect(token.fails).toBe(true);
    });

    it('ChargeRechargeToken should be assignable', () => {
      const token: ChargeRechargeToken = { charges: 3, min: 5, max: 6 };
      expect(token.charges).toBe(3);
    });
  });
});
