/**
 * @fileoverview Writes a pixel custom property, ignoring changes too small to see.
 * @module lib/utils/motion/setPx
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * How far a number must move before it is worth writing, in pixels.
 */
const SLACK = 2;

/**
 * Writes a measured length to a custom property, unless it barely moved.
 *
 * @description A property that feeds the layout it was measured from closes a
 * loop: writing it resizes the thing measured, the observer runs again, and
 * the two answers differ by a rounding error rather than settling. Ignoring a
 * change smaller than anyone can see ends the loop where the arithmetic will
 * not.
 *
 * @param {HTMLElement} el - The element carrying the property.
 * @param {string} prop - The custom property's name, `--` and all.
 * @param {number} value - The measured length in pixels.
 * @param {number} [slack] - How far it must move to be worth a write.
 * @returns {boolean} Whether it was written.
 */
export function setPx(
  el: HTMLElement,
  prop: string,
  value: number,
  slack: number = SLACK,
): boolean {
  const next = Math.round(value);
  const had = Number.parseFloat(el.style.getPropertyValue(prop));

  if (Number.isFinite(had) && Math.abs(next - had) < slack) return false;

  el.style.setProperty(prop, `${next}px`);
  return true;
}

/**
 * Writes a measured length, or takes the property away when there is none.
 *
 * @description A property left behind at its last value is worse than absent,
 * since the stylesheet's own fallback never gets its turn.
 *
 * @param {HTMLElement} el - The element carrying the property.
 * @param {string} prop - The custom property's name, `--` and all.
 * @param {number | null} value - The measured length, or null when unmeasurable.
 * @returns {void} Nothing.
 */
export function setPxOrDrop(
  el: HTMLElement,
  prop: string,
  value: number | null,
): void {
  if (value === null || value <= 0) el.style.removeProperty(prop);
  else setPx(el, prop, value);
}
