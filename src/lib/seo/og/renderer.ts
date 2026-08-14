/**
 * @fileoverview Renders an OG card to a compressed PNG buffer.
 *
 * satori converts a React tree to SVG; resvg rasterises it to PNG; Sharp
 * compresses (level 9, palette). Fonts resolve via Google Fonts CSS and cache
 * module-level.
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
 * Fetches the CSS, extracts the font binary URL via FONT_SRC_RE, then fetches
 * the binary. Caches results module-level.
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
 * Returns satori font descriptors for Inter Bold and Crimson Text Italic.
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
 * satori produces an SVG string from the React tree; Resvg renders it to PNG;
 * Sharp compresses (compressionLevel 9, palette, effort 10). Target size < 600 KB.
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
