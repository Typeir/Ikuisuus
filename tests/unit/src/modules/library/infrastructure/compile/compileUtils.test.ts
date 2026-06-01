import { buildMdxOptions, importAllAsync } from '@/modules/library/infrastructure/compile/compileUtils';
import { describe, expect, it } from 'vitest';

describe('compileUtils exports', () => {
  it('exports buildMdxOptions', () => {
    expect(typeof buildMdxOptions).toBe('function');
  });

  it('importAllAsync returns expected properties', async () => {
    const mods = await importAllAsync();
    expect(mods).toHaveProperty('evaluate');
    expect(mods).toHaveProperty('remarkGfm');
  });
});
