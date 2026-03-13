// @ts-check

/**
 * Compresses full-resolution images from `public/full-size` into `.webp` format,
 * saving optimized versions in `public/library/images` with mirrored structure.
 *
 * Supported formats: .png, .jpg, .jpeg
 * Keeps originals untouched.
 */

const fs = require('fs/promises');
const { globby } = require('globby');
const path = require('path');
const sharp = require('sharp');
const { createLogger } = require('../core/logger.cjs');
const log = createLogger({ script: 'compressAssets' });

/** Directory containing original full-resolution assets */
const SOURCE_DIR = 'public/full-size';

/** Output directory for compressed webp images */
const OUTPUT_DIR = 'public/library';

/** Resize limit (max width in pixels) */
const MAX_WIDTH = 1600;

/**
 * Format bytes to human-readable size
 * @param {number} bytes
 * @returns {string}
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Compress and convert images from SOURCE_DIR to OUTPUT_DIR as WebP.
 *
 * @returns {Promise<void>}
 */
const compressImages = async () => {
  /** @type {string[]} */
  const files = await globby(`${SOURCE_DIR}/**/*.{png,jpg,jpeg,JPG,webp}`, {
    absolute: true,
  });

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
    /** Relative path from SOURCE_DIR (e.g. "maps/region.png") */
    const relative = path.relative(SOURCE_DIR, file);

    /** Output path in OUTPUT_DIR, replacing extension with .webp */
    const outputPath = path.join(
      OUTPUT_DIR,
      relative.replace(/\.(png|jpe?g)$/i, '.webp'),
    );

    try {
      // Skip if already compressed
      await fs.access(outputPath);
      log.message('↷ Skipped (already exists)', { path: relative });
      skippedCount++;
      continue;
    } catch {
      // Continue — file does not exist yet
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    try {
      // Get original file size and metadata
      const originalStats = await fs.stat(file);
      const originalSize = originalStats.size;

      // Get original image metadata
      const metadata = await sharp(file).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;

      // Compress image
      const info = await sharp(file)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      // Get compressed file size
      const compressedStats = await fs.stat(outputPath);
      const compressedSize = compressedStats.size;

      // Calculate dimensions after resize
      const newWidth = info.width;
      const newHeight = info.height;

      // Track totals
      totalOriginalSize += originalSize;
      totalCompressedSize += compressedSize;
      processedCount++;

      // Output detailed info
      const outputFilename = path.basename(outputPath);
      const dimensionChange =
        originalWidth !== newWidth
          ? ` (${originalWidth}×${originalHeight} → ${newWidth}×${newHeight})`
          : ` (${originalWidth}×${originalHeight})`;
      const sizeChange = ` (${formatBytes(originalSize)} → ${formatBytes(compressedSize)})`;

      log.message(
        `✓ Processed: ${path.basename(file)} → ${outputFilename}${dimensionChange}${sizeChange}`,
      );
    } catch (err) {
      log.error('✗ Failed', {
        path: relative,
        error: err.message || String(err),
      });
    }
  }

  // Final summary
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

// Run the script
compressImages().catch((err) => {
  log.error('✖ Unexpected script error', { error: err.message || String(err) });
  process.exit(1);
});
