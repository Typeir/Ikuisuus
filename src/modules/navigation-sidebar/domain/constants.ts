/**
 * @fileoverview Constants for sidebar layout and animation
 * @module lib/components/sidebar/constants
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
 * transition defined in `sidebar.module.scss`. Children stay mounted for
 * this window so the collapse animation fully plays before the subtree
 * is unmounted.
 *
 * @constant
 * @type {number}
 */
export const SIDEBAR_CLOSE_ANIMATION_MS = 500;
