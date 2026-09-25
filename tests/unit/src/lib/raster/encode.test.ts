/**
 * @fileoverview Raster encoder tests against real sharp on tiny images.
 *
 * @module tests/unit/src/lib/raster/encode.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_WEBP_QUALITY,
  toPng,
  toPngDataUri,
  toWebp,
  writeBytes,
} from '@/lib/raster/encode';

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
      background: { r: 200, g: 100, b: 50, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

/**
 * True when the bytes carry the PNG signature.
 *
 * @param {Buffer} bytes - Candidate bytes.
 * @returns {boolean} Whether they are PNG.
 */
const isPng = (bytes: Buffer): boolean =>
  bytes[0] === 0x89 && bytes.subarray(1, 4).toString() === 'PNG';

const scratch: string[] = [];

afterEach(async () => {
  await Promise.all(
    scratch.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe('toWebp', () => {
  it('should return WebP bytes with the output size', async () => {
    const { data, width, height, size } = await toWebp(await flat(8, 4));
    expect(data.subarray(0, 4).toString()).toBe('RIFF');
    expect(data.subarray(8, 12).toString()).toBe('WEBP');
    expect([width, height]).toEqual([8, 4]);
    expect(size).toBe(data.length);
  });

  it('should default the quality to the library constant', () => {
    expect(DEFAULT_WEBP_QUALITY).toBe(80);
  });
});

describe('toPng', () => {
  it('should encode a PNG', async () => {
    expect(isPng(await toPng(await flat(4, 4)))).toBe(true);
  });

  it('should encode a compact PNG', async () => {
    expect(isPng(await toPng(await flat(4, 4), true))).toBe(true);
  });
});

describe('toPngDataUri', () => {
  it('should wrap the PNG as a base64 data URI', async () => {
    const uri = await toPngDataUri(await flat(2, 2));
    expect(uri.startsWith('data:image/png;base64,')).toBe(true);
    expect(isPng(Buffer.from(uri.split(',')[1], 'base64'))).toBe(true);
  });
});

describe('writeBytes', () => {
  it('should create missing parent directories', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'raster-'));
    scratch.push(dir);
    const target = path.join(dir, 'nested', 'deep', 'out.bin');
    await writeBytes(target, Buffer.from('abc'));
    expect((await readFile(target)).toString()).toBe('abc');
  });
});
