/**
 * @fileoverview Where down the screen a reader is taken to be reading.
 * @module lib/constants/reading
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * How far down the screen the line a reader reads at sits, as a share of it.
 *
 * @description One number for three things that would otherwise disagree:
 * which section the track calls the one you are on, where a heading is put
 * when you ask to be taken to it, and how far through a sheet its bar says you
 * have come. Asking for a section should leave it where the track already
 * says you are, and the middle is where the eye goes.
 */
export const READING_LINE = 0.5;
