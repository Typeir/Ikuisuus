/**
 * @fileoverview Raster layer tests against real sharp on tiny images.
 *
 * @module tests/unit/src/lib/raster/layers.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import { describe, expect, it } from 'vitest';
import {
  circleMask,
  composite,
  mask,
  overlay,
  solidLayer,
} from '@/lib/raster/layers';
import { open } from '@/lib/raster/pipeline';

/**
 * Reads one RGBA pixel from a pipeline.
 *
 * @param {import('sharp').Sharp} pipeline - Image to sample.
 * @param {number} x - Column.
 * @param {number} y - Row.
 * @returns {Promise<number[]>} Red, green, blue and alpha.
 */
const pixel = async (
  pipeline: import('sharp').Sharp,
  x: number,
  y: number,
): Promise<number[]> => {
  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const at = (y * info.width + x) * info.channels;
  return [data[at], data[at + 1], data[at + 2], data[at + 3]];
};

describe('solidLayer', () => {
  it('should render as a flat colour', async () => {
    expect(await pixel(open(solidLayer(2, 2, 'red')), 1, 1)).toEqual([
      255, 0, 0, 255,
    ]);
  });
});

describe('overlay', () => {
  it('should draw the layer on top of the base', async () => {
    const out = composite(solidLayer(4, 4, 'blue'), [
      overlay(solidLayer(4, 4, 'red')),
    ]);
    expect(await pixel(out, 0, 0)).toEqual([255, 0, 0, 255]);
  });

  it('should tag the layer as over', () => {
    expect(overlay(Buffer.alloc(0)).blend).toBe('over');
  });
});

describe('mask and circleMask', () => {
  it('should clear the corners and keep the centre', async () => {
    const out = composite(solidLayer(16, 16, 'lime'), [mask(circleMask(16))]);
    expect((await pixel(out, 0, 0))[3]).toBe(0);
    expect(await pixel(out, 8, 8)).toEqual([0, 255, 0, 255]);
  });

  it('should tag the layer as dest-in', () => {
    expect(mask(Buffer.alloc(0)).blend).toBe('dest-in');
  });

  it('should scale the radius by the fraction', () => {
    expect(circleMask(100, 0.5).toString()).toContain('r="25"');
  });
});
