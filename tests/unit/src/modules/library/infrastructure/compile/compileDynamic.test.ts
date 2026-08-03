import { compileDynamic } from '@/modules/library/infrastructure/compile/compileDynamic';
import { describe, expect, it } from 'vitest';

describe('compileDynamic module', () => {
  it('exports compileDynamic', () => {
    expect(typeof compileDynamic).toBe('function');
  });
});
