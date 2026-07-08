/**
 * @fileoverview Domain types for the Section Track feature.
 * @module modules/library/domain/sectionTrack
 * @author Typeir
 * @version 1.0.0
 * @since 7.0.0
 */

/**
 * Represents a heading element tracked by the section track.
 *
 * @property {string} anchor - The data-anchor value (URL hash target).
 * @property {1|2|3|4|5|6} level - HTML heading level (h1–h6).
 * @property {number} top - Absolute distance from document top (px).
 * @property {number} height - Element height (px).
 * @property {string} label - Human-readable heading text.
 */
export interface SectionTrackItem {
  anchor: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  top: number;
  height: number;
  label: string;
}
