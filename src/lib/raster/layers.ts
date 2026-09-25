/**
 * @fileoverview SVG layer builders and single-pass compositing.
 *
 * @module lib/raster/layers
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import type { Blend } from 'sharp';
import { open, type RasterInput, type Sharp } from './pipeline';

/**
 * One layer to draw onto a base image.
 *
 * @interface Layer
 * @property {Buffer} input - Layer bytes, SVG or raster.
 * @property {Blend} blend - Sharp blend mode.
 */
export interface Layer {
  input: Buffer;
  blend: Blend;
}

/**
 * A layer drawn on top of the base.
 *
 * @function overlay
 * @param {Buffer} input - Layer bytes.
 * @returns {Layer} An `over` layer.
 */
export const overlay = (input: Buffer): Layer => ({ input, blend: 'over' });

/**
 * A layer that keeps only the base pixels it covers.
 *
 * @function mask
 * @param {Buffer} input - Mask bytes, opaque where the base survives.
 * @returns {Layer} A `dest-in` layer.
 */
export const mask = (input: Buffer): Layer => ({ input, blend: 'dest-in' });

/**
 * SVG bytes of a solid rectangle filled with `colour`.
 *
 * @function solidLayer
 * @param {number} width - Width in px.
 * @param {number} height - Height in px.
 * @param {string} colour - Any SVG fill value.
 * @returns {Buffer} SVG bytes.
 */
export const solidLayer = (
  width: number,
  height: number,
  colour: string,
): Buffer =>
  Buffer.from(
    `<svg width="${width}" height="${height}">` +
      `<rect width="${width}" height="${height}" fill="${colour}"/>` +
      `</svg>`,
  );

/**
 * SVG bytes of a centred white disc, radius `radiusFraction` of half of `size`.
 *
 * @function circleMask
 * @param {number} size - Square side in px.
 * @param {number} [radiusFraction=1] - Radius scale in (0, 1].
 * @returns {Buffer} SVG bytes.
 */
export const circleMask = (size: number, radiusFraction = 1): Buffer => {
  const radius = Math.round((size / 2) * radiusFraction);
  return Buffer.from(
    `<svg width="${size}" height="${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="white"/>` +
      `</svg>`,
  );
};

/**
 * Draws `layers` in order onto the base in one composite pass.
 *
 * @function composite
 * @param {RasterInput} base - Path, bytes or pipeline.
 * @param {readonly Layer[]} layers - Layers, first drawn first.
 * @returns {Sharp} The composited pipeline, encode it before compositing again.
 */
export const composite = (
  base: RasterInput,
  layers: readonly Layer[],
): Sharp =>
  open(base).composite(
    layers.map((layer) => ({ input: layer.input, blend: layer.blend })),
  );
