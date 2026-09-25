/**
 * @fileoverview Raster pipeline tests against real sharp on tiny images.
 *
 * @module tests/unit/src/lib/raster/pipeline.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import {
  coverSquare,
  fitWidth,
  gaussianBlur,
  open,
  readDimensions,
} from '@/lib/raster/pipeline';

/**
 * A flat opaque PNG of the given size.
 *
 * @param {number} width - Width in px.
 * @param {number} height - Height in px.
 * @returns {Promise<Buffer>} PNG bytes.
 */
const flat = (width: number, height: number): Promise<Buffer> =>
  sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 10, g: 20, b: 30, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

/**
 * A 4×8 PNG whose top half is red and bottom half is blue.
 *
 * @returns {Promise<Buffer>} PNG bytes.
 */
const split = (): Promise<Buffer> =>
  sharp({
    create: {
      width: 4,
      height: 8,
      channels: 4,
      background: { r: 0, g: 0, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="4" height="4"><rect width="4" height="4" fill="red"/></svg>',
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

/**
 * Reads the first pixel of a pipeline as RGB.
 *
 * @param {import('sharp').Sharp} pipeline - Image to sample.
 * @returns {Promise<number[]>} Red, green and blue of pixel (0, 0).
 */
const firstPixel = async (
  pipeline: import('sharp').Sharp,
): Promise<number[]> => {
  const raw = await pipeline.removeAlpha().raw().toBuffer();
  return [raw[0], raw[1], raw[2]];
};

describe('open', () => {
  it('should return the pipeline it was given', async () => {
    const pipeline = sharp(await flat(2, 2));
    expect(open(pipeline)).toBe(pipeline);
  });

  it('should wrap bytes in a new pipeline', async () => {
    const meta = await open(await flat(3, 2)).metadata();
    expect([meta.width, meta.height]).toEqual([3, 2]);
  });
});

describe('readDimensions', () => {
  it('should read width and height', async () => {
    expect(await readDimensions(await flat(6, 4))).toEqual({
      width: 6,
      height: 4,
    });
  });

  it('should throw on bytes that are not an image', async () => {
    await expect(readDimensions(Buffer.from('nope'))).rejects.toThrow();
  });
});

describe('fitWidth', () => {
  it('should shrink to the cap and keep the ratio', async () => {
    const { info } = await fitWidth(await flat(40, 20), 10).toBuffer({
      resolveWithObject: true,
    });
    expect([info.width, info.height]).toEqual([10, 5]);
  });

  it('should never enlarge', async () => {
    const { info } = await fitWidth(await flat(8, 4), 16).toBuffer({
      resolveWithObject: true,
    });
    expect([info.width, info.height]).toEqual([8, 4]);
  });
});

describe('coverSquare', () => {
  it('should crop a square and scale it to size', async () => {
    const pipeline = await coverSquare(await flat(30, 10), 6);
    const { info } = await pipeline.toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([6, 6]);
  });

  it('should take the crop from the top at bias 0', async () => {
    expect(await firstPixel(await coverSquare(await split(), 2, 0))).toEqual([
      255, 0, 0,
    ]);
  });

  it('should take the crop from the bottom at bias 1', async () => {
    expect(await firstPixel(await coverSquare(await split(), 2, 1))).toEqual([
      0, 0, 255,
    ]);
  });
});

describe('gaussianBlur', () => {
  it('should keep the image size', async () => {
    const { info } = await gaussianBlur(await flat(8, 6), 2).toBuffer({
      resolveWithObject: true,
    });
    expect([info.width, info.height]).toEqual([8, 6]);
  });
});
