/**
 * @fileoverview Unit tests for Monster-Specific Token Recognizers
 * @description Validates the 8 monster token recognizer functions: attack
 * lines, hit lines, multiattack, deed costs, phase thresholds,
 * declare/resolve markers, auto-fail, and charge-recharge notations.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/utils/monsterTokens - Monster token recognizer functions
 */

import {
    recognizeAttackLine,
    recognizeAutoFail,
    recognizeChargeRecharge,
    recognizeDeclareResolve,
    recognizeDeedCost,
    recognizeHitLine,
    recognizeMultiattack,
    recognizePhaseThreshold,
} from '@/lib/utils/monsterTokens';
import { describe, expect, it } from 'vitest';

describe('monster token recognizers', () => {
  describe('recognizeAttackLine', () => {
    it('should parse melee weapon attack', () => {
      const result = recognizeAttackLine(
        '_Melee Weapon Attack:_ +7 to hit, reach 5 ft., one target',
      );
      expect(result).toEqual({
        type: 'melee',
        bonus: 7,
        reach: 5,
        targets: 'one target',
      });
    });

    it('should parse ranged weapon attack', () => {
      const result = recognizeAttackLine(
        '_Ranged Weapon Attack:_ +5 to hit, range 80/320 ft., one target',
      );
      expect(result?.type).toBe('ranged');
      expect(result?.bonus).toBe(5);
      expect(result?.range).toEqual({ normal: 80, long: 320 });
    });

    it('should parse spell attack', () => {
      const result = recognizeAttackLine(
        '_Ranged Spell Attack:_ +9 to hit, range 120 ft., one creature',
      );
      expect(result?.type).toBe('spell');
      expect(result?.bonus).toBe(9);
    });

    it('should return null for non-attack text', () => {
      expect(recognizeAttackLine('The creature swings its claws')).toBeNull();
    });
  });

  describe('recognizeHitLine', () => {
    it('should parse hit line with damage type', () => {
      const result = recognizeHitLine('_Hit:_ 12 (2d8 + 3) slashing damage');
      expect(result).toEqual({
        average: 12,
        dice: '2d8 + 3',
        type: 'slashing',
      });
    });

    it('should parse hit line with bludgeoning', () => {
      const result = recognizeHitLine('_Hit:_ 7 (1d10 + 2) bludgeoning damage');
      expect(result?.average).toBe(7);
      expect(result?.type).toBe('bludgeoning');
    });

    it('should return null for non-hit text', () => {
      expect(recognizeHitLine('The attack deals additional damage')).toBeNull();
    });
  });

  describe('recognizeMultiattack', () => {
    it('should parse simple multiattack', () => {
      const text = '**Multiattack.** The creature makes two claw attacks.';
      const result = recognizeMultiattack(text);
      expect(result?.attacks).toEqual([{ name: 'claw', count: 2 }]);
      expect(result?.mode).toBe('all');
    });

    it('should parse multiattack with multiple attack types', () => {
      const text =
        '**Multiattack.** The creature makes two claw attacks and one bite attack.';
      const result = recognizeMultiattack(text);
      expect(result?.attacks).toContainEqual({ name: 'claw', count: 2 });
      expect(result?.attacks).toContainEqual({ name: 'bite', count: 1 });
      expect(result?.mode).toBe('all');
    });

    it('should detect exclusive mode with or', () => {
      const text =
        '**Multiattack.** The creature makes two claw attacks or one slam attack.';
      const result = recognizeMultiattack(text);
      expect(result?.mode).toBe('exclusive');
    });

    it('should detect conditional multiattack', () => {
      const text =
        '**Multiattack.** The creature makes four claw attacks while in Bloodrage.';
      const result = recognizeMultiattack(text);
      expect(result?.condition).toContain('Bloodrage');
    });

    it('should return null for non-multiattack text', () => {
      expect(recognizeMultiattack('The creature attacks once.')).toBeNull();
    });
  });

  describe('recognizeDeedCost', () => {
    it('should parse deed cost', () => {
      const result = recognizeDeedCost('**Void Lance (Costs 2 Deeds).**');
      expect(result).toEqual({ cost: 2 });
    });

    it('should parse single deed cost', () => {
      const result = recognizeDeedCost('**Tail Sweep (Cost 1 Deed).**');
      expect(result).toEqual({ cost: 1 });
    });

    it('should return null for no deed cost', () => {
      expect(recognizeDeedCost('**Claw.** Melee attack')).toBeNull();
    });
  });

  describe('recognizePhaseThreshold', () => {
    it('should parse Wounded phase', () => {
      const result = recognizePhaseThreshold('### Wounded (75%)');
      expect(result).toEqual({ name: 'wounded', threshold: 75 });
    });

    it('should parse Bloodied phase', () => {
      const result = recognizePhaseThreshold('### Bloodied (50%)');
      expect(result).toEqual({ name: 'bloodied', threshold: 50 });
    });

    it('should parse Doomed phase', () => {
      const result = recognizePhaseThreshold('### Doomed (25%)');
      expect(result).toEqual({ name: 'doomed', threshold: 25 });
    });

    it('should parse Slain marker', () => {
      const result = recognizePhaseThreshold('### Slain');
      expect(result).toEqual({ name: 'slain', threshold: 'slain' });
    });

    it('should return null for non-phase text', () => {
      expect(recognizePhaseThreshold('### Actions')).toBeNull();
    });
  });

  describe('recognizeDeclareResolve', () => {
    it('should parse Declare marker', () => {
      const result = recognizeDeclareResolve('**Declare:** Choose a target');
      expect(result).toEqual({ phase: 'declare' });
    });

    it('should parse Resolve marker', () => {
      const result = recognizeDeclareResolve('**Resolve (at start of turn):**');
      expect(result).toEqual({ phase: 'resolve' });
    });

    it('should return null for no declare/resolve text', () => {
      expect(recognizeDeclareResolve('Just some text')).toBeNull();
    });
  });

  describe('recognizeAutoFail', () => {
    it('should detect auto-fail saving throws', () => {
      const result = recognizeAutoFail(
        'The creature automatically fails all saving throws',
      );
      expect(result).toEqual({ fails: true });
    });

    it('should detect auto-succeed saving throws', () => {
      const result = recognizeAutoFail(
        'The creature automatically succeeds saving throws',
      );
      expect(result).toEqual({ fails: false });
    });

    it('should return null for no auto-fail text', () => {
      expect(
        recognizeAutoFail('The creature makes saving throws normally'),
      ).toBeNull();
    });
  });

  describe('recognizeChargeRecharge', () => {
    it('should parse charge-recharge with range', () => {
      const result = recognizeChargeRecharge('(3 charges, Recharge 5-6)');
      expect(result).toEqual({ charges: 3, min: 5, max: 6 });
    });

    it('should parse charge-recharge with single number', () => {
      const result = recognizeChargeRecharge('(2 charges, Recharge 6)');
      expect(result).toEqual({ charges: 2, min: 6, max: 6 });
    });

    it('should handle en-dash separator', () => {
      const result = recognizeChargeRecharge('(4 charges, Recharge 4–6)');
      expect(result).toEqual({ charges: 4, min: 4, max: 6 });
    });

    it('should return null for no charge-recharge text', () => {
      expect(recognizeChargeRecharge('(Recharge 5-6)')).toBeNull();
    });
  });
});
