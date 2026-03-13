/**
 * Auth Service Unit Tests
 *
 * @fileoverview Tests for the auth service (login, createUser, session tokens, etc.).
 *
 * @module tests/unit/lib/db/auth/authService
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    child: () => ({
      error: vi.fn(),
      debug: vi.fn(),
      message: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

const originalSecret = process.env.CORRECTIONS_SECRET;

beforeEach(() => {
  vi.resetModules();
  process.env.CORRECTIONS_SECRET = 'test-secret-for-auth';
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalSecret === undefined) {
    delete process.env.CORRECTIONS_SECRET;
  } else {
    process.env.CORRECTIONS_SECRET = originalSecret;
  }
});

describe('authService', () => {
  describe('hashPassword / verifyPassword', () => {
    it('should hash password to 64 char hex', async () => {
      const { hashPassword } = await import('@/lib/db/auth/authService');
      const hash = hashPassword('testpass');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('should verify matching password', async () => {
      const { hashPassword, verifyPassword } =
        await import('@/lib/db/auth/authService');
      const hash = hashPassword('mypassword');
      expect(verifyPassword('mypassword', hash)).toBe(true);
    });

    it('should reject mismatched password', async () => {
      const { hashPassword, verifyPassword } =
        await import('@/lib/db/auth/authService');
      const hash = hashPassword('mypassword');
      expect(verifyPassword('wrongpassword', hash)).toBe(false);
    });
  });

  describe('createSessionToken', () => {
    it('should return a 64 char hex token', async () => {
      const { createSessionToken } = await import('@/lib/db/auth/authService');
      const token = createSessionToken('user-1');
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should produce different tokens for different users', async () => {
      const { createSessionToken } = await import('@/lib/db/auth/authService');
      const t1 = createSessionToken('user-1');
      const t2 = createSessionToken('user-2');
      expect(t1).not.toBe(t2);
    });

    it('should throw when CORRECTIONS_SECRET is not set', async () => {
      delete process.env.CORRECTIONS_SECRET;
      const { createSessionToken } = await import('@/lib/db/auth/authService');
      expect(() => createSessionToken('user-1')).toThrow(
        'CORRECTIONS_SECRET is not configured',
      );
    });
  });

  describe('validateSessionToken', () => {
    it('should validate a correct token', async () => {
      const { createSessionToken, validateSessionToken, setUserAdapter } =
        await import('@/lib/db/auth/authService');

      const mockUser = {
        id: 'user-1',
        username: 'admin',
        role: 'admin' as const,
        passwordHash: 'a'.repeat(64),
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      setUserAdapter({
        findByUsername: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        listAll: vi.fn().mockResolvedValue([mockUser]),
        delete: vi.fn(),
      });

      const token = createSessionToken('user-1');
      const result = await validateSessionToken(token);

      expect(result.valid).toBe(true);
      expect(result.session?.userId).toBe('user-1');
      expect(result.session?.username).toBe('admin');
    });

    it('should reject invalid token', async () => {
      const { validateSessionToken, setUserAdapter } =
        await import('@/lib/db/auth/authService');

      setUserAdapter({
        findByUsername: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        listAll: vi.fn().mockResolvedValue([]),
        delete: vi.fn(),
      });

      const result = await validateSessionToken('invalid-token');
      expect(result.valid).toBe(false);
    });
  });

  describe('login', () => {
    it('should return token on valid credentials', async () => {
      const { login, hashPassword, setUserAdapter } =
        await import('@/lib/db/auth/authService');

      const hash = hashPassword('correct-password');
      const mockUser = {
        id: 'user-1',
        username: 'admin',
        role: 'admin' as const,
        passwordHash: hash,
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      setUserAdapter({
        findByUsername: vi.fn().mockResolvedValue(mockUser),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined),
        listAll: vi.fn(),
        delete: vi.fn(),
      });

      const result = await login({
        username: 'admin',
        password: 'correct-password',
      });

      expect('token' in result).toBe(true);
      if ('token' in result) {
        expect(result.token).toHaveLength(64);
        expect(result.user.username).toBe('admin');
      }
    });

    it('should return error on wrong password', async () => {
      const { login, hashPassword, setUserAdapter } =
        await import('@/lib/db/auth/authService');

      setUserAdapter({
        findByUsername: vi.fn().mockResolvedValue({
          id: 'user-1',
          username: 'admin',
          role: 'admin',
          passwordHash: hashPassword('correct-password'),
          createdAt: '2025-01-01T00:00:00.000Z',
        }),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        listAll: vi.fn(),
        delete: vi.fn(),
      });

      const result = await login({
        username: 'admin',
        password: 'wrong-password',
      });

      expect('error' in result).toBe(true);
    });

    it('should return error for unknown user', async () => {
      const { login, setUserAdapter } =
        await import('@/lib/db/auth/authService');

      setUserAdapter({
        findByUsername: vi.fn().mockResolvedValue(null),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        listAll: vi.fn(),
        delete: vi.fn(),
      });

      const result = await login({
        username: 'ghost',
        password: 'nopass',
      });

      expect('error' in result).toBe(true);
    });
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const { createUser, setUserAdapter } =
        await import('@/lib/db/auth/authService');

      const mockCreate = vi.fn().mockResolvedValue(undefined);
      setUserAdapter({
        findByUsername: vi.fn(),
        findById: vi.fn(),
        create: mockCreate,
        update: vi.fn(),
        listAll: vi.fn(),
        delete: vi.fn(),
      });

      const user = await createUser({
        username: 'newuser',
        password: 'password123',
        role: 'editor',
      });

      expect(user.username).toBe('newuser');
      expect(user.passwordHash).toHaveLength(64);
      expect(user.role).toBe('editor');
      expect(user.id).toBeDefined();
      expect(mockCreate).toHaveBeenCalledOnce();
    });
  });

  describe('extractSession', () => {
    it('should return null for null header', async () => {
      const { extractSession } = await import('@/lib/db/auth/authService');
      const result = await extractSession(null);
      expect(result).toBeNull();
    });

    it('should return null for non-Bearer header', async () => {
      const { extractSession } = await import('@/lib/db/auth/authService');
      const result = await extractSession('Basic abc123');
      expect(result).toBeNull();
    });

    it('should extract session from valid Bearer token', async () => {
      const { extractSession, createSessionToken, setUserAdapter } =
        await import('@/lib/db/auth/authService');

      const mockUser = {
        id: 'user-1',
        username: 'admin',
        role: 'admin' as const,
        passwordHash: 'a'.repeat(64),
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      setUserAdapter({
        findByUsername: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        listAll: vi.fn().mockResolvedValue([mockUser]),
        delete: vi.fn(),
      });

      const token = createSessionToken('user-1');
      const session = await extractSession(`Bearer ${token}`);

      expect(session).not.toBeNull();
      expect(session?.userId).toBe('user-1');
    });
  });

  describe('setUserAdapter / getUserAdapter', () => {
    it('should swap adapter', async () => {
      const { setUserAdapter, getUserAdapter } =
        await import('@/lib/db/auth/authService');

      const custom = {
        findByUsername: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        listAll: vi.fn(),
        delete: vi.fn(),
      };

      setUserAdapter(custom);
      expect(getUserAdapter()).toBe(custom);
    });
  });

  describe('real production credentials (admin user from corrections_users)', () => {
    /**
     * Verifies that the SHA-256 hash used by hashPassword matches the exact
     * value stored in the production database row.
     */
    it('should produce the known production hash for the admin password', async () => {
      const { hashPassword } = await import('@/lib/db/auth/authService');
      expect(hashPassword('JOHN_SUNSHINE')).toBe(
        'dd4046a6aca3cece1f069c9ca87b23d21b9038ebda60a7efbf2b67caded9719e',
      );
    });

    /**
     * Verifies verifyPassword passes when given the plain-text password and
     * the exact hash from the production row.
     */
    it('should verify password against production hash', async () => {
      const { verifyPassword } = await import('@/lib/db/auth/authService');
      expect(
        verifyPassword(
          'JOHN_SUNSHINE',
          'dd4046a6aca3cece1f069c9ca87b23d21b9038ebda60a7efbf2b67caded9719e',
        ),
      ).toBe(true);
    });

    /**
     * Full login flow using the production row. Simulates what happens when
     * the PostgreSQL adapter returns the real `corrections_users` row.
     */
    it('should successfully log in with production user data', async () => {
      const { login, setUserAdapter } = await import('@/lib/db/auth/authService');

      setUserAdapter({
        findByUsername: vi.fn().mockResolvedValue({
          id: '09ff29d0-2f9e-40d2-88f6-013a92990d16',
          username: 'admin',
          passwordHash:
            'dd4046a6aca3cece1f069c9ca87b23d21b9038ebda60a7efbf2b67caded9719e',
          role: 'admin' as const,
          createdAt: '2026-03-08T22:56:09.688487Z',
          lastLoginAt: undefined,
        }),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined),
        listAll: vi.fn(),
        delete: vi.fn(),
      });

      const result = await login({ username: 'admin', password: 'JOHN_SUNSHINE' });

      expect('error' in result).toBe(false);
      if ('token' in result) {
        expect(result.token).toHaveLength(64);
        expect(result.user.id).toBe('09ff29d0-2f9e-40d2-88f6-013a92990d16');
        expect(result.user.username).toBe('admin');
        expect(result.user.role).toBe('admin');
      }
    });

    /**
     * Ensures a wrong password still fails even when the username matches
     * the production row.
     */
    it('should reject login with wrong password for production user', async () => {
      const { login, setUserAdapter } = await import('@/lib/db/auth/authService');

      setUserAdapter({
        findByUsername: vi.fn().mockResolvedValue({
          id: '09ff29d0-2f9e-40d2-88f6-013a92990d16',
          username: 'admin',
          passwordHash:
            'dd4046a6aca3cece1f069c9ca87b23d21b9038ebda60a7efbf2b67caded9719e',
          role: 'admin' as const,
          createdAt: '2026-03-08T22:56:09.688487Z',
          lastLoginAt: undefined,
        }),
        findById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        listAll: vi.fn(),
        delete: vi.fn(),
      });

      const result = await login({ username: 'admin', password: 'wrong' });

      expect('error' in result).toBe(true);
    });
  });
});
