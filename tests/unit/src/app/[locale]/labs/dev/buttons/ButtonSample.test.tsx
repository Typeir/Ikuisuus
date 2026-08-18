/**
 * @fileoverview Unit tests for the button catalogue sample renderer.
 * @description Verifies each variant renders a `<button>`, icon-only variants carry
 * an accessible name, `tabActive` composes with `tab`, and unknown names fall back
 * to a labelled button.
 *
 * @module tests/unit/src/app/[locale]/labs/dev/buttons/ButtonSample.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/[locale]/labs/dev/buttons/ButtonSample
 */

import { ButtonSample } from '@/app/[locale]/labs/dev/buttons/ButtonSample';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const btn = new Proxy({} as Record<string, string>, {
  get: (_target, key: string) => key,
});

const ICON_VARIANTS = ['tertiary', 'icon', 'iconDanger', 'iconRound'];

describe('ButtonSample', () => {
  it('renders the bare primary without a class', () => {
    render(<ButtonSample name='bare' btn={btn} />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.className).toBe('');
  });

  it.each(ICON_VARIANTS)('gives %s an accessible name', (name) => {
    render(<ButtonSample name={name} btn={btn} />);
    expect(screen.getByRole('button')).toHaveAccessibleName();
  });

  it('composes tabActive with tab', () => {
    render(<ButtonSample name='tabActive' btn={btn} />);
    const button = screen.getByRole('button', { name: 'Active tab' });
    expect(button.className).toContain('tab');
    expect(button.className).toContain('tabActive');
  });

  it('applies the mapped class for a text variant', () => {
    render(<ButtonSample name='row' btn={btn} />);
    expect(screen.getByRole('button', { name: 'Full-width row' })).toHaveClass(
      'row',
    );
  });

  it('labels the add affordance', () => {
    render(<ButtonSample name='add' btn={btn} />);
    expect(
      screen.getByRole('button', { name: 'Add item' }),
    ).toBeInTheDocument();
  });

  it('falls back to a labelled button for an unknown variant', () => {
    render(<ButtonSample name='brandNew' btn={btn} />);
    const button = screen.getByRole('button', { name: 'brandNew' });
    expect(button).toHaveClass('brandNew');
  });
});
