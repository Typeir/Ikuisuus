import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/local', () => ({
  default: (options: Record<string, unknown>) => ({
    className: 'mock-font',
    variable: options.variable,
    style: { fontFamily: 'mock' },
    options,
  }),
}));

const { empyrean, fonts, grandCru, stropica } = await import('@/app/fonts');

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

  it('exports Stropica as the emphasis face', () => {
    expect(stropica).toHaveProperty('variable', '--font-emphasis');
    expect(stropica).toHaveProperty('style');
    expect(stropica).toHaveProperty('className');
  });

  it('compensates Stropica cap height so bold runs match body copy', () => {
    expect(optionsOf(stropica).declarations).toEqual([
      { prop: 'size-adjust', value: '141%' },
    ]);
    expect(optionsOf(stropica).adjustFontFallback).toBe(false);
  });

  it('exports Grand Cru as the heading face at its true weight', () => {
    expect(grandCru).toHaveProperty('variable', '--font-headings');
    expect(optionsOf(grandCru).src).toEqual([
      expect.objectContaining({ weight: '300' }),
    ]);
    expect(optionsOf(grandCru).declarations).toBeUndefined();
  });

  it('Exports an array of registered fonts', () => {
    expect(Array.isArray(fonts)).toBe(true);
    expect(fonts).toContain(empyrean);
    expect(fonts).toContain(stropica);
    expect(fonts).toContain(grandCru);
  });
});
