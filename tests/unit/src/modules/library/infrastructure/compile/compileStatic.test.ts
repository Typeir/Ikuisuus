import { compileStatic } from '@/modules/library/infrastructure/compile/compileStatic';
import { describe, expect, it } from 'vitest';

describe('compileStatic module', () => {
  it('exports compileStatic', () => {
    expect(typeof compileStatic).toBe('function');
  });
});
