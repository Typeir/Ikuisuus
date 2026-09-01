/**
 * @fileoverview AspectGlyphs Tests
 * @description Glyph row rendering, link vs inert modes.
 *
 * @module tests/unit/src/modules/library/presentation/components/Aspects/AspectGlyphs.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { AspectGlyphs } from '@/modules/library/presentation/components/Aspects/AspectGlyphs';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<typeof import('next-intl')>(),
  );
});

describe('AspectGlyphs', () => {
  it('should render nothing without displayable aspects', () => {
    const { container } = render(<AspectGlyphs tags={['meta:x']} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render one link glyph per aspect', () => {
    const { container } = render(
      <AspectGlyphs tags={['damage:fire', 'tempo:reactive']} />,
    );
    expect(container.querySelectorAll('a')).toHaveLength(2);
    expect(container.querySelector('a')?.getAttribute('title')).toBe(
      'damage: fire',
    );
  });

  it('should render inert spans when asked', () => {
    const { container } = render(<AspectGlyphs tags={['damage:fire']} inert />);
    expect(container.querySelectorAll('a, button')).toHaveLength(0);
    expect(
      container.querySelectorAll('span[title="damage: fire"]'),
    ).toHaveLength(1);
  });

  it('should cap the row and fold the rest into a +n marker', () => {
    const { container } = render(
      <AspectGlyphs tags={['damage:fire', 'damage:frost', 'tempo:reactive']} max={2} inert />,
    );
    expect(container.querySelectorAll('span[title]')).toHaveLength(3);
    const more = container.querySelector('span[title="tempo: reactive"]');
    expect(more?.textContent).toBe('+1');
  });
});
