/**
 * @fileoverview Foundry feature parser for War Goddess Yskeia.
 * @description Returns dnd5e 5.3.0 Activity-model overrides; each handler
 * provides an `activities` map containing Save or Utility activities
 * replacing the generic transformer's auto-generated ones.
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

