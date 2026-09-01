/**
 * @fileoverview Constants for sidebar layout and animation
 * @module modules/navigation-sidebar/domain/constants
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

/**
 * Base height per sidebar item in pixels
 * @constant
 * @type {number}
 */
export const BASE_HEIGHT = 52;

/**
 * Duration in milliseconds that matches the `max-height` CSS closing
 * transition in `sidebar.module.scss`.
 *
 * @constant
 * @type {number}
 */
export const SIDEBAR_CLOSE_ANIMATION_MS = 500;

/**
 * Threshold for virtualization in sidebar rendering.
 * When the number of items exceeds this, virtualization is applied.
 *
 * @constant
 * @type {number}
 */
export const VIRTUALIZATION_THRESHOLD = 50;

/**
 * Maximum depth for shallow walk traversal of the sidebar tree.
 *
 * @constant
 * @type {number}
 */
export const SHALLOW_WALK_DEPTH = 2;
