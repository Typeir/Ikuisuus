/**
 * @fileoverview devBuilderGate tests.
 *
 * @module tests/unit/src/lib/debug/devBuilderGate.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { isDevBuilderApiEnabled } from '@/lib/debug/devBuilderGate';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isDevBuilderApiEnabled', () => {
  it('is off without the flag', () => {
    vi.stubEnv('IK_DEV_BUILDER', '');
    expect(isDevBuilderApiEnabled()).toBe(false);
  });

  it('is on with the flag outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('IK_DEV_BUILDER', '1');
    expect(isDevBuilderApiEnabled()).toBe(true);
  });

  it('is always off in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('IK_DEV_BUILDER', '1');
    expect(isDevBuilderApiEnabled()).toBe(false);
  });
});
