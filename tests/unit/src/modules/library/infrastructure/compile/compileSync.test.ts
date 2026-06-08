import { compileSync } from '@/modules/library/infrastructure/compile/compileSync';
import { describe, expect, it } from 'vitest';

describe('compileSync module', () => {
  it('exports compileSync', () => {
    expect(typeof compileSync).toBe('function');
  });
});
