/**
 * @fileoverview Cache Invalidator Unit Tests
 * @description Tests the Next adapter's mapping onto revalidateTag and
 * revalidatePath.
 *
 * @module tests/unit/src/lib/cache/invalidator.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRevalidateTag = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

import { cacheInvalidator } from '@/lib/cache/invalidator';

beforeEach(() => {
  mockRevalidateTag.mockReset();
  mockRevalidatePath.mockReset();
});

describe('cacheInvalidator', () => {
  it('busts a tag at full strength', () => {
    cacheInvalidator.invalidateTag('content-en-spells/bane');
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      'content-en-spells/bane',
      'max',
    );
  });

  it('re-renders a route with the given segment type', () => {
    cacheInvalidator.invalidateRoute('/en/library/spells/bane', 'page');
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      '/en/library/spells/bane',
      'page',
    );
  });

  it('omits the segment type when none is given', () => {
    cacheInvalidator.invalidateRoute('/en/library/spells/bane');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en/library/spells/bane');
  });
});
