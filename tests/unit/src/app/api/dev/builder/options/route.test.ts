/**
 * @fileoverview Dev builder options route tests.
 *
 * @module tests/unit/src/app/api/dev/builder/options/route.test
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

import { POST } from '@/app/api/dev/builder/options/route';

const post = (body: unknown) =>
  new Request('http://localhost/api/dev/builder/options', {
    method: 'POST',
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.stubEnv('IK_DEV_BUILDER', '1');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/dev/builder/options', () => {
  it('400s on an unknown slot', async () => {
    expect((await POST(post({ slot: 'potions' }))).status).toBe(400);
  });

  it('lists options without a character', async () => {
    const body = (await (await POST(post({ slot: 'vocation' }))).json()) as {
      slot: string;
      options: { slug: string }[];
    };
    expect(body.slot).toBe('vocation');
    expect(body.options.map((o) => o.slug)).toEqual(['wizard', 'berserker']);
  });
});
