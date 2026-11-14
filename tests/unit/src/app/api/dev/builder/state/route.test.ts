/**
 * @fileoverview Dev builder state route tests.
 *
 * @module tests/unit/src/app/api/dev/builder/state/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeCharacter } from '../../../../../../../fixtures/builder/builderFixtures';

vi.mock('@/lib/logging/logger', () => ({
  logger: { child: () => ({ error: vi.fn() }) },
}));

import { POST } from '@/app/api/dev/builder/state/route';

const post = (body: unknown) =>
  new Request('http://localhost/api/dev/builder/state', {
    method: 'POST',
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.stubEnv('IK_DEV_BUILDER', '1');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/dev/builder/state', () => {
  it('404s unless enabled', async () => {
    vi.stubEnv('IK_DEV_BUILDER', '');
    expect((await POST(post({ character: makeCharacter() }))).status).toBe(404);
  });

  it('400s without a character', async () => {
    expect((await POST(post({}))).status).toBe(400);
  });

  it('computes state and flags, honouring carry inputs', async () => {
    const character = makeCharacter({
      equipment: [{ id: 'a', name: 'Sack', quantity: 1, weightLb: 80 }],
    });
    const plain = (await (await POST(post({ character }))).json()) as {
      flags: { code: string }[];
    };
    const tiny = (await (
      await POST(post({ character, carry: { size: 'tiny' } }))
    ).json()) as { flags: { code: string }[] };
    expect(plain.flags.map((f) => f.code)).toContain('CARRY_HEAVY_LOAD');
    expect(tiny.flags.map((f) => f.code)).toContain('CARRY_OVER_CAPACITY');
  });
});
