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
import { promises as fs } from 'node:fs';
import path from 'node:path';
import React from 'react';
import satori from 'satori';
import sharp from 'sharp';
import type { OGTemplateProps } from './OGTemplate';
import { OGTemplate } from './OGTemplate';
import { OG_HEIGHT, OG_WIDTH } from './tokens';

/** Google Fonts CSS API v2 endpoint for Inter Regular (weight 400). */
const INTER_REGULAR_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Inter&display=swap';

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

/** Module-level cache for local font binaries, keyed by file name. */
const localFontCache = new Map<string, ArrayBuffer>();

/**
 * Reads a font from `public/fonts`. Caches module-level.
 *
 * satori's opentype fork parses neither WOFF2 nor variable-font tables, and
 * crashes on an `ltag` table. The `*OG*` files are therefore satori-safe
 * derivatives of the site fonts, regenerated with Python fontTools:
 * `instantiateVariableFont` with every fvar axis pinned (wght at 400/700),
 * name records filtered to platform 3, and `ltag`/`STAT`/`meta` deleted.
 * The browser-served originals stay untouched.
 *
 * @param {string} fileName - File name inside `public/fonts`
 * @returns {Promise<ArrayBuffer>} Raw font binary satori can parse
 */
async function loadLocalFont(fileName: string): Promise<ArrayBuffer> {
  const cached = localFontCache.get(fileName);
  if (cached) return cached;

  const bytes = await fs.readFile(
    path.join(process.cwd(), 'public', 'fonts', fileName),
  );
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  localFontCache.set(fileName, buffer);
  return buffer;
}

/**
 * Returns satori font descriptors for the card: the site's Junicode heading
 * face and Empyrean Initialem drop-cap read from `public/fonts`, plus Inter
 * for body text.
 *
 * @returns {Promise<import('satori').Font[]>} Array of satori font configs
 */
async function loadFonts(): Promise<import('satori').Font[]> {
  const [junicodeRegular, junicodeBold, empyrean, inter] = await Promise.all([
    loadLocalFont('JunicodeOG-Regular.ttf'),
    loadLocalFont('JunicodeOG-Bold.ttf'),
    loadLocalFont('EmpyreanInitialemOG.otf'),
    loadFontBuffer(INTER_REGULAR_CSS_URL),
  ]);

  return [
    { name: 'Junicode', data: junicodeRegular, weight: 400, style: 'normal' },
    { name: 'Junicode', data: junicodeBold, weight: 700, style: 'normal' },
    { name: 'Empyrean Initialem', data: empyrean, weight: 400, style: 'normal' },
    { name: 'Inter', data: inter, weight: 400, style: 'normal' },
  ];
}

/**
 * Renders an OG card to a compressed PNG buffer.
 *
 * satori produces an SVG string from the React tree; Resvg renders it to PNG;
 * Sharp compresses (compressionLevel 9, palette, effort 10). Target size < 600 KB.
 *
 * @param {OGTemplateProps} props - Data and optional image URL for the card
 * @returns {Promise<Uint8Array<ArrayBuffer>>} Compressed PNG image data (target: < 600 KB)
 */
export async function renderOgCard(
  props: OGTemplateProps,
): Promise<Uint8Array<ArrayBuffer>> {
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
