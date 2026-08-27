/**
 * @fileoverview resolveKeywordRegistry Unit Tests
 * @description Tests that discovery is scoped to one locale directory beneath
 * the content root, and that the caller may name the locale.
 *
 * @module tests/unit/lib/md/resolveKeywordRegistry
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/md/resolveKeywordRegistry Module under test
 */

import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const discoverKeywordIndexes = vi.fn().mockResolvedValue(new Map());

vi.mock('@/lib/md/keywordIndexRegistry', () => ({
  discoverKeywordIndexes,
}));

const { DEFAULT_KEYWORD_LOCALE, resolveKeywordRegistry } = await import(
  '@/lib/md/resolveKeywordRegistry'
);

afterEach(() => {
  discoverKeywordIndexes.mockClear();
});

describe('resolveKeywordRegistry', () => {
  it('should default to the english locale', () => {
    expect(DEFAULT_KEYWORD_LOCALE).toBe('en');
  });

  it('should scan the default locale directory', async () => {
    await resolveKeywordRegistry();

    expect(discoverKeywordIndexes).toHaveBeenCalledWith(
      path.join(process.cwd(), 'src/content', 'en'),
    );
  });

  it('should scan the named locale directory', async () => {
    await resolveKeywordRegistry('es');

    expect(discoverKeywordIndexes).toHaveBeenCalledWith(
      path.join(process.cwd(), 'src/content', 'es'),
    );
  });

  it('should never scan the content root itself', async () => {
    await resolveKeywordRegistry();

    const scanned = discoverKeywordIndexes.mock.calls[0][0];
    expect(scanned).not.toBe(path.join(process.cwd(), 'src/content'));
  });

  it('should return what discovery produced', async () => {
    const registry = new Map([
      ['condition', { namespace: 'condition', values: new Map(), sources: [] }],
    ]);
    discoverKeywordIndexes.mockResolvedValueOnce(registry);

    await expect(resolveKeywordRegistry()).resolves.toBe(registry);
  });
});
