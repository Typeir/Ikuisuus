/**
 * @fileoverview Plain Left Click Predicate — modifier-aware click gating
 * @description Decides whether a click on a link may be intercepted for
 * client-side routing. Navigation controls must be real anchors so the browser
 * can serve middle-click, ctrl/cmd-click, shift-click and the context menu
 * itself. Those gestures are the browser's to handle, so any handler that
 * calls `preventDefault` has to stand down for them and act only on an
 * unmodified primary-button press.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import { isPlainLeftClick } from '@/lib/utils/isPlainLeftClick';
 *
 * const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
 *   if (!isPlainLeftClick(event)) return;
 *   event.preventDefault();
 *   router.push(href);
 * };
 * ```
 * @module src/lib/utils/isPlainLeftClick
 */

/**
 * Structural subset of a mouse event needed to classify a click.
 *
 * Declared structurally rather than against `MouseEvent` so both React's
 * synthetic events and native DOM events satisfy it without a cast.
 *
 * @interface ClickLike
 * @property {number} button - Pressed button; 0 is the primary button
 * @property {boolean} metaKey - Whether Meta/Command was held
 * @property {boolean} ctrlKey - Whether Control was held
 * @property {boolean} shiftKey - Whether Shift was held
 * @property {boolean} altKey - Whether Alt/Option was held
 * @property {boolean} [defaultPrevented] - Whether an earlier handler already claimed the event
 */
export interface ClickLike {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented?: boolean;
}

/**
 * Reports whether a click is an unmodified primary-button press that no
 * earlier handler has claimed.
 *
 * Returns `false` for middle and secondary buttons, for any modifier
 * combination the browser maps to "open elsewhere", and for events already
 * defaulted-prevented upstream. Callers treat `false` as "leave it to the
 * browser" and return without touching the event.
 *
 * @param {ClickLike} event - The click to classify
 * @returns {boolean} True when the handler may intercept and route in-page
 */
export const isPlainLeftClick = (event: ClickLike): boolean =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey &&
  !event.defaultPrevented;
