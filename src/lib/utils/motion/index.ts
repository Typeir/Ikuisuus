/**
 * @fileoverview Measurement and lifecycle plumbing for CSS-driven motion.
 * @module lib/utils/motion
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @description Nothing here animates anything, and nothing here knows about
 * React. The motion itself stays in the stylesheet, as transitions and easing
 * curves; what these carry is the part CSS cannot do for itself — deciding when
 * to measure, keeping a measurement from feeding the layout it was taken from,
 * and knowing when an element has reached its resting line. Each watcher hands
 * back the function that stops it, so whatever owns its lifetime may be React,
 * a scene manager, or a plain script.
 */

export { frameLoop, type FrameLoop } from './frameLoop';
export { setPx, setPxOrDrop } from './setPx';
export { watchResize } from './watchResize';
export { watchStuck } from './watchStuck';
export { watchVisible } from './watchVisible';
export { watchViewport } from './watchViewport';
