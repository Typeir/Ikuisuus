/**
 * @fileoverview Events the page raises about itself.
 * @description Some of what a reader sees is measured off the document —
 * where the headings sit
 *
 * @module lib/constants/domEvents
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 */

/** Raised when a disclosure opens to reveal what a hash was pointing at. */
export const DETAILS_OPENED_EVENT = 'ik:details-opened';

/** Raised when a component swaps out what the page is showing. */
export const CONTENT_CHANGED_EVENT = 'ik:content-changed';

/** Raised on an element to ask whatever hides it to show it. */
export const REVEAL_EVENT = 'ik:reveal';
