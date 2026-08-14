/**
 * @fileoverview Compresses images from `public/full-size` into `.webp`,
 * writing mirrored files under `public/library`. Supports .png, .jpg, .jpeg.
 * Originals kept untouched.
 *
 * @module compressAssets
 * @version 1.0.0
 * @since 1.0.0
 * @author Typeir
 * @updated 2026-04-23
 *
 * @requires fs/promises Node.js async filesystem
 * @requires fast-glob Glob pattern matching
 * @requires path Node.js path utilities
 * @requires sharp Image processing library
 */

import { createLogger } from '@/lib/logging/logger';
import fg from 'fast-glob';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const log = createLogger({ script: 'compressAssets' });

/** Directory containing original full-resolution assets */
const SOURCE_DIR = 'public/full-size';

/** Output directory for compressed webp images */
const OUTPUT_DIR = 'public/library';

/** Resize limit (max width in pixels) */
const MAX_WIDTH = 1600;

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

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    try {
      const originalStats = await fs.stat(file);
      const originalSize = originalStats.size;

      const metadata = await sharp(file).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;

      const info = await sharp(file)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      const compressedStats = await fs.stat(outputPath);
      const compressedSize = compressedStats.size;

      const newWidth = info.width;
      const newHeight = info.height;

      totalOriginalSize += originalSize;
      totalCompressedSize += compressedSize;
      processedCount++;

      const outputFilename = path.basename(outputPath);
      const dimensionChange =
        originalWidth !== newWidth
          ? ` (${originalWidth}×${originalHeight} → ${newWidth}×${newHeight})`
          : ` (${originalWidth}×${originalHeight})`;
      const sizeChange = ` (${formatBytes(originalSize)} → ${formatBytes(compressedSize)})`;

      log.message(
        `✓ Processed: ${path.basename(file)} → ${outputFilename}${dimensionChange}${sizeChange}`,
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
