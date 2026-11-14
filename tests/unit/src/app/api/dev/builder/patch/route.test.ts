/**
 * @fileoverview Dev builder patch route tests.
 *
 * @module tests/unit/src/app/api/dev/builder/patch/route.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeCharacter,
  makeContent,
} from '../../../../../../../fixtures/builder/builderFixtures';

vi.mock('@/lib/logging/logger', () => ({
  logger: { child: () => ({ error: vi.fn() }) },
}));
vi.mock('@/modules/character-builder/infrastructure/devApi/builderContentSource', () => ({
  createBuilderContent: () => makeContent(),
}));

import { POST } from '@/app/api/dev/builder/patch/route';

const post = (body: unknown) =>
  new Request('http://localhost/api/dev/builder/patch', {
    method: 'POST',
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.stubEnv('IK_DEV_BUILDER', '1');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

interface PatchBody {
  character: { name: string; vocations: { slug: string }[] };
  diff: {
    character: { path: string }[];
    state: { path: string }[];
    flags: { added: { code: string }[]; removed: { code: string }[] };
  };
}

describe('POST /api/dev/builder/patch', () => {
  it('400s without patch or payload', async () => {
    expect((await POST(post({ character: makeCharacter() }))).status).toBe(400);
  });

  it('applies a raw patch and returns the diff', async () => {
    const res = await POST(post({ character: makeCharacter(), patch: { name: 'Bo' } }));
    const body = (await res.json()) as PatchBody;
    expect(body.character.name).toBe('Bo');
    expect(body.diff.character.map((c) => c.path)).toContain('name');
  });

  it('applies a payload and reports flag changes', async () => {
    const res = await POST(
      post({ character: makeCharacter(), payload: { vocations: [{ vocation: 'wizard' }] } }),
    );
    const body = (await res.json()) as PatchBody;
    expect(body.character.vocations[0].slug).toBe('wizard');
    expect(body.diff.flags.removed.map((f) => f.code)).toContain('UNASSIGNED_LEVELS');
    expect(body.diff.flags.added.map((f) => f.code)).toContain(
      'UNASSIGNED_SKILL_PROFICIENCY',
    );
    expect(body.diff.state.length).toBeGreaterThan(0);
  });
});
