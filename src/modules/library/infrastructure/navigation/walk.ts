/**
 * @fileoverview Compatibility barrel for split navigation walk modules.
 * @module modules/library/infrastructure/navigation/walk
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

export type { WalkNode } from './types';
export { walk, walkTree } from './walkFull';
export { SHALLOW_WALK_DEPTH, shallowWalk } from './walkShallow';

