/**
 * @fileoverview Default values and base builder for dnd5e 5.3 Activities.
 * @description Provides the shared `buildBase()` factory and default blocks
 * (activation, target, range, duration) used by all Activity type factories.
 *
 * @module foundry/scripts/constants/activityDefaults
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-14
 *
 * @see {@link buildBase} for shared Activity base construction
 */

import type {
  ActivityActivation,
  ActivityBase,
  ActivityDuration,
  ActivityRange,
  ActivityTarget,
} from '../handlers/types';

/**
 * Default activation — 1 action, no condition, no override.
 *
 * @returns {ActivityActivation} Default activation block
 */
export function defaultActivation(): ActivityActivation {
  return { type: 'action', value: 1, condition: '', override: false };
}

/**
 * Default target — empty template and affects blocks.
 *
 * @returns {ActivityTarget} Default target block
 */
export function defaultTarget(): ActivityTarget {
  return {
    template: { type: '', value: '', units: 'ft', width: '' },
    affects: { type: '', count: '', special: '' },
    override: false,
  };
}

/**
 * Default range — no value, feet units.
 *
 * @returns {ActivityRange} Default range block
 */
export function defaultRange(): ActivityRange {
  return { value: null, units: 'ft', special: '', override: false };
}

/**
 * Default duration — instantaneous.
 *
 * @returns {ActivityDuration} Default duration block
 */
export function defaultDuration(): ActivityDuration {
  return { value: '', units: 'inst', special: '', override: false };
}

/**
 * Builds the base fields shared by all dnd5e Activity types.
 *
 * @param {string} id - Activity document ID (e.g. "dnd5eactivity000")
 * @param {string} type - Activity type discriminant
 * @param {Partial<ActivityBase>} [overrides] - Optional field overrides
 * @returns {ActivityBase} Base activity data
 */
export function buildBase(
  id: string,
  type: string,
  overrides?: Partial<ActivityBase>,
): ActivityBase {
  return {
    _id: id,
    type,
    activation: overrides?.activation ?? defaultActivation(),
    consumption: overrides?.consumption ?? { targets: [], scaling: { allowed: false, max: '' } },
    description: overrides?.description ?? { chatFlavor: '' },
    duration: overrides?.duration ?? defaultDuration(),
    effects: overrides?.effects ?? [],
    range: overrides?.range ?? defaultRange(),
    target: overrides?.target ?? defaultTarget(),
    uses: overrides?.uses ?? { spent: 0, max: '', recovery: [] },
    sort: overrides?.sort ?? 0,
  };
}
