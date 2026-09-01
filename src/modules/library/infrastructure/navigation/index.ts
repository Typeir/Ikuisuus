/**
 * @fileoverview Navigation infrastructure exports for the library module.
 * @module modules/library/infrastructure/navigation/index
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

export { repositoryShallowWalk, repositoryWalk } from './repositoryWalk';
export type { WalkNode } from './types';
export { walk, walkTree } from './walkFull';
export {
    SHALLOW_WALK_DEPTH,
    STUB_CHILD_THRESHOLD,
    shallowWalk,
} from './walkShallow';

