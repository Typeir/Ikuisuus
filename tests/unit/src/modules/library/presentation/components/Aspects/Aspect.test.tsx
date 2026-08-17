/**
 * @fileoverview Inline Aspect Tests
 * @description Verbose default, display overrides, malformed fallback.
 *
 * @module tests/unit/src/modules/library/presentation/components/Aspects/Aspect
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { Aspect } from '@/modules/library/presentation/components/Aspects/Aspect';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<typeof import('next-intl')>(),
  );
});

describe('Aspect', () => {
  it('should render a compact link pill by default', () => {
    const { container } = render(<Aspect value='school:necromancy' />);
    const wrap = container.querySelector('[data-aspect-inline]');
    expect(wrap?.getAttribute('data-aspect-inline')).toBe('compact');
    const a = container.querySelector('a');
    expect(a?.getAttribute('href')).toContain('aspect=school%3Anecromancy');
    expect(a?.textContent).toContain('necromancy');
  });

  it('should honour the display prop', () => {
    const verbose = render(<Aspect value='damage:fire' display='verbose' />);
    expect(verbose.container.querySelector('[data-aspect-inline]')?.getAttribute('data-aspect-inline')).toBe('verbose');
    const { container } = render(<Aspect value='damage:fire' display='glyph' />);
    expect(container.querySelector('[data-aspect-inline]')?.getAttribute('data-aspect-inline')).toBe('glyph');
    expect(container.querySelector('a')?.className).toContain('glyph');
  });

  it('should show the raw token when it does not parse', () => {
    const { container } = render(<Aspect value='nonsense' />);
    expect(container.querySelector('code')?.textContent).toBe('nonsense');
    expect(container.querySelector('a')).toBeNull();
  });
});
