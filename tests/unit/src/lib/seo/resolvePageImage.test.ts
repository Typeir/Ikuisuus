/**
 * @fileoverview Tests for the OG image path resolver.
 *
 * @module tests/unit/src/lib/seo/resolvePageImage.test
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
  default: { existsSync: vi.fn() },
  existsSync: vi.fn(),
}));

import { resolvePageImage } from '@/lib/seo/resolvePageImage';
import fs from 'fs';

describe('resolvePageImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the frontmatter image immediately when provided', () => {
    expect(
      resolvePageImage(
        '/custom/image.webp',
        'items/heirlooms/dreaded-defender',
      ),
    ).toBe('/custom/image.webp');
  });

  it('returns the slug-derived .webp path when the file exists on disk', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    expect(
      resolvePageImage(undefined, 'items/heirlooms/dreaded-defender'),
    ).toBe('/library/images/heirlooms/dreaded-defender.webp');
  });

  it('returns the webp candidate path even when no file is found on disk', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(
      resolvePageImage(undefined, 'items/heirlooms/dreaded-defender'),
    ).toBe('/library/images/heirlooms/dreaded-defender.webp');
  });

  it('infers the type folder from the second-to-last slug segment', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(resolvePageImage(undefined, 'monsters/albedo')).toBe(
      '/library/images/monsters/albedo.webp',
    );
  });

  it('uses .png when .webp does not exist but .png does', () => {
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).endsWith('.png'),
    );
    expect(
      resolvePageImage(undefined, 'items/heirlooms/dreaded-defender'),
    ).toBe('/library/images/heirlooms/dreaded-defender.png');
  });
});
