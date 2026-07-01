/**
 * @fileoverview Unit tests for Shared Feature Token Recognizers
 * @description Validates the 10 shared token recognizer functions: dice,
 * damage, DC, save, range, resource, recharge, action, duration, and
 * template recognizers.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/utils/featureTokens - Shared token recognizer functions
 */

import {
    recognizeAction,
    recognizeDamage,
    recognizeDC,
    recognizeDice,
    recognizeDuration,
    recognizeRange,
    recognizeRecharge,
    recognizeResource,
    recognizeSave,
    recognizeTemplate,
} from '@scripts/metadata/extraction/featureTokens';
import { describe, expect, it } from 'vitest';

describe('shared token recognizers', () => {
  describe('recognizeDice', () => {
    it('should parse simple dice expression', () => {
      const result = recognizeDice('Deal 2d6 damage');
      expect(result).toEqual({ count: 2, sides: 6 });
    });

    it('should parse dice with positive modifier', () => {
      const result = recognizeDice('1d8+3 slashing');
      expect(result).toEqual({ count: 1, sides: 8, modifier: '+3' });
    });

    it('should parse dice with negative modifier', () => {
      const result = recognizeDice('2d10 - 2 force');
      expect(result).toEqual({ count: 2, sides: 10, modifier: '-2' });
    });

    it('should parse dice with ability modifier', () => {
      const result = recognizeDice('1d12 + STR modifier');
      expect(result).toEqual({ count: 1, sides: 12, modifier: '+STR' });
    });

    it('should return null for non-dice text', () => {
      expect(recognizeDice('no dice here')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(recognizeDice('')).toBeNull();
    });
  });

  describe('recognizeDamage', () => {
    it('should parse dice with damage type', () => {
      const result = recognizeDamage('2d6 fire damage');
      expect(result).toEqual({ dice: { count: 2, sides: 6 }, type: 'fire' });
    });

    it('should parse dice without damage type', () => {
      const result = recognizeDamage('deal 3d8 damage');
      expect(result).toEqual({ dice: { count: 3, sides: 8 } });
    });

    it('should detect dark damage', () => {
      const result = recognizeDamage('takes 4d10 dark damage');
      expect(result?.type).toBe('dark');
    });

    it('should detect true damage', () => {
      const result = recognizeDamage('suffers 1d4 true damage');
      expect(result?.type).toBe('true');
    });

    it('should return null for no dice', () => {
      expect(recognizeDamage('takes 5 fire damage')).toBeNull();
    });
  });

  describe('recognizeDC', () => {
    it('should parse flat DC', () => {
      const result = recognizeDC('DC 16 Constitution saving throw');
      expect(result).toEqual({ flat: 16 });
    });

    it('should parse formula DC', () => {
      const result = recognizeDC('DC = 8 + Prof + CHA mod)');
      expect(result).toEqual({ formula: '8 + Prof + CHA mod' });
    });

    it('should return null for no DC text', () => {
      expect(recognizeDC('make a saving throw')).toBeNull();
    });

    it('should handle DC at end of string', () => {
      const result = recognizeDC('with a DC 14');
      expect(result).toEqual({ flat: 14 });
    });
  });

  describe('recognizeSave', () => {
    it('should parse full ability name saving throw', () => {
      const result = recognizeSave('Wisdom saving throw');
      expect(result).toEqual({ ability: 'wis', dc: {} });
    });

    it('should parse short ability name save', () => {
      const result = recognizeSave('DEX save');
      expect(result).toEqual({ ability: 'dex', dc: {} });
    });

    it('should parse save with DC', () => {
      const result = recognizeSave('DC 15 Constitution saving throw');
      expect(result?.ability).toBe('con');
      expect(result?.dc.flat).toBe(15);
    });

    it('should return null for no save text', () => {
      expect(recognizeSave('make an ability check')).toBeNull();
    });
  });

  describe('recognizeRange', () => {
    it('should parse simple range', () => {
      const result = recognizeRange('within 30 feet');
      expect(result).toEqual({ distance: 30 });
    });

    it('should parse range with shape', () => {
      const result = recognizeRange('60-foot cone');
      expect(result).toEqual({ distance: 60, shape: 'cone' });
    });

    it('should parse range with ft abbreviation', () => {
      const result = recognizeRange('reach 10 ft.');
      expect(result).toEqual({ distance: 10 });
    });

    it('should detect width', () => {
      const result = recognizeRange('120-foot line that is 10-foot wide');
      expect(result?.distance).toBe(120);
      expect(result?.width).toBe(10);
    });

    it('should return null for no range text', () => {
      expect(recognizeRange('no range here')).toBeNull();
    });
  });

  describe('recognizeResource', () => {
    it('should parse charges', () => {
      const result = recognizeResource('expend 2 charges');
      expect(result).toEqual({ type: 'charges', amount: 2 });
    });

    it('should parse sorcery points', () => {
      const result = recognizeResource('costs 3 sorcery points');
      expect(result).toEqual({ type: 'sorcery_points', amount: 3 });
    });

    it('should parse spell slots', () => {
      const result = recognizeResource('expend 1 spell slot');
      expect(result).toEqual({ type: 'spell_slot', amount: 1 });
    });

    it('should parse hit dice', () => {
      const result = recognizeResource('spend 2 hit dice');
      expect(result).toEqual({ type: 'hit_dice', amount: 2 });
    });

    it('should parse deeds', () => {
      const result = recognizeResource('costs 3 deeds');
      expect(result).toEqual({ type: 'deeds', amount: 3 });
    });

    it('should return null for no resource text', () => {
      expect(recognizeResource('you can do this freely')).toBeNull();
    });
  });

  describe('recognizeRecharge', () => {
    it('should parse short rest', () => {
      const result = recognizeRecharge('recharges on a short rest');
      expect(result?.timing).toBe('short_rest');
    });

    it('should parse long rest', () => {
      const result = recognizeRecharge('recovers after a long rest');
      expect(result?.timing).toBe('long_rest');
    });

    it('should parse dawn', () => {
      const result = recognizeRecharge('at dawn, you regain 3 charges');
      expect(result).toEqual({ timing: 'dawn', amount: 3 });
    });

    it('should parse once per day', () => {
      const result = recognizeRecharge('once per day');
      expect(result).toEqual({ timing: 'once_per_day', amount: 1 });
    });

    it('should return null for no recharge text', () => {
      expect(recognizeRecharge('you can always do this')).toBeNull();
    });
  });

  describe('recognizeAction', () => {
    it('should parse action', () => {
      expect(recognizeAction('as an action')).toEqual({ type: 'action' });
    });

    it('should parse bonus action', () => {
      expect(recognizeAction('as a bonus action')).toEqual({
        type: 'bonus_action',
      });
    });

    it('should parse reaction', () => {
      expect(recognizeAction('you can use your reaction')).toEqual({
        type: 'reaction',
      });
    });

    it('should parse free action', () => {
      expect(recognizeAction('as a free action')).toEqual({ type: 'free' });
    });

    it('should parse passive', () => {
      expect(recognizeAction('passive ability')).toEqual({ type: 'passive' });
    });

    it('should return null for no action text', () => {
      expect(recognizeAction('nothing here')).toBeNull();
    });

    it('should not match bonus when parsing action', () => {
      const result = recognizeAction('as a bonus action on your turn');
      expect(result?.type).toBe('bonus_action');
    });
  });

  describe('recognizeDuration', () => {
    it('should parse instant', () => {
      expect(recognizeDuration('instantaneous')).toEqual({
        value: 'instant',
        concentration: false,
      });
    });

    it('should parse time duration', () => {
      const result = recognizeDuration('lasts for 1 minute');
      expect(result).toEqual({ value: '1 minute', concentration: false });
    });

    it('should parse plural time duration', () => {
      const result = recognizeDuration('for 10 minutes');
      expect(result).toEqual({ value: '10 minutes', concentration: false });
    });

    it('should detect concentration', () => {
      const result = recognizeDuration('concentration, up to 1 minute');
      expect(result).toEqual({ value: 'up to 1 minute', concentration: true });
    });

    it('should parse until dismissed', () => {
      const result = recognizeDuration('until dismissed');
      expect(result).toEqual({
        value: 'until dismissed',
        concentration: false,
      });
    });

    it('should return null for no duration text', () => {
      expect(recognizeDuration('no duration')).toBeNull();
    });
  });

  describe('recognizeTemplate', () => {
    it('should parse ability modifier reference', () => {
      const result = recognizeTemplate('equal to your Wisdom modifier');
      expect(result).toEqual({ expr: 'ability:WIS' });
    });

    it('should parse tier bonus reference', () => {
      const result = recognizeTemplate('add your tier bonus');
      expect(result).toEqual({ expr: 'prof' });
    });

    it('should parse class level reference', () => {
      const result = recognizeTemplate('your Druid level');
      expect(result).toEqual({ expr: 'level:Druid' });
    });

    it('should return null for no template text', () => {
      expect(recognizeTemplate('plain text')).toBeNull();
    });
  });
});
