/**
 * @fileoverview Timing constants for UI behavior, in milliseconds.
 * @module src/lib/constants/delays
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 *
 * Shared timeout/delay constants used across UI components.
 */

/**
 * Delay used to show the 'saving' indicator in the Encounter Planner (ms)
 * Matches the UI animation timing for the save indicator.
 * @constant {number}
 */
export const ENCOUNTER_SAVE_INDICATOR_MS = 300;

/**
 * Grace period between the pointer leaving a hover surface's trigger and the
 * surface beginning to close (ms).
 *
 * @constant {number}
 *
 * @description
 * WCAG 2.1 SC 1.4.13 (Content on Hover or Focus) requires that content raised
 * by hover stay available while the pointer travels onto it.
 */
export const TOOLTIP_HIDE_DELAY_MS = 300;
