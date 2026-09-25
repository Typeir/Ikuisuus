/**
 * @fileoverview PNG conversion utility for OG image rendering.
 *
 * @module lib/seo/og/pngConverter
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */
import { toPngDataUri } from '@/lib/raster';

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
      return await toPngDataUri(buffer);
    }

    const res = await fetch(src);
    if (!res.ok) return undefined;
    return await toPngDataUri(Buffer.from(await res.arrayBuffer()));
  } catch {
    return undefined;
  }
}
