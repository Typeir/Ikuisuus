/**
 * Auth Schemas Unit Tests
 *
 * @fileoverview Tests for Zod auth schemas validation.
 *
 * @module tests/unit/src/lib/db/auth/schemas.test
 */

import {
    CreateUserRequestSchema,
    LoginRequestSchema,
    LoginResponseSchema,
    SessionPayloadSchema,
    StoredUserSchema,
    UserRole,
    ValidateResponseSchema,
} from '@/lib/db/auth/schemas';
import { describe, expect, it } from 'vitest';

describe('Auth Schemas', () => {
  describe('UserRole', () => {
    it('should accept admin', () => {
      expect(UserRole.parse('admin')).toBe('admin');
    });

    it('should accept editor', () => {
      expect(UserRole.parse('editor')).toBe('editor');
    });

    it('should reject unknown roles', () => {
      expect(() => UserRole.parse('viewer')).toThrow();
    });
  });

  describe('StoredUserSchema', () => {
    const validUser = {
      id: 'abc-123',
      username: 'testuser',
      passwordHash: 'a'.repeat(64),
      role: 'editor' as const,
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    it('should accept a valid stored user', () => {
      const result = StoredUserSchema.parse(validUser);
      expect(result.username).toBe('testuser');
    });

    it('should accept optional lastLoginAt', () => {
      const result = StoredUserSchema.parse({
        ...validUser,
        lastLoginAt: '2025-06-01T12:00:00.000Z',
      });
      expect(result.lastLoginAt).toBeDefined();
    });

    it('should reject a short username', () => {
      expect(() =>
        StoredUserSchema.parse({ ...validUser, username: 'ab' }),
      ).toThrow();
    });

    it('should reject invalid username characters', () => {
      expect(() =>
        StoredUserSchema.parse({ ...validUser, username: 'user name!' }),
      ).toThrow();
    });

    it('should reject short password hash', () => {
      expect(() =>
        StoredUserSchema.parse({ ...validUser, passwordHash: 'short' }),
      ).toThrow();
    });
  });

  describe('LoginRequestSchema', () => {
    it('should accept valid credentials', () => {
      const result = LoginRequestSchema.parse({
        username: 'admin',
        password: 'secret',
      });
      expect(result.username).toBe('admin');
    });

    it('should reject empty username', () => {
      expect(() =>
        LoginRequestSchema.parse({ username: '', password: 'secret' }),
      ).toThrow();
    });

    it('should reject empty password', () => {
      expect(() =>
        LoginRequestSchema.parse({ username: 'admin', password: '' }),
      ).toThrow();
    });
  });

  describe('LoginResponseSchema', () => {
    it('should accept valid response', () => {
      const result = LoginResponseSchema.parse({
        token: 'abc123',
        user: { id: '1', username: 'admin', role: 'admin' },
      });
      expect(result.token).toBe('abc123');
    });
  });

  describe('CreateUserRequestSchema', () => {
    it('should accept valid request with default role', () => {
      const result = CreateUserRequestSchema.parse({
        username: 'newuser',
        password: 'password123',
      });
      expect(result.role).toBe('editor');
    });

    it('should accept explicit admin role', () => {
      const result = CreateUserRequestSchema.parse({
        username: 'newadmin',
        password: 'password123',
        role: 'admin',
      });
      expect(result.role).toBe('admin');
    });

    it('should reject short password', () => {
      expect(() =>
        CreateUserRequestSchema.parse({
          username: 'user',
          password: '12345',
        }),
      ).toThrow();
    });
  });

  describe('SessionPayloadSchema', () => {
    it('should accept valid payload', () => {
      const result = SessionPayloadSchema.parse({
        userId: '123',
        username: 'admin',
        role: 'admin',
      });
      expect(result.userId).toBe('123');
    });
  });

  describe('ValidateResponseSchema', () => {
    it('should accept valid response', () => {
      const result = ValidateResponseSchema.parse({ valid: true });
      expect(result.valid).toBe(true);
    });

    it('should accept response with session', () => {
      const result = ValidateResponseSchema.parse({
        valid: true,
        session: { userId: '1', username: 'admin', role: 'admin' },
      });
      expect(result.session?.username).toBe('admin');
    });

    it('should accept invalid response with error', () => {
      const result = ValidateResponseSchema.parse({
        valid: false,
        error: 'Token expired',
      });
      expect(result.error).toBe('Token expired');
    });
  });
});
