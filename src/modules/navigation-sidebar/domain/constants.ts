/**
 * @fileoverview Domain constants for navigation-sidebar module.
 * @module modules/navigation-sidebar/domain/constants
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

/**
 * Base pixel height per sidebar row.
 *
 * @constant {number}
 */
export const BASE_HEIGHT = 52;

/**
 * CSS animation duration for sidebar close transition (ms).
 * Children remain mounted during this window for full collapse animation.
 *
 * @constant {number}
 */
export const SIDEBAR_CLOSE_ANIMATION_MS = 500;

/**
 * Child count threshold triggering virtualization.
 * Below this, recursive Sidebar component renders normally.
 * At or above this, react-window List renders instead.
 *
 * @constant {number}
 */
export const VIRTUALIZATION_THRESHOLD = 100;

/**
 * Maximum directory depth for shallow walk operations.
 * API returns two levels deep; directories at depth 2 are stub nodes
 * for pagination expansion.
 *
 * @constant {number}
 */
export const SHALLOW_WALK_DEPTH = 2;
