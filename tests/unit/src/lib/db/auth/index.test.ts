/**
 * Auth Barrel Export Unit Tests
 *
 * @fileoverview Tests that the auth barrel re-exports all expected symbols.
 *
 * @module tests/unit/lib/db/auth/index
 */

import { describe, expect, it, vi } from 'vitest';

const mockAdapter = {
  findByUsername: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  listAll: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@/lib/db/auth/authAdapterFactory', () => ({
  userAdapter: mockAdapter,
}));
vi.mock('@/lib/logging/logger', () => ({
  logger: {
    child: () => ({ error: vi.fn(), debug: vi.fn(), message: vi.fn() }),
  },
}));

describe('auth/index barrel', () => {
  it('should re-export service functions', async () => {
    const barrel = await import('@/lib/db/auth');

    expect(typeof barrel.login).toBe('function');
    expect(typeof barrel.createUser).toBe('function');
    expect(typeof barrel.extractSession).toBe('function');
    expect(typeof barrel.hashPassword).toBe('function');
    expect(typeof barrel.verifyPassword).toBe('function');
    expect(typeof barrel.createSessionToken).toBe('function');
    expect(typeof barrel.validateSessionToken).toBe('function');
    expect(typeof barrel.setUserAdapter).toBe('function');
    expect(typeof barrel.getUserAdapter).toBe('function');
  });

  it('should re-export Zod schemas', async () => {
    const barrel = await import('@/lib/db/auth');

    expect(barrel.LoginRequestSchema).toBeDefined();
    expect(barrel.LoginResponseSchema).toBeDefined();
    expect(barrel.StoredUserSchema).toBeDefined();
    expect(barrel.CreateUserRequestSchema).toBeDefined();
    expect(barrel.SessionPayloadSchema).toBeDefined();
    expect(barrel.ValidateResponseSchema).toBeDefined();
  });
});
