/**
 * @fileoverview Unit tests for Pre-compiled Regex Pattern Dictionary
 * @description Validates all exported pattern groups, lookup sets, maps,
 * and iteration arrays in featurePatterns.ts against representative inputs.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/utils/featurePatterns - Pattern dictionary module
 */

import {
  ABILITY_MAP,
  ABILITY_SHORTS,
  ACTIONS,
  DAMAGE_TYPES,
  DICE,
  DISTANCE,
  DURATION,
  MONSTER,
  RECHARGE_TIMINGS,
  RESOURCE_ENTRIES,
  RESOURCES,
  SAVES,
  SHAPES,
  STRUCTURE,
  TEMPLATES,
  WORD_NUMBERS,
} from '@scripts/metadata/extraction/featurePatterns';
import { describe, expect, it } from 'vitest';

describe('featurePatterns', () => {
  describe('DICE', () => {
    it('full should match dice with modifier', () => {
      const m = '1d8+3 slashing'.match(DICE.full);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('1');
      expect(m![2]).toBe('8');
    });

    it('bare should match NdN', () => {
      expect(DICE.bare.test('2d6')).toBe(true);
    });

    it('damageFormula should capture damage type', () => {
      const m = 'deals 2d6 fire damage'.match(DICE.damageFormula);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('fire');
    });

    it('chargesInitial should match holds N charges', () => {
      expect(DICE.chargesInitial.test('holds 10 charges')).toBe(true);
    });

    it('chargesRecover should capture amount and timing', () => {
      const m = 'regains 1d6 charges each dawn'.match(DICE.chargesRecover);
      expect(m).not.toBeNull();
      expect(m![2]).toBe('dawn');
    });

    it('chargesDepletes should match depletion phrases', () => {
      expect(DICE.chargesDepletes.test('becomes inert')).toBe(true);
      expect(DICE.chargesDepletes.test('burns away')).toBe(true);
    });

    it('heirloomDamage should capture dice and type', () => {
      const m = '1d8 slashing'.match(DICE.heirloomDamage);
      expect(m).not.toBeNull();
      expect(m![2]).toBe('slashing');
    });
  });

  describe('SAVES', () => {
    it('dcFormula should capture a formula written after DC', () => {
      const m = 'DC 10 + Prof + CHA mod)'.match(SAVES.dcFormula);
      expect(m).not.toBeNull();
      expect(m![1]).toContain('10 + Prof');
    });

    it('dcFormula should still capture the legacy DC = form', () => {
      const m = 'saving throw (DC = result)'.match(SAVES.dcFormula);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('result');
    });

    it('dcFormula should not match a flat DC', () => {
      expect('DC 16 Wisdom saving throw'.match(SAVES.dcFormula)).toBeNull();
    });

    it('dcFlat should capture numeric DC', () => {
      const m = 'DC 16'.match(SAVES.dcFlat);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('16');
    });

    it('savingThrow should match ability + save', () => {
      expect(SAVES.savingThrow.test('Wisdom saving throw')).toBe(true);
      expect(SAVES.savingThrow.test('DEX save')).toBe(true);
    });

    it('savingThrowWithDC should capture DC and ability', () => {
      const m = 'DC 16 Wisdom saving throw'.match(SAVES.savingThrowWithDC);
      expect(m).not.toBeNull();
      expect(m![1]).toBe('16');
      expect(m![2]).toBe('Wisdom');
    });

    it('autoFail should match auto-fail phrases', () => {
      expect(SAVES.autoFail.test('automatically fails all saving throws')).toBe(
        true,
      );
    });
  });

  describe('DISTANCE', () => {
    it('feet should match foot/feet/ft variants', () => {
      expect(DISTANCE.feet.test('30 feet')).toBe(true);
      expect(DISTANCE.feet.test('60-foot')).toBe(true);
      expect(DISTANCE.feet.test('10 ft.')).toBe(true);
    });

    it('wide should match width expressions', () => {
      expect(DISTANCE.wide.test('10-foot wide')).toBe(true);
    });

    it('high should match height expressions', () => {
      expect(DISTANCE.high.test('20 feet high')).toBe(true);
      expect(DISTANCE.high.test('30-foot tall')).toBe(true);
    });

    it('reach should capture reach distance', () => {
      const m = 'reach 10 ft'.match(DISTANCE.reach);
      expect(m![1]).toBe('10');
    });

    it('range should capture normal and long ranges', () => {
      const m = 'range 30/120 ft'.match(DISTANCE.range);
      expect(m![1]).toBe('30');
      expect(m![2]).toBe('120');
    });

    it('aoeShape should match shape keywords', () => {
      expect(DISTANCE.aoeShape.test('cone')).toBe(true);
      expect(DISTANCE.aoeShape.test('sphere')).toBe(true);
      expect(DISTANCE.aoeShape.test('wall')).toBe(true);
    });
  });

  describe('ACTIONS', () => {
    it('minorAction should match "Minor Action"', () => {
      expect(ACTIONS.minorAction.test('as a Minor Action')).toBe(true);
    });

    it('reaction should match "reaction"', () => {
      expect(ACTIONS.reaction.test('use your reaction')).toBe(true);
    });

    it('freeAction should match "free action"', () => {
      expect(ACTIONS.freeAction.test('as a free action')).toBe(true);
    });

    it('passive should match "passive"', () => {
      expect(ACTIONS.passive.test('this is passive')).toBe(true);
    });

    it('ritual should match "ritual"', () => {
      expect(ACTIONS.ritual.test('cast as a ritual')).toBe(true);
    });
  });

  describe('DURATION', () => {
    it('concentration should match keyword', () => {
      expect(DURATION.concentration.test('Concentration, up to 1')).toBe(true);
    });

    it('instantaneous should match both forms', () => {
      expect(DURATION.instantaneous.test('instant')).toBe(true);
      expect(DURATION.instantaneous.test('instantaneous')).toBe(true);
    });

    it('upTo should capture amount and unit', () => {
      const m = 'up to 10 minutes'.match(DURATION.upTo);
      expect(m![1]).toBe('10');
      expect(m![2]).toBe('minute');
    });

    it('timeUnit should capture amount and unit', () => {
      const m = '1 hour'.match(DURATION.timeUnit);
      expect(m![1]).toBe('1');
      expect(m![2]).toBe('hour');
    });

    it('untilDismissed should match', () => {
      expect(DURATION.untilDismissed.test('until dismissed')).toBe(true);
    });

    it('untilEndOfTurn should match variants', () => {
      expect(DURATION.untilEndOfTurn.test('until the end of your turn')).toBe(
        true,
      );
      expect(
        DURATION.untilEndOfTurn.test('until the end of its next turn'),
      ).toBe(true);
    });
  });

  describe('RESOURCES', () => {
    it('charges should capture count', () => {
      const m = '3 charges'.match(RESOURCES.charges);
      expect(m![1]).toBe('3');
    });

    it('spellSlot should match spell slot variants', () => {
      expect(RESOURCES.spellSlot.test('1 spell slot')).toBe(true);
      expect(RESOURCES.spellSlot.test('2 slots')).toBe(true);
    });

    it('boonPoints should match BP shorthand', () => {
      expect(RESOURCES.boonPoints.test('5 BP')).toBe(true);
      expect(RESOURCES.boonPoints.test('3 boon points')).toBe(true);
    });

    it('rechargeAmount should capture amount', () => {
      const m = 'regains 3'.match(RESOURCES.rechargeAmount);
      expect(m![1]).toBe('3');
    });

    it('oncePer should capture time unit', () => {
      const m = 'once per day'.match(RESOURCES.oncePer);
      expect(m![1]).toBe('day');
    });

    it('rechargeAfter should capture condition', () => {
      const m = 'recharges after a Recovery.'.match(RESOURCES.rechargeAfter);
      expect(m![1]).toBe('Recovery');
    });
  });

  describe('TEMPLATES', () => {
    it('abilityModifier should capture ability name', () => {
      const m = 'your Wisdom modifier'.match(TEMPLATES.abilityModifier);
      expect(m![1]).toBe('Wisdom');
    });

    it('tierBonus should match', () => {
      expect(TEMPLATES.tierBonus.test('your tier bonus')).toBe(true);
    });

    it('classLevel should capture class name', () => {
      const m = 'your Warrior level'.match(TEMPLATES.classLevel);
      expect(m![1]).toBe('Warrior');
    });

    it('compositeFormula should capture components', () => {
      const m = '8 + Tier + CHA modifier'.match(TEMPLATES.compositeFormula);
      expect(m![1]).toBe('8');
      expect(m![2]).toBe('CHA');
    });
  });

  describe('MONSTER', () => {
    it('attackLine should parse attack header', () => {
      const m = '_Melee Weapon Attack:_ +7 to hit'.match(MONSTER.attackLine);
      expect(m![1]).toBe('Melee');
      expect(m![3]).toBe('7');
    });

    it('hitLine should parse damage line', () => {
      const m = '_Hit:_ 12 (2d8 + 3) slashing damage'.match(MONSTER.hitLine);
      expect(m![1]).toBe('12');
      expect(m![2]).toBe('2d8 + 3');
    });

    it('multiattack should match keyword', () => {
      expect(MONSTER.multiattack.test('Multiattack.')).toBe(true);
    });

    it('deedCost should capture cost', () => {
      const m = '(Costs 2 Deeds)'.match(MONSTER.deedCost);
      expect(m![1]).toBe('2');
    });

    it('phaseThreshold should capture name and percent', () => {
      const m = 'Wounded (75%'.match(MONSTER.phaseThreshold);
      expect(m![1]).toBe('Wounded');
      expect(m![2]).toBe('75');
    });

    it('phaseSlain should match Slain', () => {
      expect(MONSTER.phaseSlain.test('Slain')).toBe(true);
    });

    it('declareResolve should capture phase', () => {
      const m = '**Declare**: something'.match(MONSTER.declareResolve);
      expect(m![1]).toBe('Declare');
    });

    it('chargeRecharge should capture charges and range', () => {
      const m = '(3 charges, Recharge 5-6)'.match(MONSTER.chargeRecharge);
      expect(m![1]).toBe('3');
      expect(m![2]).toBe('5');
      expect(m![3]).toBe('6');
    });

    it('targets should match target phrases', () => {
      expect(MONSTER.targets.test('one target')).toBe(true);
      expect(MONSTER.targets.test('two creatures')).toBe(true);
    });

    it('passivePerception should capture value', () => {
      const m = 'passive Perception 14'.match(MONSTER.passivePerception);
      expect(m![1]).toBe('14');
    });
  });

  describe('STRUCTURE', () => {
    it('numericWithParen should capture number and parenthetical', () => {
      const m = '18 (natural armor)'.match(STRUCTURE.numericWithParen);
      expect(m![1]).toBe('18');
      expect(m![2]).toBe('natural armor');
    });

    it('blendedImageSrc should capture src path', () => {
      const m = '<BlendedImage src="/library/images/map.webp" />'.match(
        STRUCTURE.blendedImageSrc,
      );
      expect(m![1]).toBe('/library/images/map.webp');
    });

    it('weight should capture pounds', () => {
      const m = '2.5 lbs'.match(STRUCTURE.weight);
      expect(m![1]).toBe('2.5');
    });
  });

  describe('lookup tables', () => {
    it('DAMAGE_TYPES should contain 13 types', () => {
      expect(DAMAGE_TYPES.size).toBe(13);
      expect(DAMAGE_TYPES.has('fire')).toBe(true);
      expect(DAMAGE_TYPES.has('true')).toBe(true);
    });

    it('ABILITY_SHORTS should contain 6 abilities', () => {
      expect(ABILITY_SHORTS.size).toBe(6);
      expect(ABILITY_SHORTS.has('str')).toBe(true);
      expect(ABILITY_SHORTS.has('cha')).toBe(true);
    });

    it('ABILITY_MAP should map long to short names', () => {
      expect(ABILITY_MAP['strength']).toBe('str');
      expect(ABILITY_MAP['charisma']).toBe('cha');
      expect(Object.keys(ABILITY_MAP)).toHaveLength(6);
    });

    it('SHAPES should contain expected shapes', () => {
      expect(SHAPES.has('cone')).toBe(true);
      expect(SHAPES.has('sphere')).toBe(true);
      expect(SHAPES.has('wall')).toBe(true);
      expect(SHAPES.size).toBe(8);
    });

    it('WORD_NUMBERS should map words to numbers', () => {
      expect(WORD_NUMBERS['one']).toBe(1);
      expect(WORD_NUMBERS['ten']).toBe(10);
      expect(Object.keys(WORD_NUMBERS)).toHaveLength(10);
    });

    it('RESOURCE_ENTRIES should have 8 ordered entries', () => {
      expect(RESOURCE_ENTRIES).toHaveLength(8);
      expect(RESOURCE_ENTRIES[0].type).toBe('charges');
      expect(RESOURCE_ENTRIES[7].type).toBe('deeds');
    });

    it('RECHARGE_TIMINGS should have 6 entries', () => {
      expect(RECHARGE_TIMINGS).toHaveLength(6);
      expect(RECHARGE_TIMINGS[0].timing).toBe('repose');
      expect(RECHARGE_TIMINGS[5].timing).toBe('dusk');
    });
  });
});
