/**
 * @fileoverview Encodes pipelines to WebP and PNG bytes, files and data URIs.
 *
 * @module lib/raster/encode
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { open, type RasterInput } from './pipeline';

/**
 * WebP quality used for library assets.
 *
 * @constant DEFAULT_WEBP_QUALITY
 * @type {number}
 */
export const DEFAULT_WEBP_QUALITY = 80;

/**
 * Encoded bytes with the size they were written at.
 *
 * @interface Encoded
 * @property {Buffer} data - Encoded bytes.
 * @property {number} width - Output width in px.
 * @property {number} height - Output height in px.
 * @property {number} size - Byte length of `data`.
 */
export interface Encoded {
  data: Buffer;
  width: number;
  height: number;
  size: number;
}

/**
 * Encodes to WebP at `quality` in [1, 100].
 *
 * @function toWebp
 * @param {RasterInput} input - Path, bytes or pipeline.
 * @param {number} [quality=80] - WebP quality.
 * @returns {Promise<Encoded>} The bytes and output size.
 */
export async function toWebp(
  input: RasterInput,
  quality = DEFAULT_WEBP_QUALITY,
): Promise<Encoded> {
  const { data, info } = await open(input)
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, size: info.size };
}

/**
 * Encodes to PNG, with palette quantisation and maximum compression when `compact` is true.
 *
 * @function toPng
 * @param {RasterInput} input - Path, bytes or pipeline.
 * @param {boolean} [compact=false] - Trade encode time for a smaller file.
 * @returns {Promise<Buffer>} PNG bytes.
 */
export async function toPng(
  input: RasterInput,
  compact = false,
): Promise<Buffer> {
  const pipeline = open(input);
  const encoded = compact
    ? pipeline.png({ compressionLevel: 9, palette: true, effort: 10 })
    : pipeline.png();
  return encoded.toBuffer();
}

/**
 * Encodes to PNG and returns it as a base64 data URI.
 *
 * @function toPngDataUri
 * @param {RasterInput} input - Path, bytes or pipeline.
 * @returns {Promise<string>} A `data:image/png;base64,` URI.
 */
export async function toPngDataUri(input: RasterInput): Promise<string> {
  const png = await toPng(input);
  return `data:image/png;base64,${png.toString('base64')}`;
}

/**
 * Writes bytes to `outPath`, creating missing parent directories.
 *
 * @function writeBytes
 * @param {string} outPath - Destination file path.
 * @param {Buffer} data - Bytes to write.
 * @returns {Promise<void>} Resolves once written.
 */
export async function writeBytes(outPath: string, data: Buffer): Promise<void> {
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, data);
}
