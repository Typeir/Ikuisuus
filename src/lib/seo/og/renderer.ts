/**
 * @fileoverview OG image PNG renderer.
 *
 * Converts a React element tree (via satori) to an SVG string and then uses
 * `@resvg/resvg-js` to rasterise it into a PNG buffer. The result is intended
 * for use as the response body of the `/api/og/[type]/[slug]` route.
 *
 * PNG compression uses Sharp's aggressive settings (level 9, palette reduction)
 * to ensure images are optimized for social media platforms with file size limits.
 *
 * Font loading uses a module-level cache so that both Inter Bold and Crimson
 * Text Italic are fetched once per process. In development the cache may be
 * invalidated on each restart, which is acceptable.
 *
 * @module lib/seo/og/renderer
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { Resvg } from '@resvg/resvg-js';
import React from 'react';
import satori from 'satori';
import sharp from 'sharp';
import type { OGTemplateProps } from './OGTemplate';
import { OGTemplate } from './OGTemplate';
import { OG_HEIGHT, OG_WIDTH } from './tokens';

/** Google Fonts CSS API v2 endpoint for Inter Bold (weight 700). */
const INTER_BOLD_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap';

/** Google Fonts CSS API v2 endpoint for Crimson Text Italic (weight 400). */
const CRIMSON_ITALIC_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Crimson+Text:ital@1&display=swap';

/** Resolves a single `.woff2` / `.woff` / `.ttf` src URL from a Google Fonts CSS response. */
const FONT_SRC_RE = /url\(([^)]+)\)\s+format\(['"]?(woff2?|truetype)['"]?\)/;

/** Module-level font cache: keyed by CSS URL → ArrayBuffer. */
const fontCache = new Map<string, ArrayBuffer>();

/**
 * Fetches the raw font binary from a Google Fonts CSS URL.
 *
 * The helper first fetches the CSS file (which contains a `src: url(...)` line),
 * extracts the binary URL, then fetches the binary itself.
 * Results are cached module-level to avoid repeated network round-trips.
 *
 * @param {string} cssUrl - Google Fonts CSS API URL
 * @returns {Promise<ArrayBuffer>} Raw font binary
 * @throws {Error} When the CSS response does not contain a parseable font src
 */
async function loadFontBuffer(cssUrl: string): Promise<ArrayBuffer> {
  const cached = fontCache.get(cssUrl);
  if (cached) return cached;

  const css = await fetch(cssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; satori-og-renderer/1.0)',
    },
  }).then((r) => r.text());

  const match = FONT_SRC_RE.exec(css);
  if (!match?.[1]) {
    throw new Error(`Could not parse font src from: ${cssUrl}`);
  }

  const buffer = await fetch(match[1]).then((r) => r.arrayBuffer());
  fontCache.set(cssUrl, buffer);
  return buffer;
}

/**
 * Loads and returns both satori font descriptors used by the OG template.
 *
 * @returns {Promise<import('satori').Font[]>} Array of satori font configs
 */
async function loadFonts(): Promise<import('satori').Font[]> {
  const [interBold, crimsonItalic] = await Promise.all([
    loadFontBuffer(INTER_BOLD_CSS_URL),
    loadFontBuffer(CRIMSON_ITALIC_CSS_URL),
  ]);

  return [
    { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
    { name: 'Crimson Text', data: crimsonItalic, weight: 400, style: 'italic' },
  ];
}

/**
 * Renders an OG card to a compressed PNG buffer.
 *
 * Calls satori to produce an SVG string from the React element tree, then
 * passes the SVG through Resvg to produce a PNG. The PNG is then aggressively
 * compressed using Sharp (compression level 9, palette optimization) to ensure
 * it meets social media file size limits (e.g., WhatsApp < 600 KB).
 *
 * Compression pipeline:
 * 1. Resvg renders SVG to uncompressed PNG
 * 2. Sharp applies maximum PNG compression (level 9)
 * 3. Palette reduction to minimize color depth where possible
 * 4. Effort level 10 for optimal compression trade-off
 *
 * @param {OGTemplateProps} props - Data and optional image URL for the card
 * @returns {Promise<Uint8Array>} Compressed PNG image data (target: < 600 KB)
 */
export async function renderOgCard(
  props: OGTemplateProps,
): Promise<Uint8Array> {
  const fonts = await loadFonts();

  const element = React.createElement(OGTemplate, props);

  const svg = await satori(element, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: OG_WIDTH },
  });

  const png = resvg.render().asPng();

  const compressed = await sharp(Buffer.from(png))
    .png({
      compressionLevel: 9,
      palette: true,
      effort: 10,
    })
    .toBuffer();

  return new Uint8Array(compressed);
}
