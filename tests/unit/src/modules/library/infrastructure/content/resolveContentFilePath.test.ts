/**
 * @fileoverview Unit tests for resolveContentFilePath.
 * @module tests/unit/src/modules/library/infrastructure/content/resolveContentFilePath
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { resolveContentFilePath } from '@/modules/library/infrastructure/content/resolveContentFilePath';
import fs from 'fs/promises';
import { describe, expect, it, vi } from 'vitest';

vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
  },
}));

describe('resolveContentFilePath', () => {
  it('returns first matching variant', async () => {
    const access = vi.mocked(fs.access);
    access
      .mockRejectedValueOnce(new Error('missing'))
      .mockResolvedValueOnce(undefined as never);

    const resolved = await resolveContentFilePath(
      'C:/repo/src/content/en',
      'spells/fireball',
    );

    expect(resolved).toMatch(/spells[\\/]fireball\.sheet\.mdx$/);
  });

  it('returns null when no variants exist', async () => {
    const access = vi.mocked(fs.access);
    access.mockRejectedValue(new Error('missing'));

    await expect(
      resolveContentFilePath('C:/repo/src/content/en', 'spells/missing'),
    ).resolves.toBeNull();
  });
});
