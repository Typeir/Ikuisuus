import { capitalize } from '@/modules/metadata-tables/domain/format';
import { describe, expect, it } from 'vitest';

describe('capitalize', () => {
  it('capitalizes the first character', () => {
    expect(capitalize('rare')).toBe('Rare');
  });

  it('lowercases the remainder', () => {
    expect(capitalize('VERY RARE')).toBe('Very rare');
  });

  it('passes the empty string through', () => {
    expect(capitalize('')).toBe('');
  });
});
