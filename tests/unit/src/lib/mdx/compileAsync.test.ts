import { compileAsync } from '@/lib/mdx/compileAsync';
import { describe, expect, it } from 'vitest';

describe('compileAsync module', () => {
  it('exports compileAsync', () => {
    expect(typeof compileAsync).toBe('function');
  });
});
