/**
 * @fileoverview devApiHttp tests.
 *
 * @module tests/unit/src/modules/character-builder/infrastructure/devApi/devApiHttp.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logging/logger', () => ({
  logger: { child: () => ({ error: vi.fn() }) },
}));

import {
  BadRequestError,
  gateResponse,
  handle,
  readBody,
  readCarry,
  readCharacter,
  readLocale,
  readThreshold,
  snapshotOf,
} from '@/modules/character-builder/infrastructure/devApi/devApiHttp';
import { makeCharacter } from '../../../../../../fixtures/builder/builderFixtures';

beforeEach(() => {
  vi.stubEnv('IK_DEV_BUILDER', '1');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const post = (body: unknown) =>
  new Request('http://localhost/x', { method: 'POST', body: JSON.stringify(body) });

describe('gate', () => {
  it('404s when the flag is off', async () => {
    vi.stubEnv('IK_DEV_BUILDER', '');
    expect(gateResponse()?.status).toBe(404);
    expect((await handle('x', async () => ({}))).status).toBe(404);
  });

  it('passes when on', () => {
    expect(gateResponse()).toBeNull();
  });
});

describe('readers', () => {
  it('reads object bodies only', async () => {
    await expect(readBody(post({ a: 1 }))).resolves.toEqual({ a: 1 });
    await expect(readBody(post([1]))).rejects.toBeInstanceOf(BadRequestError);
  });

  it('checks locale, character, carry, threshold', () => {
    expect(readLocale({})).toBe('en');
    expect(() => readLocale({ locale: 'xx' })).toThrow(BadRequestError);
    expect(() => readCharacter({})).toThrow(BadRequestError);
    expect(readCharacter({ character: makeCharacter({ name: 'A' }) }).name).toBe('A');
    expect(readCarry({ carry: { size: 'large' } })).toEqual({ size: 'large' });
    expect(readCarry({})).toBeUndefined();
    expect(readThreshold({ threshold: 0.1 })).toBe(0.1);
    expect(readThreshold({ threshold: 3 })).toBeUndefined();
  });
});

describe('handle and snapshot', () => {
  it('maps errors to 400 and 500', async () => {
    const bad = await handle('x', async () => {
      throw new BadRequestError('nope');
    });
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: 'nope' });
    const boom = await handle('do x', async () => {
      throw new Error('boom');
    });
    expect(boom.status).toBe(500);
  });

  it('returns JSON on success and builds snapshots', async () => {
    const res = await handle('x', async () => snapshotOf(makeCharacter()));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { flags: { code: string }[] };
    expect(body.flags.map((f) => f.code)).toEqual(['UNASSIGNED_LEVELS']);
  });
});
