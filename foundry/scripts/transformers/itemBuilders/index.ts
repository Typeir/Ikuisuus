/**
 * @fileoverview Barrel export for Foundry item builders.
 * @description Re-exports all builder modules and their public symbols.
 *
 * @module foundry/scripts/transformers/itemBuilders
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-14
 */

export { activation, resolveActivation } from './activation';
export { buildMultiattackItem } from './multiattackItem';
export { buildPassiveItem } from './passiveItem';
export { buildSaveFeatItem } from './saveFeatItem';
export {
    buildFlags,
    buildUses, EMPTY_DAMAGE_FIELD, toDamageField, toIdentifier
} from './utils';
export { buildWeaponItem } from './weaponItem';

