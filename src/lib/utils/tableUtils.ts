/**
 * Table Utilities Compatibility Exports
 *
 * @fileoverview Backward-compatible table comparator exports.
 * Re-exports metadata-table comparator utilities from the metadata-tables module
 * to preserve legacy import paths used by existing components and tests.
 *
 * @module src/lib/utils/tableUtils
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/modules/metadata-tables/domain/comparators
 */

export {
  compareByOrder,
  compareChallengeRating,
  parseChallengeRating,
} from '@/modules/metadata-tables/domain/comparators';
