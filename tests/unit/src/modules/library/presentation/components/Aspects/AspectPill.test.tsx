/**
 * @fileoverview Unit Tests — AspectPill
 * @description Link, button, inert and removable renderings of a single pill.
 *
 * @module tests/unit/src/modules/library/presentation/components/Aspects/AspectPill.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-27
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Rendering utilities
 */

import { AspectPill } from '@/modules/library/presentation/components/Aspects/AspectPill';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fire = { raw: 'damage:fire', group: 'damage', value: 'fire' };

afterEach(() => cleanup());

describe('AspectPill', () => {
  it('should link to its pre-filtered search by default', () => {
    render(<AspectPill aspect={fire} locale='en' />);

    expect(screen.getByRole('link', { name: 'damage: fire' })).toHaveAttribute(
      'href',
      '/en/search?aspect=damage%3Afire',
    );
  });

  it('should render a button that reports its pressed state with onSelect', async () => {
    const onSelect = vi.fn();
    render(<AspectPill aspect={fire} locale='en' onSelect={onSelect} pressed />);

    const pill = screen.getByRole('button', { name: 'damage: fire' });
    expect(pill).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(pill);

    expect(onSelect).toHaveBeenCalledWith(fire);
  });

  it('should carry the remove button without nesting it in another button', async () => {
    const onRemove = vi.fn();
    render(
      <AspectPill
        aspect={fire}
        locale='en'
        onRemove={onRemove}
        removeLabel='Remove damage: fire'
      />,
    );

    const remove = screen.getByRole('button', { name: 'Remove damage: fire' });
    expect(remove.closest('button')).toBe(remove);
    await userEvent.click(remove);

    expect(onRemove).toHaveBeenCalledWith(fire);
  });

  it('should name the remove button after the aspect when the caller gives no label', () => {
    render(<AspectPill aspect={fire} locale='en' onRemove={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Remove damage: fire' }),
    ).toBeInTheDocument();
  });

  it('should render a plain span when inert', () => {
    render(<AspectPill aspect={fire} locale='en' inert />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByLabelText('damage: fire').tagName).toBe('SPAN');
  });
});
