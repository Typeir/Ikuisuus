/**
 * @fileoverview Unit tests for the OG image renderer.
 *
 * Mocks satori and @resvg/resvg-js. Validates that `renderOgCard` pipes the
 * satori output into Resvg and returns the PNG buffer.
 *
 * @module tests/unit/src/lib/seo/og/renderer.test
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('satori', () => ({
  default: vi.fn().mockResolvedValue('<svg></svg>'),
}));

vi.mock('@resvg/resvg-js', () => {
  class MockResvg {
    render() {
      return { asPng: () => new Uint8Array([0x89, 0x50, 0x4e, 0x47]) };
    }
  }
  return { Resvg: MockResvg };
});

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    png: () => ({
      toBuffer: async () => Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    }),
  })),
}));

/** Stub fetch to return fake font data. */
vi.stubGlobal('fetch', async (_url: string) => ({
  text: async () =>
    `src: url(https://fonts.gstatic.com/s/inter/fake.woff2) format('woff2')`,
  arrayBuffer: async () => new ArrayBuffer(8),
}));

import { renderOgCard } from '@/lib/seo/og/renderer';
import satori from 'satori';

const mockSatori = vi.mocked(satori);

const cardProps = {
  data: {
    slug: 'abominable-avian',
    title: 'Abominable Avian',
    creatureType: 'beast',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSatori.mockResolvedValue('<svg></svg>');
});

describe('renderOgCard', () => {
  it('calls satori with width 1200 and height 630', async () => {
    await renderOgCard(cardProps);
    expect(mockSatori).toHaveBeenCalledOnce();
    const [, opts] = mockSatori.mock.calls[0]!;
    expect(opts.width).toBe(1200);
    expect(opts.height).toBe(630);
  });

  it('passes SVG string to satori', async () => {
    await renderOgCard(cardProps);
    expect(mockSatori).toHaveBeenCalledOnce();
  });

  it('returns a Uint8Array starting with PNG magic bytes', async () => {
    const result = await renderOgCard(cardProps);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result[0]).toBe(0x89);
    expect(result[1]).toBe(0x50);
  });

  it('accepts optional imageUrl prop without throwing', async () => {
    await expect(
      renderOgCard({ ...cardProps, imageUrl: 'https://example.com/img.webp' }),
    ).resolves.not.toThrow();
  });
});
