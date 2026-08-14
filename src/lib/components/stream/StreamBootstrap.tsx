/**
 * @fileoverview Client bootstrap that sets stream animation custom properties
 * on sections after mount.
 * @description Computes the rendered height of each `<section data-stream>`
 * element's doubled stream text, then sets `--stream-px` (half the text height
 * = one copy) and `--stream-speed` (derived from a target px/s) as inline CSS
 * custom properties on the section.
 *
 * @module lib/components/stream/StreamBootstrap
 * @version 1.0.1
 * @author Typeir
 * @since 2026-04-28
 */

'use client';

import { useEffect } from 'react';

/** Target scrolling speed in pixels per second. */
const TARGET_PX_PER_SECOND = 30;

/** Minimum animation duration in seconds. */
const MIN_DURATION = 4;

/** Maximum animation duration in seconds. */
const MAX_DURATION = 120;

/**
 * Measures the rendered height of a stream text string with a temporary
 * off-screen probe element.
 *
 * @param {string} text - Stream text to measure
 * @returns {number} Rendered height in pixels, or 0 if measurement fails
 */
function measureStreamTextHeight(text: string): number {
  const probe = document.createElement('div');
  Object.assign(probe.style, {
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
    visibility: 'hidden',
    writingMode: 'vertical-rl',
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    fontSize: '0.6rem',
    lineHeight: '1',
    fontVariantLigatures: 'none',
    height: 'auto',
    width: 'auto',
  } as CSSStyleDeclaration);
  probe.textContent = text;
  document.body.appendChild(probe);
  const height = probe.scrollHeight || probe.offsetHeight || 0;
  document.body.removeChild(probe);
  return height;
}

/**
 * Computes and sets `--stream-px` and `--stream-speed` on a single section
 * based on the measured height of its `data-stream` attribute value.
 *
 * @param {HTMLElement} sec - Section element with a `data-stream` attribute
 */
function stampSection(sec: HTMLElement): void {
  const style = sec.style.getPropertyValue('--stream-text');
  const streamText = style ? style.replace(/^['"]|['"]$/g, '') : '';
  if (!streamText) return;
  let fullHeight = measureStreamTextHeight(streamText);
  if (!fullHeight) {
    const fallbackFull = sec.clientHeight ? sec.clientHeight : 240;
    fullHeight = fallbackFull;
  }
  const halfPx = Math.max(60, Math.round(fullHeight / 2));
  const duration = Math.max(
    MIN_DURATION,
    Math.min(MAX_DURATION, halfPx / TARGET_PX_PER_SECOND),
  );
  sec.style.setProperty('--stream-px', `${halfPx}px`);
  sec.style.setProperty('--stream-speed', `${duration.toFixed(1)}s`);
}

/**
 * Client component that sets --stream-px and --stream-speed per section.
 *
 * @component
 * @returns {null} No DOM output — side-effects only.
 */
export default function StreamBootstrap(): null {
  useEffect(() => {
    const root =
      document.querySelector<HTMLElement>(
        '.prose, .prose-invert, .mdx-root, [style*="--stream-text"]',
      ) || document.body;

    const sections = Array.from(root.querySelectorAll<HTMLElement>('section'));

    const stamp = (sec: HTMLElement) => {
      const perSec =
        sec.getAttribute('data-stream') ||
        sec.style.getPropertyValue('--stream-text');
      const rootStyle =
        getComputedStyle(root).getPropertyValue('--stream-text');
      const streamText = perSec
        ? perSec.replace(/^['"]|['"]$/g, '')
        : rootStyle
          ? rootStyle.replace(/^['"]|['"]$/g, '')
          : '';
      if (!streamText) return;
      let fullHeight = measureStreamTextHeight(streamText);
      if (!fullHeight) {
        const fallbackFull = sec.clientHeight ? sec.clientHeight : 240;
        fullHeight = fallbackFull;
      }
      const halfPx = Math.max(60, Math.round(fullHeight / 2));
      const duration = Math.max(
        MIN_DURATION,
        Math.min(MAX_DURATION, halfPx / TARGET_PX_PER_SECOND),
      );
      sec.style.setProperty('--stream-px', `${halfPx}px`);
      sec.style.setProperty('--stream-speed', `${duration.toFixed(1)}s`);
    };

    sections.forEach(stamp);

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver((entries) => {
            entries.forEach((entry) => stamp(entry.target as HTMLElement));
          })
        : null;

    if (ro) sections.forEach((s) => ro.observe(s));

    const handleResize = () => sections.forEach(stamp);
    window.addEventListener('resize', handleResize);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return null;
}
