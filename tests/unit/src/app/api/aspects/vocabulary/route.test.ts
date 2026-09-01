/**
 * @fileoverview Aspect Vocabulary Route Tests
 * @module tests/unit/src/app/api/aspects/vocabulary/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@scripts/metadata/sharedData', () => ({
  loadSharedData: vi.fn().mockResolvedValue({
    aspects: { damage: { scope: '*', values: ['fire'] } },
  }),
}));

describe('/api/aspects/vocabulary route', () => {
  it('should return resolved groups', async () => {
    const { GET } = await import('@/app/api/aspects/vocabulary/route');
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.groups).toEqual([
      { group: 'damage', values: ['fire'], scope: '*' },
    ]);
  });
});
