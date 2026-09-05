/**
 * @fileoverview DOM queries shared by the card host tests.
 * @description Assertions read structure and derived values rather than label
 * text, since the message catalogue is not loaded under test and a translator
 * echoes its key.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/cardQueries
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

/**
 * Slot names printed by a card, in the order they appear.
 *
 * @returns {string[]} Slot names
 */
export const printed = (): string[] =>
  Array.from(document.querySelectorAll('[data-slot-grid] [data-slot]')).map(
    (row) => row.getAttribute('data-slot') ?? '',
  );

/**
 * Text of the card's italic brief.
 *
 * @param {string} mark - Brief data attribute
 * @returns {string} Brief text
 */
export const briefText = (mark: string): string =>
  document.querySelector(`[${mark}]`)?.textContent ?? '';
