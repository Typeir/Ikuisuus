/**
 * @fileoverview Foundry feature parser for War Goddess Yskeia.
 * @description Dedicated handler class for Yskeia's Tier 3 text_pipe features.
 * Since this parser is bound to a specific sheet, all mechanic values are
 * known at authoring time and hardcoded — no regex extraction needed.
 *
 * Returns dnd5e 5.3.0 Activity-model overrides: each handler provides an
 * `activities` map containing Save or Utility activities that replace the
 * generic transformer's auto-generated activities.
 *
 * Handled features:
 * - **Faterender Railgun** — Line AoE, ability-score-sum damage, instant death,
 *   sequential targeting, disintegration, Mark synergy.
 * - **Arms Race** — Expanding maelstrom pair with collision resonance.
 * - **Tides of Ruin** — Advancing debris wall with restrain and shrapnel collapse.
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
@parser('war-godess-yskeia')
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
            range: { value: '3000', units: 'ft', special: '', override: false },
            target: {
              template: {
                type: 'line',
                value: '3000',
                units: 'ft',
                width: '10',
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
            range: { value: '1', units: 'mi', special: '', override: false },
            target: {
              template: { type: 'radius', value: '5', units: 'ft', width: '' },
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
              template: { type: 'wall', value: '10', units: 'ft', width: '' },
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
}

export { YskeiaParser };

