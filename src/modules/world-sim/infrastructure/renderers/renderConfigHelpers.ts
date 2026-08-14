/**
 * @fileoverview Render Config Helpers
 * @description Helpers for reading optional fields off a celestial body's
 * `renderConfig` blob and building a Three.js `Color` from a named field.
 *
 * @module worldSim/celestials/renderConfigHelpers
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { Color } from 'three';

/**
 * Read a named hex-color field off a render-config blob and construct a
 * Three.js `Color` from it. Falls back to `defaultHex` whenever the field is
 * missing or not a string.
 *
 * @param {Record<string, unknown> | undefined} config - The renderer-specific config blob (typically `body.renderConfig`).
 * @param {string} field - The field name to read (e.g. `'baseColor'`, `'coronaColor'`).
 * @param {string} defaultHex - Hex color used when the field is absent or not a string (e.g. `'#ffffff'`).
 * @returns {Color} A new `Color` instance.
 */
export function extractColor(
  config: Record<string, unknown> | undefined,
  field: string,
  defaultHex: string,
): Color {
  const value = config?.[field];
  return new Color(typeof value === 'string' ? value : defaultHex);
}
