import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/local', () => ({
  default: (options: Record<string, unknown>) => ({
    className: 'mock-font',
    variable: options.variable,
    style: { fontFamily: 'mock' },
    options,
  }),
}));

const { empyrean, fonts, junicode } = await import('@/app/fonts');

type Registered = { options: Record<string, unknown> };
const optionsOf = (font: unknown) => (font as unknown as Registered).options;

describe('app/fonts/index', () => {
  it('exports Empyrean font', () => {
    expect(empyrean).toBeDefined();
  });

  it('Empyrean font has expected properties', () => {
    expect(empyrean).toHaveProperty('variable', '--font-initialem');
    expect(empyrean).toHaveProperty('style');
    expect(empyrean).toHaveProperty('className');
  });

  it('exports Junicode as a variable face under its own variable', () => {
    expect(junicode).toHaveProperty('variable', '--font-junicode');
    expect(optionsOf(junicode).src).toEqual([
      expect.objectContaining({ weight: '300 700' }),
    ]);
    expect(optionsOf(junicode).declarations).toBeUndefined();
  });

  it('Exports an array of registered fonts', () => {
    expect(Array.isArray(fonts)).toBe(true);
    expect(fonts).toContain(empyrean);
    expect(fonts).toContain(junicode);
    expect(fonts).toHaveLength(2);
  });
});
