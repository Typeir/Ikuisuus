/**
 * @fileoverview Content Hash Unit Tests
 * @description Tests for FNV-1a 32-bit hash functions used for metadata change detection.
 *
 * @module tests/unit/src/lib/metadata/contentHash.test
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { contentHash, fnv1a32 } from '@/lib/metadata/contentHash';
import { describe, expect, it } from 'vitest';

describe('fnv1a32', () => {
  it('should return an 8-character hex string', () => {
    const result = fnv1a32('hello');
    expect(result).toMatch(/^[0-9a-f]{8}$/);
  });

  it('should be deterministic — same input always gives same output', () => {
    expect(fnv1a32('test')).toBe(fnv1a32('test'));
  });

  it('should produce different hashes for different inputs', () => {
    expect(fnv1a32('hello')).not.toBe(fnv1a32('world'));
  });

  it('should handle empty string', () => {
    const result = fnv1a32('');
    expect(result).toMatch(/^[0-9a-f]{8}$/);
  });

  it('should handle unicode characters', () => {
    const result = fnv1a32('こんにちは');
    expect(result).toMatch(/^[0-9a-f]{8}$/);
  });

  it('should have good avalanche — single char change flips many bits', () => {
    const a = parseInt(fnv1a32('test1'), 16);
    const b = parseInt(fnv1a32('test2'), 16);
    const xor = a ^ b;
    const bitsFlipped = xor.toString(2).split('1').length - 1;
    expect(bitsFlipped).toBeGreaterThan(4);
  });
});

describe('contentHash', () => {
  it('should return an 8-character hex string for an object', () => {
    const result = contentHash({ slug: 'goblin', cr: '1/4' });
    expect(result).toMatch(/^[0-9a-f]{8}$/);
  });

  it('should be order-independent — different key order gives same hash', () => {
    const a = contentHash({ slug: 'goblin', cr: '1/4', title: 'Goblin' });
    const b = contentHash({ title: 'Goblin', slug: 'goblin', cr: '1/4' });
    expect(a).toBe(b);
  });

  it('should produce different hashes when values change', () => {
    const a = contentHash({ slug: 'goblin', cr: '1/4' });
    const b = contentHash({ slug: 'goblin', cr: '1/2' });
    expect(a).not.toBe(b);
  });

  it('should handle nested objects with stable key ordering', () => {
    const a = contentHash({ ac: { value: 15, notes: 'natural' } });
    const b = contentHash({ ac: { notes: 'natural', value: 15 } });
    expect(a).toBe(b);
  });

  it('should handle arrays without reordering', () => {
    const a = contentHash({ tags: ['monster', 'undead'] });
    const b = contentHash({ tags: ['undead', 'monster'] });
    expect(a).not.toBe(b);
  });

  it('should handle empty objects', () => {
    const result = contentHash({});
    expect(result).toMatch(/^[0-9a-f]{8}$/);
  });
});
