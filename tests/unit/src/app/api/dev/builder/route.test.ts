/**
 * @fileoverview Dev builder index route tests.
 *
 * @module tests/unit/src/app/api/dev/builder/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logging/logger', () => ({
  logger: { child: () => ({ error: vi.fn() }) },
}));

import { GET } from '@/app/api/dev/builder/route';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/dev/builder', () => {
  it('404s unless enabled', async () => {
    vi.stubEnv('IK_DEV_BUILDER', '');
    expect((await GET()).status).toBe(404);
  });

  it('lists endpoints, slots, and flag codes', async () => {
    vi.stubEnv('IK_DEV_BUILDER', '1');
    const body = (await (await GET()).json()) as {
      endpoints: Record<string, string>;
      slots: string[];
      flagCodes: string[];
    };
    expect(Object.keys(body.endpoints)).toHaveLength(4);
    expect(body.slots).toContain('boons');
    expect(body.flagCodes).toContain('BP_OVER_BUDGET');
  });
});
