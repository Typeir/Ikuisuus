/**
 * @fileoverview Unit tests for the paged sheet.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Sheet.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import Sheet from '@/modules/library/presentation/components/slots/Sheet';

beforeAll(() => {
  const idle = class {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn(() => []);
  };
  vi.stubGlobal('IntersectionObserver', idle);
  vi.stubGlobal('ResizeObserver', idle);
});

/**
 * A sheet shaped the way the compiler hands one over.
 *
 * @returns {JSX.Element} The sheet's children
 */
function sheet(): React.JSX.Element {
  return (
    <>
      <p>Lead prose.</p>
      <h2 data-anchor='traits'>Traits</h2>
      <p>A passive.</p>
      <hr />
      <section data-anchor='features' data-heading-level={2}>
        <h2 data-anchor='features'>Features</h2>
        <p>A swing.</p>
      </section>
    </>
  );
}

/**
 * One page holding a group, which holds a block of its own.
 *
 * @returns {React.JSX.Element} The sheet's children
 */
function deepSheet(): React.JSX.Element {
  return (
    <section data-anchor='features' data-heading-level={2}>
      <h2 data-anchor='features'>Features</h2>
      <section data-anchor='attacks' data-heading-level={3}>
        <h3 data-anchor='attacks'>Attacks</h3>
        <section data-anchor='slam' data-heading-level={5}>
          <h5 data-anchor='slam'>Slam</h5>
          <p>Hits.</p>
        </section>
      </section>
      <section data-anchor='multiattack' data-heading-level={3}>
        <h3 data-anchor='multiattack'>Multiattack</h3>
        <p>Twice.</p>
      </section>
    </section>
  );
}

describe('Sheet', () => {
  it('makes one tab per named division, bare or wrapped', () => {
    render(<Sheet pages='traits, features'>{sheet()}</Sheet>);

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Traits',
      'Features',
    ]);
  });

  it('prints the label an entry asks for', () => {
    render(<Sheet pages='traits: What It Is, features'>{sheet()}</Sheet>);

    expect(screen.getAllByRole('tab')[0].textContent).toBe('What It Is');
  });

  it('shows only the selected page, first one first', () => {
    render(<Sheet pages='traits, features'>{sheet()}</Sheet>);

    expect(screen.getByRole('tabpanel').textContent).toContain('A passive.');
    expect(screen.getByRole('tabpanel').textContent).not.toContain('A swing.');
  });

  it('turns to the page a tab names', async () => {
    const user = userEvent.setup();
    render(<Sheet pages='traits, features'>{sheet()}</Sheet>);

    await user.click(screen.getAllByRole('tab')[1]);

    expect(screen.getByRole('tabpanel').textContent).toContain('A swing.');
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  /* What comes before the first page introduces the sheet, so it stays put
     rather than disappearing with whichever page happens to be off screen. */
  it('keeps the lead-in above the selector', () => {
    const { container } = render(
      <Sheet pages='traits, features'>{sheet()}</Sheet>,
    );

    const lead = container.querySelector('p');
    expect(lead?.textContent).toBe('Lead prose.');
    expect(lead?.closest('[role="tabpanel"]')).toBeNull();
  });

  /* Naming the pages is an override; the sheet pages itself otherwise. */
  it('makes a tab of every subsection when it is told none', () => {
    render(<Sheet>{sheet()}</Sheet>);

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Traits',
      'Features',
    ]);
  });

  it('pages at the rank it is given', () => {
    render(
      <Sheet level={3}>
        <section data-anchor='attacks' data-heading-level={3}>
          <h3 data-anchor='attacks'>Attacks</h3>
        </section>
        <section data-anchor='deeds' data-heading-level={3}>
          <h3 data-anchor='deeds'>Deeds</h3>
        </section>
      </Sheet>,
    );

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Attacks',
      'Deeds',
    ]);
  });

  /* A block that holds divisions is worth a heading until it is asked for; one
     that holds none would collapse to nothing but its own title. */
  it('collapses what holds divisions and leaves the leaves open', () => {
    const { container } = render(<Sheet>{deepSheet()}</Sheet>);

    expect(
      container.querySelector('[data-anchor="attacks"][data-folded]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-anchor="multiattack"][data-folded]'),
    ).toBeNull();
    expect(container.querySelector('summary h3')?.textContent).toBe('Attacks');
  });

  it('collapses nothing when the depth is out of reach', () => {
    const { container } = render(<Sheet nest={9}>{deepSheet()}</Sheet>);

    expect(container.querySelectorAll('details')).toHaveLength(0);
    expect(screen.getByText('Hits.')).toBeInTheDocument();
  });

  it('leaves the sheet alone when it holds no subsection to page', () => {
    render(
      <Sheet>
        <p>Only prose.</p>
      </Sheet>,
    );

    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(screen.getByText('Only prose.')).toBeInTheDocument();
  });
});
