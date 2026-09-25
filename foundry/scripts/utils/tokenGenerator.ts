/**
 * @fileoverview Token image generator for Foundry VTT monster exports.
 *
 * @module foundry/scripts/utils/tokenGenerator
 * @version 2.0.0
 * @author Typeir
 * @since 2026-04-14
 */

import {
  circleMask,
  composite,
  coverSquare,
  mask,
  overlay,
  solidLayer,
  toPng,
  toWebp,
  writeBytes,
  type Layer,
} from '@/lib/raster';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

/** Token size in pixels (matches frame dimensions). */
const TOKEN_SIZE = 256;

/** Background color for token circles (fills transparency and default tokens). */
const TOKEN_BG_COLOR = '#28303b';

/** Fraction of the spare portrait height above the square crop, favouring the face. */
const PORTRAIT_CROP_BIAS = 0.15;

/** Disc radius as a fraction of half the token, leaving a thin border. */
const MASK_RADIUS_FRACTION = 0.95;

/** WebP quality for token files. */
const TOKEN_WEBP_QUALITY = 90;

/** Default token filename for monsters without portraits. */
export const DEFAULT_TOKEN_FILENAME = '_default.token.webp';

/**
 * Copies referenced images from public/library/images/ to foundry/assets/images/.
 *
 * @param {Set<string>} imageFiles - Set of image filenames to copy
 * @param {string} publicImgDir - Source directory for WebP images
 * @param {string} assetsImgDir - Output directory for bundled images
 */
export function bundleImages(
  imageFiles: Set<string>,
  publicImgDir: string,
  assetsImgDir: string,
): void {
  mkdirSync(assetsImgDir, { recursive: true });
  let copied = 0;
  let missing = 0;

  for (const relPath of imageFiles) {
    const src = join(publicImgDir, relPath);
    const dest = join(assetsImgDir, basename(relPath));

    if (existsSync(src)) {
      copyFileSync(src, dest);
      copied++;
    } else {
      process.stderr.write(`  WARN: Image not found: ${src}\n`);
      missing++;
    }
  }

  process.stdout.write(`Images: ${copied} copied, ${missing} missing\n`);
}

/**
 * Composites the background disc, an optional portrait, the circle mask and the frame into WebP bytes.
 *
 * @param {Buffer} frame - Frame overlay PNG bytes
 * @param {Buffer} [portrait] - Square portrait PNG bytes at token size
 * @returns {Promise<Buffer>} Token WebP bytes
 */
async function assembleToken(frame: Buffer, portrait?: Buffer): Promise<Buffer> {
  const layers: Layer[] = portrait ? [overlay(portrait)] : [];
  layers.push(mask(circleMask(TOKEN_SIZE, MASK_RADIUS_FRACTION)));
  const disc = await toPng(
    composite(solidLayer(TOKEN_SIZE, TOKEN_SIZE, TOKEN_BG_COLOR), layers),
  );
  const { data } = await toWebp(
    composite(disc, [overlay(frame)]),
    TOKEN_WEBP_QUALITY,
  );
  return data;
}

/**
 * Generates circular token images by cropping portraits to a face-biased square and clipping to a disc.
 *
 * @param {Set<string>} imageFiles - Set of image filenames to generate tokens for
 * @param {string} assetsImgDir - Source directory for portrait images
 * @param {string} framePath - Path to the frame overlay PNG
 * @param {string} tokensDir - Output directory for generated token images
 * @returns {Promise<Map<string, string>>} Map of source filename → token filename
 */
export async function generateTokens(
  imageFiles: Set<string>,
  assetsImgDir: string,
  framePath: string,
  tokensDir: string,
): Promise<Map<string, string>> {
  mkdirSync(tokensDir, { recursive: true });

  const frame = readFileSync(framePath);
  const tokenMap = new Map<string, string>();
  let generated = 0;

  for (const relPath of imageFiles) {
    const filename = basename(relPath);
    const src = join(assetsImgDir, filename);
    if (!existsSync(src)) continue;

    const tokenFilename = filename.replace(/\.\w+$/, '.token.webp');
    const dest = join(tokensDir, tokenFilename);

    try {
      const portrait = await toPng(
        await coverSquare(src, TOKEN_SIZE, PORTRAIT_CROP_BIAS),
      );
      await writeBytes(dest, await assembleToken(frame, portrait));
      tokenMap.set(filename, tokenFilename);
      generated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `  WARN: Token generation failed for ${filename}: ${msg}\n`,
      );
    }
  }

  await writeBytes(
    join(tokensDir, DEFAULT_TOKEN_FILENAME),
    await assembleToken(frame),
  );
  process.stdout.write(`Tokens: ${generated} generated (+ 1 default)\n`);
  return tokenMap;
}
