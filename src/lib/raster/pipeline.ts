/**
 * @fileoverview Opens images as sharp pipelines and applies geometry transforms.
 *
 * @module lib/raster/pipeline
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import sharp, { type Sharp } from 'sharp';

export type { Sharp };

/**
 * Anything the raster helpers accept as an image.
 *
 * @typedef {string | Buffer | Sharp} RasterInput
 */
export type RasterInput = string | Buffer | Sharp;

/**
 * Pixel size of an image.
 *
 * @interface Dimensions
 * @property {number} width - Width in px.
 * @property {number} height - Height in px.
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * True when the input is already a sharp pipeline.
 *
 * @function isPipeline
 * @param {RasterInput} input - Path, bytes or pipeline.
 * @returns {boolean} Whether the input is a pipeline.
 */
const isPipeline = (input: RasterInput): input is Sharp =>
  typeof input === 'object' &&
  !Buffer.isBuffer(input) &&
  typeof (input as Sharp).toBuffer === 'function';

/**
 * Opens a path, buffer or pipeline as a sharp pipeline.
 *
 * @function open
 * @param {RasterInput} input - Path, bytes or pipeline.
 * @returns {Sharp} The pipeline, the same instance when one was given.
 */
export const open = (input: RasterInput): Sharp =>
  isPipeline(input) ? input : sharp(input);

/**
 * Reads the pixel size of an image, throws when the header has none.
 *
 * @function readDimensions
 * @param {RasterInput} input - Path, bytes or pipeline.
 * @returns {Promise<Dimensions>} Width and height in px.
 */
export async function readDimensions(input: RasterInput): Promise<Dimensions> {
  const { width, height } = await open(input).metadata();
  if (!width || !height) throw new Error('Image has no readable dimensions.');
  return { width, height };
}

/**
 * Caps the width at `maxWidth` without enlarging, keeping the aspect ratio.
 *
 * @function fitWidth
 * @param {RasterInput} input - Path, bytes or pipeline.
 * @param {number} maxWidth - Width cap in px.
 * @returns {Sharp} The resized pipeline.
 */
export const fitWidth = (input: RasterInput, maxWidth: number): Sharp =>
  open(input).resize({ width: maxWidth, withoutEnlargement: true });

/**
 * Crops the largest square at `verticalBias` from top (0) to bottom (1) and scales it to `size`.
 *
 * @function coverSquare
 * @param {RasterInput} input - Path, bytes or pipeline.
 * @param {number} size - Output side in px.
 * @param {number} [verticalBias=0.5] - Where the crop sits in [0, 1].
 * @returns {Promise<Sharp>} The cropped and scaled pipeline.
 */
export async function coverSquare(
  input: RasterInput,
  size: number,
  verticalBias = 0.5,
): Promise<Sharp> {
  const { width, height } = await readDimensions(input);
  const side = Math.min(width, height);
  const left = Math.round((width - side) / 2);
  const top = Math.round((height - side) * verticalBias);
  return open(input)
    .extract({ left, top, width: side, height: side })
    .resize(size, size, { fit: 'cover' });
}

/**
 * Applies a gaussian blur of `sigma` px.
 *
 * @function gaussianBlur
 * @param {RasterInput} input - Path, bytes or pipeline.
 * @param {number} sigma - Blur radius in px, from 0.3 to 1000.
 * @returns {Sharp} The blurred pipeline.
 */
export const gaussianBlur = (input: RasterInput, sigma: number): Sharp =>
  open(input).blur(sigma);
