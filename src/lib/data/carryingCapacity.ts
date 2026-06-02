/**
 * @fileoverview Carrying Capacity re-exports (deprecated)
 * @description Backward-compatibility re-exports. Use direct imports from
 * `@/modules/character-builder/domain/carrying-capacity` and
 * `@/modules/character-builder/infrastructure/carrying-capacity` instead.
 *
 * @module lib/data/carryingCapacity
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 * @deprecated Use character-builder module imports directly
 */

export {
    LOAD_PENALTIES,
    QUADRUPED_MULTIPLIERS,
    SIZE_MULTIPLIERS,
    STR_TABLE
} from '@/modules/character-builder/domain/carrying-capacity';
export type {
    CapacityThresholds,
    CreatureSize
} from '@/modules/character-builder/domain/carrying-capacity';
export { computeCapacity } from '@/modules/character-builder/infrastructure/carrying-capacity';

