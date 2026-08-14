/**
 * @fileoverview Foundry feature parser for War Goddess Yskeia.
 * @description Returns dnd5e 5.3.0 Activity-model overrides; each handler
 * provides an `activities` map containing Save or Utility activities
 * replacing the generic transformer's auto-generated ones.
 * Handled features: Faterender Railgun, Arms Race, Tides of Ruin, Missile
 * Batteries, Warlings, Protected Air space.
 *
 * @module foundry/scripts/handlers/yskeiaParser
 * @version 3.0.0
 * @author Typeir
 * @since 2026-04-14
 *
 * @see {@link parser} for the class-level sheet binding decorator
 * @see {@link handler} for the method-level feature binding decorator
 * @see {@link createSaveActivity} for Save Activity factory
 */

import {
  createCustomDamagePart,
  createDamagePart,
  createSaveActivity,
  createUtilityActivity,
} from '../constants/activityTemplates';
import { handler, parser } from '../handlers/decorators';
import type { FoundryItemOverrides } from '../handlers/types';

/**
 * Feature parser for the War Goddess Yskeia monster sheet.
 * All values are hardcoded from the canonical stat block.
 *
 * @class YskeiaParser
 *
 * @param {string} sheetSlug - Set by the registry from `@parser` metadata
 */
@parser('war-goddess-yskeia')
class YskeiaParser {
  /** @type {string} */
  sheetSlug = '';

  /**
   * Faterender Railgun (Recharge 6) — Costs 1 Deed.
   * 10-ft-wide, 3000-ft-long line. DC 35 Dex save.
   * Damage = sum of target's ability scores (force).
   * Instant death if no score >= 20 on fail; HP reduced to 1 on success.
   * Sequential targeting; disintegrates creatures reduced to 0 HP.
   * Objects take 200 damage. Double damage vs Marked for Decommission.
   *
   * @returns {FoundryItemOverrides} Foundry item overrides with Save Activity
   */
  @handler('faterender-railgun-recharge-6')
  handleFaterenderRailgun(): FoundryItemOverrides {
    return {
      activities: {
        dnd5eactivity000: createSaveActivity({
          id: 'dnd5eactivity000',
          ability: 'dex',
          dcFormula: '35',
          onSave: 'half',
          damageParts: [createCustomDamagePart('sum(abilities)', 'force')],
          base: {
            activation: {
              type: 'action',
              value: 1,
              condition: 'Costs 1 Deed; Recharge 6',
              override: false,
            },
            range: { value: 3000, units: 'ft', special: '', override: false },
            target: {
              template: {
                type: 'line',
                value: 3000,
                units: 'ft',
                width: 10,
              },
              affects: { type: '', count: '', special: '' },
              override: false,
            },
          },
        }),
      },
      flags: {
        'ikuisuus-damocles': {
          textPipe: true,
          sequentialTargeting: true,
          disintegrate: true,
          objectDamage: 200,
          markSynergy: true,
          instantDeathThreshold: 20,
          ignoresResistances: true,
          ignoresImmunities: true,
          ignoresCover: true,
        },
      },
    };
  }

  /**
   * Arms Race — Lair Deed.
   * Deploys 2 ordinance maelstroms at targets within 1 mile.
   * 5-ft-thick, 5-ft-radius rings expanding +5 ft/turn to max 60 ft.
   * DC 25 Dex save: 30 (6d10) fire + 30 (6d10) piercing.
   * Collision resonance: 100 force damage in 300-ft radius (DC 25 Dex).
   * Maelstroms are hollow; damage affects Yskeia.
   *
   * @returns {FoundryItemOverrides} Foundry item overrides with Save Activity
   */
  @handler('arms-race')
  handleArmsRace(): FoundryItemOverrides {
    return {
      activities: {
        dnd5eactivity000: createSaveActivity({
          id: 'dnd5eactivity000',
          ability: 'dex',
          dcFormula: '25',
          onSave: 'half',
          damageParts: [
            createDamagePart(6, 10, 'fire'),
            createDamagePart(6, 10, 'piercing'),
          ],
          base: {
            activation: {
              type: 'lair',
              value: 1,
              condition: 'Lair Deed',
              override: false,
            },
            range: { value: 1, units: 'mi', special: '', override: false },
            target: {
              template: { type: 'radius', value: 5, units: 'ft', width: '' },
              affects: { type: '', count: '', special: '' },
              override: false,
            },
          },
        }),
      },
      flags: {
        'ikuisuus-damocles': {
          textPipe: true,
          maelstromCount: 2,
          thickness: 5,
          expansionRate: 5,
          maxRadius: 60,
          collisionDamage: 100,
          collisionDamageType: 'force',
          collisionBlastRadius: 300,
          expandsPerTurn: true,
          hollow: true,
          affectsSelf: true,
        },
      },
    };
  }

  /**
   * Tides of Ruin — Lair Deed.
   * 10-ft-thick wall spanning the battlefield, advances 5 ft/turn.
   * Up to 4 tides active simultaneously.
   * DC 30 Str save: 300 (60d10) bludgeoning; restrained on fail.
   * Escape DC 28 Strength check. Pushed 30 ft on success.
   * Shrapnel collapse: 200 (40d10) piercing in 40-ft radius (DC 25 Dex).
   * Destroys nonmagical terrain; crushes Huge-or-smaller objects.
   *
   * @returns {FoundryItemOverrides} Foundry item overrides with Save Activity
   */
  @handler('tides-of-ruin')
  handleTidesOfRuin(): FoundryItemOverrides {
    return {
      activities: {
        dnd5eactivity000: createSaveActivity({
          id: 'dnd5eactivity000',
          ability: 'str',
          dcFormula: '30',
          onSave: 'half',
          damageParts: [createDamagePart(60, 10, 'bludgeoning')],
          base: {
            activation: {
              type: 'lair',
              value: 1,
              condition: 'Lair Deed',
              override: false,
            },
            target: {
              template: { type: 'wall', value: 10, units: 'ft', width: '' },
              affects: { type: '', count: '', special: '' },
              override: false,
            },
          },
        }),
      },
      flags: {
        'ikuisuus-damocles': {
          textPipe: true,
          wallThickness: 10,
          advanceRate: 5,
          maxConcurrent: 4,
          restrainOnFail: true,
          escapeDC: 28,
          pushOnSuccess: 30,
          shrapnelDamage: '40d10',
          shrapnelDamageType: 'piercing',
          shrapnelRadius: 40,
          shrapnelSaveDC: 25,
          destroysTerrain: true,
          crushesObjects: true,
          advancesPerTurn: true,
        },
      },
    };
  }

  /**
   * Missile Batteries (4 charges, Recharge 4–6) — Action.
   * Auto-hit 1-mile range, 23 force damage per charge.
   * Ignores cover, resistance, and magical barriers.
   * Only blocked by the shield spell.
   *
   * @returns {FoundryItemOverrides} Foundry item overrides with Utility Activity
   */
  @handler('missile-batteries-4-charges-recharge-4-6')
  handleMissileBatteries(): FoundryItemOverrides {
    return {
      activities: {
        dnd5eactivity000: createUtilityActivity({
          base: {
            activation: {
              type: 'action',
              value: 1,
              condition: '4 charges; Recharge 4–6',
              override: false,
            },
            range: {
              value: 5280,
              units: 'ft',
              special: '1 mile',
              override: false,
            },
          },
        }),
      },
      flags: {
        'ikuisuus-damocles': {
          textPipe: true,
          autoHit: true,
          flatDamage: 23,
          flatDamageType: 'force',
          ignoresResistances: true,
          ignoresCover: true,
          penetratesBarriers: true,
          blockedBy: ['shield'],
        },
      },
    };
  }

  /**
   * Warlings (Recharge 5–6) — Action.
   * Deploys up to 4 Warling constructs within 30 ft.
   * Medium constructs: AC 18, 50 HP, 40/fly 60 ft.
   *
   * @returns {FoundryItemOverrides} Foundry item overrides with Utility Activity
   */
  @handler('warlings-recharge-5-6')
  handleWarlings(): FoundryItemOverrides {
    return {
      activities: {
        dnd5eactivity000: createUtilityActivity({
          base: {
            activation: {
              type: 'action',
              value: 1,
              condition: 'Recharge 5–6',
              override: false,
            },
            range: { value: 30, units: 'ft', special: '', override: false },
          },
        }),
      },
      flags: {
        'ikuisuus-damocles': {
          textPipe: true,
          summonCount: 4,
          summonType: 'Warling',
          summonAC: 18,
          summonHP: 50,
          summonSpeed: '40 ft., fly 60 ft.',
        },
      },
    };
  }

  /**
   * Protected Air space — Reaction.
   * DC 35 Dex save vs flying creature within lair.
   * 243 flat force damage on fail; stunned until start of next turn.
   * Forced 10 ft toward ground on success; no damage.
   *
   * @returns {FoundryItemOverrides} Foundry item overrides with Save Activity
   */
  @handler('protected-air-space')
  handleProtectedAirSpace(): FoundryItemOverrides {
    return {
      activities: {
        dnd5eactivity000: createSaveActivity({
          id: 'dnd5eactivity000',
          ability: 'dex',
          dcFormula: '35',
          onSave: 'none',
          damageParts: [createCustomDamagePart('243', 'force')],
          base: {
            activation: {
              type: 'reaction',
              value: 1,
              condition: 'When a creature attempts flight within lair',
              override: false,
            },
          },
        }),
      },
      flags: {
        'ikuisuus-damocles': {
          textPipe: true,
          stunOnFail: true,
          pushOnSuccess: 10,
          pushDirection: 'toward ground',
          triggerCondition: 'flight',
        },
      },
    };
  }
}

export { YskeiaParser };

