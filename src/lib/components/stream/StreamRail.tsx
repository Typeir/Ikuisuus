/**
 * @fileoverview Stream rail: the static box a vertical ticker scrolls inside.
 * @description Renders `<span aria-hidden data-stream-rail>`; the host's
 * stylesheet includes `mdx-stream-rail` on it. `streamStyle` builds the
 * `--stream-text` and `--stream-speed` custom properties the rail reads,
 * quoting the text as a CSS string token.
 *
 * @module lib/components/stream/StreamRail
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-28
 */

import type { CSSProperties, JSX } from 'react';

/** Scroll speed the loop duration is derived from, in CSS px per second. */
const TARGET_PX_PER_SECOND = 30;

/** Approximate advance of one 0.6rem monospace glyph at a 14px root, in px. */
const PX_PER_CHAR = 4.6;

/** Minimum loop duration in seconds. */
const MIN_DURATION = 4;

/** Maximum loop duration in seconds. */
const MAX_DURATION = 120;

/**
 * Props for StreamRail.
 *
 * @property {'left' | 'right'} [side='left'] - Edge of the host the rail hugs
 */
export interface StreamRailProps {
  side?: 'left' | 'right';
}

/**
 * Quotes text as a CSS string token. `content: var(--stream-text)` resolves
 * to nothing when the value is bare identifiers, and a raw newline ends a
 * CSS string, so whitespace runs collapse to one space.
 *
 * @param {string} text - Raw stream text
 * @returns {string} Double-quoted CSS string
 */
export function cssString(text: string): string {
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\s+/g, ' ');
  return `"${escaped}"`;
}

/**
 * Custom properties a stream host sets: the quoted text and a loop duration
 * derived from its length, so every page scrolls at about the same speed.
 * The copy the rail repeats is the text plus one separator space.
 *
 * @param {string} text - One copy of the stream text
 * @returns {CSSProperties} `--stream-text` and `--stream-speed`
 */
export function streamStyle(text: string): CSSProperties {
  const px = (text.length + 1) * PX_PER_CHAR;
  const seconds = Math.min(
    MAX_DURATION,
    Math.max(MIN_DURATION, px / TARGET_PX_PER_SECOND),
  );
  return {
    '--stream-text': cssString(text),
    '--stream-speed': `${seconds.toFixed(1)}s`,
  } as CSSProperties;
}

/**
 * Static rail the ticker scrolls inside. Hidden from assistive tech: the text
 * is ornament.
 *
 * @component
 * @param {StreamRailProps} props - Component props
 * @param {'left' | 'right'} [props.side='left'] - Edge of the host the rail hugs
 * @returns {JSX.Element} The rail element
 */
export function StreamRail({ side = 'left' }: StreamRailProps): JSX.Element {
  return <span aria-hidden='true' data-stream-rail={side} />;
}
