/**
 * @fileoverview Lifetime bindings for the plain motion watchers.
 * @module lib/hooks/motion
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @description Each of these is a few lines around a watcher from
 * `lib/utils/motion`, and carries the one thing React is actually needed for:
 * knowing when the subscription should stop. The logic itself lives there, and
 * runs without React.
 */

export { useFrameLoop } from './useFrameLoop';
export { useResizeSignal } from './useResizeSignal';
export { useStuck, type Stuck } from './useStuck';
export { useViewportSignal } from './useViewportSignal';
