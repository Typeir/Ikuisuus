/**
 * @fileoverview Dev builder create route tests.
 *
 * @module tests/unit/src/app/api/dev/builder/create/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeContent } from '../../../../../../../fixtures/builder/builderFixtures';

vi.mock('@/lib/logging/logger', () => ({
  logger: { child: () => ({ error: vi.fn() }) },
}));
vi.mock('@/modules/character-builder/infrastructure/devApi/builderContentSource', () => ({
  createBuilderContent: () => makeContent(),
}));

import { POST } from '@/app/api/dev/builder/create/route';

const post = (body: unknown) =>
  new Request('http://localhost/api/dev/builder/create', {
    method: 'POST',
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.stubEnv('IK_DEV_BUILDER', '1');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/dev/builder/create', () => {
  it('404s unless enabled', async () => {
    vi.stubEnv('IK_DEV_BUILDER', '');
    expect((await POST(post({ payload: {} }))).status).toBe(404);
  });

  it('400s without a payload', async () => {
    expect((await POST(post({}))).status).toBe(400);
  });

  it('returns character, resolution, state, and flags', async () => {
    const res = await POST(
      post({
        payload: {
          bloodline: 'empyrean',
          vocations: [{ vocation: 'wizrd' }],
          boons: ['Extended Reach', 'Radiant Wings'],
        },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      character: { vocations: { slug: string }[] };
      resolution: { field: string; match: { slug: string } }[];
      state: { boonPoints: { over: boolean } };
      flags: { code: string }[];
      notes: string[];
    };
    expect(body.character.vocations[0].slug).toBe('wizard');
    expect(body.resolution.find((r) => r.field === 'vocations[0].vocation')?.match.slug).toBe(
      'wizard',
    );
    expect(body.state.boonPoints.over).toBe(true);
    expect(body.flags.map((f) => f.code)).toContain('BP_OVER_BUDGET');
    expect(body.notes).toEqual([]);
  });
});
