/**
 * @fileoverview PNG conversion utility for OG image rendering.
 *
 * @module lib/seo/og/pngConverter
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */
import sharp from 'sharp';

/**
 * Convert an image URL or data URI to a PNG data URI.
 *
 * @param {string | undefined} src - Remote URL or data URI
 * @returns {Promise<string | undefined>} PNG data URI or undefined on failure
 */
export async function convertToPngDataUri(
  src: string | undefined,
): Promise<string | undefined> {
  if (!src) return undefined;

  try {
    if (src.startsWith('data:')) {
      const match = src.match(/^data:([^;]+)(;base64)?,(.*)$/);
      if (!match) return undefined;
      const mime = match[1];
      const isBase64 = !!match[2];
      const data = match[3] || '';

      if (mime === 'image/png') return src;

      const buffer = isBase64
        ? Buffer.from(data, 'base64')
        : Buffer.from(decodeURIComponent(data), 'utf8');
      const out = await sharp(buffer).png().toBuffer();
      return `data:image/png;base64,${out.toString('base64')}`;
    }

    const res = await fetch(src);
    if (!res.ok) return undefined;
    const arr = await res.arrayBuffer();
    const buf = Buffer.from(arr);
    const out = await sharp(buf).png().toBuffer();
    return `data:image/png;base64,${out.toString('base64')}`;
  } catch {
    return undefined;
  }
}
