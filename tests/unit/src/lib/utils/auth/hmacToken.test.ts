/**
 * HMAC Token Utilities Unit Tests
 *
 * @fileoverview Tests for createToken, verifyToken, tokenAuditId.
 *
 * @module tests/unit/lib/utils/auth/hmacToken
 */

import {
    createToken,
    tokenAuditId,
    verifyToken,
} from '@/lib/utils/auth/hmacToken';
import { describe, expect, it } from 'vitest';

const SECRET = 'test-secret-key-for-hmac';

describe('hmacToken', () => {
  describe('createToken', () => {
    it('should return a two-part dot-separated string', () => {
      const token = createToken(
        { scope: 'content:write', exp: Math.floor(Date.now() / 1000) + 3600 },
        SECRET,
      );
      const parts = token.split('.');
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    });

    it('should produce different tokens for different payloads', () => {
      const t1 = createToken({ scope: 'a' }, SECRET);
      const t2 = createToken({ scope: 'b' }, SECRET);
      expect(t1).not.toBe(t2);
    });

    it('should produce different tokens for different secrets', () => {
      const payload = { scope: 'content:write' };
      const t1 = createToken(payload, 'secret-1');
      const t2 = createToken(payload, 'secret-2');
      expect(t1).not.toBe(t2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = createToken({ scope: 'content:write' }, SECRET);
      const result = verifyToken(token, SECRET);
      expect(result.valid).toBe(true);
      expect(result.payload?.scope).toBe('content:write');
    });

    it('should reject a token with wrong secret', () => {
      const token = createToken({ scope: 'content:write' }, SECRET);
      const result = verifyToken(token, 'wrong-secret');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    it('should reject malformed token (no dot)', () => {
      const result = verifyToken('nodot', SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Malformed token');
    });

    it('should reject expired token', () => {
      const token = createToken(
        { scope: 'content:write', exp: Math.floor(Date.now() / 1000) - 100 },
        SECRET,
      );
      const result = verifyToken(token, SECRET);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
    });

    it('should accept token without expiry', () => {
      const token = createToken({ scope: 'content:write' }, SECRET);
      const result = verifyToken(token, SECRET);
      expect(result.valid).toBe(true);
    });

    it('should preserve label in payload', () => {
      const token = createToken(
        { scope: 'content:write', label: 'editor-a' },
        SECRET,
      );
      const result = verifyToken(token, SECRET);
      expect(result.payload?.label).toBe('editor-a');
    });
  });

  describe('tokenAuditId', () => {
    it('should return label when present', () => {
      const token = createToken(
        { scope: 'content:write', label: 'editor-b' },
        SECRET,
      );
      const result = tokenAuditId(token, {
        scope: 'content:write',
        label: 'editor-b',
      });
      expect(result).toBe('editor-b');
    });

    it('should return hash prefix when no label', () => {
      const token = createToken({ scope: 'content:write' }, SECRET);
      const result = tokenAuditId(token);
      expect(result).toHaveLength(8);
      expect(result).toMatch(/^[a-f0-9]+$/);
    });

    it('should return consistent hash for same token', () => {
      const token = createToken({ scope: 'x' }, SECRET);
      const id1 = tokenAuditId(token);
      const id2 = tokenAuditId(token);
      expect(id1).toBe(id2);
    });
  });
});
