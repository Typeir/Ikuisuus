/**
 * @fileoverview Compresses images from `public/full-size` into `.webp` under
 * `public/library`, blurring files named `-background`.
 *
 * @module scripts/assets/compressAssets
 * @version 1.0.0
 * @since 1.0.0
 * @author Typeir
 * @updated 2026-04-23
 *
 * @requires fs/promises Node.js async filesystem
 * @requires fast-glob Glob pattern matching
 * @requires path Node.js path utilities
 * @requires @/lib/raster Image pipeline
 */

import { createLogger } from '@/lib/logging/logger';
import {
  DEFAULT_WEBP_QUALITY,
  fitWidth,
  gaussianBlur,
  readDimensions,
  toWebp,
  writeBytes,
} from '@/lib/raster';
import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';

const log = createLogger({ script: 'compressAssets' });

/** Directory containing original full-resolution assets */
const SOURCE_DIR = 'public/full-size';

/** Output directory for compressed webp images */
const OUTPUT_DIR = 'public/library';

/** Resize limit (max width in pixels) */
const MAX_WIDTH = 1600;

/** Gaussian blur sigma baked into `-background` images. */
const BACKGROUND_BLUR_SIGMA = 2;

/**
 * True when the file name ends with `-background`.
 *
 * @param {string} file - Source path.
 * @returns {boolean} Whether the image is a page backdrop.
 */
const isBackground = (file: string): boolean =>
  path.parse(file).name.endsWith('-background');

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Number of bytes
 * @returns Formatted string
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Compress and convert images from SOURCE_DIR to OUTPUT_DIR as WebP.
 *
 * @returns Promise that resolves when all images are processed
 */
const compressImages = async (): Promise<void> => {
  const files: string[] = await fg(
    `${SOURCE_DIR}/**/*.{png,jpg,jpeg,JPG,webp}`,
    {
      absolute: true,
    },
  );

  log.message('📦 Compressing assets...');
  log.message('🗂  Found images to process', {
    count: files.length,
    path: SOURCE_DIR,
  });

  let totalOriginalSize = 0;
  let totalCompressedSize = 0;
  let processedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const relative = path.relative(SOURCE_DIR, file);

    const outputPath = path.join(
      OUTPUT_DIR,
      relative.replace(/\.(png|jpe?g)$/i, '.webp'),
    );

    try {
      await fs.access(outputPath);
      log.message('↷ Skipped (already exists)', { path: relative });
      skippedCount++;
      continue;
    } catch {
      /* file does not exist yet — continue */
    }

    try {
      const originalSize = (await fs.stat(file)).size;
      const { width: originalWidth, height: originalHeight } =
        await readDimensions(file);

      const blurred = isBackground(file);
      const source = fitWidth(file, MAX_WIDTH);
      if (blurred) gaussianBlur(source, BACKGROUND_BLUR_SIGMA);
      const {
        data,
        width: newWidth,
        height: newHeight,
        size: compressedSize,
      } = await toWebp(source, DEFAULT_WEBP_QUALITY);
      await writeBytes(outputPath, data);

      totalOriginalSize += originalSize;
      totalCompressedSize += compressedSize;
      processedCount++;

      const outputFilename = path.basename(outputPath);
      const dimensionChange =
        originalWidth !== newWidth
          ? ` (${originalWidth}×${originalHeight} → ${newWidth}×${newHeight})`
          : ` (${originalWidth}×${originalHeight})`;
      const sizeChange = ` (${formatBytes(originalSize)} → ${formatBytes(compressedSize)})`;
      const blurTag = blurred ? ' (blurred)' : '';

      log.message(
        `✓ Processed: ${path.basename(file)} → ${outputFilename}${dimensionChange}${sizeChange}${blurTag}`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log.error('✗ Failed', {
        path: relative,
        error: message,
      });
    }
  }

  if (processedCount > 0) {
    const reduction = Math.round(
      ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100,
    );
    log.message(
      `✅ Compressed ${processedCount} images (${formatBytes(totalOriginalSize)} → ${formatBytes(totalCompressedSize)}, ${reduction}% reduction)`,
    );
  } else {
    log.message('✅ All images already processed', { skipped: skippedCount });
  }
};

compressImages().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  log.error('✖ Unexpected script error', { error: message });
  process.exit(1);
});
