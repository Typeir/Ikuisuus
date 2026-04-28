import { empyrean } from '@app/fonts';
import { describe, expect, it } from 'vitest';

describe('app/fonts/index', () => {
  it('exports Empyrean font', () => {
    expect(empyrean).toBeDefined();
  });
  it('Empyrean font has expected properties', () => {
    expect(empyrean).toHaveProperty('variable');
    expect(empyrean).toHaveProperty('style');
    expect(empyrean).toHaveProperty('className');
  });
  it('Exports an array of registered fonts', () => {
    const { fonts } = require('@app/fonts');
    expect(Array.isArray(fonts)).toBe(true);
    expect(fonts).toContain(empyrean);
  });
});
