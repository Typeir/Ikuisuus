/**
 * @fileoverview Target shapes barrel export
 * @description Combines combat and generic shapes into the unified priority-ordered array.
 *
 * @module scripts/content/migration/shapes
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { COMBAT_SHAPES } from './shapesCombat';
import { GENERIC_SHAPES } from './shapesGeneric';
import type { TargetShape } from './types';

/** All target shapes in priority order (combat first, then generic). */
export const TARGET_SHAPES: TargetShape[] = [
  ...COMBAT_SHAPES,
  ...GENERIC_SHAPES,
];
