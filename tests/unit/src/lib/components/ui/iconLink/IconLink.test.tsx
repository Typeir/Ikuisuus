/**
 * @fileoverview IconLink atom tests
 * @module tests/unit/src/lib/components/ui/iconLink/IconLink.test
 */

import { IconLink } from '@/lib/components/ui/iconLink';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('IconLink', () => {
  it('renders a link with the label and a trailing hidden glyph', () => {
    render(
      <IconLink kind='edit' href='/en/utils/mdx-editor?slug=x'>
        Suggest edit
      </IconLink>,
    );
    const link = screen.getByRole('link', { name: 'Suggest edit' });
    expect(link).toHaveAttribute('href', '/en/utils/mdx-editor?slug=x');
    expect(link).toHaveAttribute('data-kind', 'edit');
    const svg = link.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(link.lastElementChild).toBe(svg);
  });

  it('applies size and layout classes', () => {
    render(
      <IconLink kind='external' href='https://example.com' size='s' className='slot'>
        Out
      </IconLink>,
    );
    const link = screen.getByRole('link', { name: 'Out' });
    expect(link.className).toMatch(/\bs\b|_s_/);
    expect(link.className).toMatch(/slot/);
  });
});
