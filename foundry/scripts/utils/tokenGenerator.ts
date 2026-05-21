/**
 * @fileoverview Token image generator for Foundry VTT monster exports.
 * @description Generates circular token images by cropping portraits to
 * center-square, clipping to a circle, and compositing a frame overlay.
 * Also bundles referenced portrait images from the public library.
 *
 * @module foundry/scripts/utils/tokenGenerator
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-14
 *
 * @see {@link generateTokens} for the main entry point
 * @see {@link bundleImages} for portrait copying
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import sharp from 'sharp';

/** Token size in pixels (matches frame dimensions). */
const TOKEN_SIZE = 256;

/** Background color for token circles (fills transparency and default tokens). */
const TOKEN_BG_COLOR = '#28303b';

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
 * Generates a default round token with a solid background color and frame.
 * Used for monsters that have no portrait image.
 *
 * @param {Buffer} frameBuffer - Frame overlay PNG buffer
 * @param {Buffer} circleMask - Circular mask SVG buffer
 * @param {string} tokensDir - Output directory for token images
 */
async function generateDefaultToken(
  frameBuffer: Buffer,
  circleMask: Buffer,
  tokensDir: string,
): Promise<void> {
  const dest = join(tokensDir, DEFAULT_TOKEN_FILENAME);
  const bgLayer = Buffer.from(
    `<svg width="${TOKEN_SIZE}" height="${TOKEN_SIZE}">` +
      `<rect width="${TOKEN_SIZE}" height="${TOKEN_SIZE}" fill="${TOKEN_BG_COLOR}"/>` +
      `</svg>`,
  );

  const masked = await sharp(bgLayer)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  await sharp(masked)
    .composite([{ input: frameBuffer, blend: 'over' }])
    .webp({ quality: 90 })
    .toFile(dest);
}

/**
 * Generates circular token images by cropping portraits to center-square,
 * clipping to a circle, and compositing the frame overlay on top.
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

  const frameBuffer = readFileSync(framePath);
  const maskRadius = Math.round((TOKEN_SIZE / 2) * 0.95);
  const circleMask = Buffer.from(
    `<svg width="${TOKEN_SIZE}" height="${TOKEN_SIZE}">` +
      `<circle cx="${TOKEN_SIZE / 2}" cy="${TOKEN_SIZE / 2}" r="${maskRadius}" fill="white"/>` +
      `</svg>`,
  );

  const tokenMap = new Map<string, string>();
  let generated = 0;

  for (const relPath of imageFiles) {
    const filename = basename(relPath);
    const src = join(assetsImgDir, filename);
    if (!existsSync(src)) continue;

    const tokenFilename = filename.replace(/\.\w+$/, '.token.webp');
    const dest = join(tokensDir, tokenFilename);

    try {
      const portrait = sharp(src);
      const meta = await portrait.metadata();
      const w = meta.width ?? TOKEN_SIZE;
      const h = meta.height ?? TOKEN_SIZE;
      const cropSize = Math.min(w, h);
      const left = Math.round((w - cropSize) / 2);
      const top = Math.round((h - cropSize) * 0.15);

      const bgLayer = Buffer.from(
        `<svg width="${TOKEN_SIZE}" height="${TOKEN_SIZE}">` +
          `<rect width="${TOKEN_SIZE}" height="${TOKEN_SIZE}" fill="${TOKEN_BG_COLOR}"/>` +
          `</svg>`,
      );

      const cropped = await sharp(bgLayer)
        .composite([
          {
            input: await portrait
              .extract({
                left,
                top,
                width: cropSize,
                height: Math.min(cropSize, h - top),
              })
              .resize(TOKEN_SIZE, TOKEN_SIZE, { fit: 'cover' })
              .png()
              .toBuffer(),
            blend: 'over',
          },
          { input: circleMask, blend: 'dest-in' },
        ])
        .png()
        .toBuffer();

      await sharp(cropped)
        .composite([{ input: frameBuffer, blend: 'over' }])
        .webp({ quality: 90 })
        .toFile(dest);

      tokenMap.set(filename, tokenFilename);
      generated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(
        `  WARN: Token generation failed for ${filename}: ${msg}\n`,
      );
    }
  }

  await generateDefaultToken(frameBuffer, circleMask, tokensDir);
  process.stdout.write(`Tokens: ${generated} generated (+ 1 default)\n`);
  return tokenMap;
}
