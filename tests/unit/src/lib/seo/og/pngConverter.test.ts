/**
 * @fileoverview Unit tests for the PNG conversion utility.
 *
 * The sharp and fetch dependencies are mocked so that no real image
 * processing or network I/O occurs. Tests validate the conditional
 * branching logic: data URIs, PNG pass-through, remote fetch, and
 * failure handling.
 *
 * @module tests/unit/src/lib/seo/og/pngConverter.test
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from([137, 80, 78, 71]));
const mockPng = vi.fn(() => ({ toBuffer: mockToBuffer }));
const mockSharp = vi.fn(() => ({ png: mockPng }));

vi.mock('sharp', () => ({ default: mockSharp }));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { convertToPngDataUri } from '@/lib/seo/og/pngConverter';

afterEach(() => {
  vi.clearAllMocks();
});

describe('convertToPngDataUri', () => {
  it('returns undefined for undefined input', async () => {
    expect(await convertToPngDataUri(undefined)).toBeUndefined();
  });

  it('returns a PNG data URI for a remote URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
    });

    const result = await convertToPngDataUri('https://example.com/image.webp');
    expect(result).toMatch(/^data:image\/png;base64,/);
    expect(mockSharp).toHaveBeenCalled();
  });

  it('returns undefined when remote fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const result = await convertToPngDataUri(
      'https://example.com/missing.webp',
    );
    expect(result).toBeUndefined();
  });

  it('passes through a PNG data URI unchanged', async () => {
    const pngDataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await convertToPngDataUri(pngDataUri);
    expect(result).toBe(pngDataUri);
    expect(mockSharp).not.toHaveBeenCalled();
  });

  it('converts a base64 non-PNG data URI', async () => {
    const webpDataUri =
      'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCd';
    const result = await convertToPngDataUri(webpDataUri);
    expect(result).toMatch(/^data:image\/png;base64,/);
    expect(mockSharp).toHaveBeenCalled();
  });

  it('returns undefined when sharp throws', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
    });
    mockToBuffer.mockRejectedValueOnce(new Error('sharp error'));

    const result = await convertToPngDataUri('https://example.com/bad.webp');
    expect(result).toBeUndefined();
  });
});
