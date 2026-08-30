/**
 * @fileoverview HelpGlyph tests
 * @description Decorative mark, size classes, layout class passthrough.
 *
 * @module tests/unit/src/lib/components/ui/helpGlyph/HelpGlyph.test
 */

import { HelpGlyph } from '@/lib/components/ui/helpGlyph';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('HelpGlyph', () => {
  it('renders a hidden ? mark at size s by default', () => {
    const { container } = render(<HelpGlyph />);
    const glyph = container.firstElementChild as HTMLElement;
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(glyph).toHaveAttribute('data-size', 's');
    expect(glyph.textContent).toBe('?');
  });

  it('applies the size and layout classes', () => {
    const { container } = render(<HelpGlyph size='xs' className='slot' />);
    const glyph = container.firstElementChild as HTMLElement;
    expect(glyph).toHaveAttribute('data-size', 'xs');
    expect(glyph.className).toMatch(/xs/);
    expect(glyph.className).toMatch(/slot/);
  });
});
