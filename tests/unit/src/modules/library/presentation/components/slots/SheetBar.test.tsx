/**
 * @fileoverview SheetBar Tests
 * @module tests/unit/src/modules/library/presentation/components/slots/SheetBar.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import SheetBar from '@/modules/library/presentation/components/slots/SheetBar';
import { type Division } from '@/modules/library/presentation/components/slots/divisions';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

/**
 * A page for the bar to name.
 *
 * @param {string} anchor - Its anchor.
 * @param {string} name - Its heading text.
 * @returns {Division} The page.
 */
const pageOf = (anchor: string, name: string): Division =>
  ({ anchor, name, rank: 2, body: [] }) as unknown as Division;

const PAGES = [pageOf('traits', 'Traits'), pageOf('features', 'Features')];

/**
 * Renders the bar with the given overrides.
 *
 * @param {Partial<React.ComponentProps<typeof SheetBar>>} over - Overrides.
 * @returns {ReturnType<typeof render>} The rendered bar.
 */
const draw = (over: Partial<React.ComponentProps<typeof SheetBar>> = {}) =>
  render(
    <SheetBar
      pages={PAGES}
      labels={new Map()}
      active={0}
      foot={false}
      stuck={false}
      innerRef={React.createRef<HTMLDivElement>()}
      onTurn={() => {}}
      {...over}
    />,
  );

describe('SheetBar', () => {
  it('should render one tab per page, named by its heading', () => {
    draw();
    expect(screen.getByRole('tab', { name: 'Traits' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Features' })).toBeInTheDocument();
  });

  it('should prefer a label given in content over the heading', () => {
    draw({ labels: new Map([['traits', 'Qualities']]) });
    expect(screen.getByRole('tab', { name: 'Qualities' })).toBeInTheDocument();
  });

  it('should mark only the active tab as selected', () => {
    draw({ active: 1 });
    expect(screen.getByRole('tab', { name: 'Features' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Traits' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('should ask for the page a tab names', () => {
    const onTurn = vi.fn();
    draw({ onTurn });
    fireEvent.click(screen.getByRole('tab', { name: 'Features' }));
    expect(onTurn).toHaveBeenCalledWith(1);
  });

  it('should take its ground only once stuck when set at the top', () => {
    const { container, rerender } = draw();
    expect(container.querySelector('[data-stuck]')).toBeNull();

    rerender(
      <SheetBar
        pages={PAGES}
        labels={new Map()}
        active={0}
        foot={false}
        stuck={true}
        innerRef={React.createRef<HTMLDivElement>()}
        onTurn={() => {}}
      />,
    );
    expect(container.querySelector('[data-stuck="true"]')).not.toBeNull();
  });

  it('should be grounded from the start when set at the bottom', () => {
    const { container } = draw({ foot: true, stuck: false });
    const row = container.querySelector('[role="tablist"]');
    expect(row).toHaveAttribute('data-foot', 'true');
    expect(row).toHaveAttribute('data-stuck', 'true');
  });
});
