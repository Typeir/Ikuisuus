/**
 * @fileoverview Nested Sheet Tests
 * @module tests/unit/src/modules/library/presentation/components/slots/nestedSheet.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import Monster from '@/modules/library/presentation/components/slots/monster/Monster';
import Sheet from '@/modules/library/presentation/components/slots/sheet/Sheet';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeAll, describe, expect, it } from 'vitest';

/* The sheet watches its own bar to know when it has pinned, and jsdom has
   neither observer. Nothing here turns on what they report. */
beforeAll(() => {
  class Idle {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): [] {
      return [];
    }
  }
  Object.assign(globalThis, {
    IntersectionObserver: Idle,
    ResizeObserver: Idle,
  });
});

/**
 * A sectionised division, the way the compiler emits one.
 *
 * @param {string} anchor - Its anchor.
 * @param {number} rank - Its heading rank.
 * @param {string} text - Its heading text.
 * @param {React.ReactNode} body - What it holds.
 * @returns {React.ReactElement} The section.
 */
const section = (
  anchor: string,
  rank: number,
  text: string,
  body: React.ReactNode,
): React.ReactElement => {
  const Tag = `h${rank}` as 'h1';
  return (
    <section key={anchor} data-anchor={anchor} data-heading-level={rank}>
      <Tag data-anchor={anchor} data-title={text}>{text}</Tag>
      {body}
    </section>
  );
};

describe('a sheet inside a sheet', () => {
  it('should let the inner sheet keep its own bar', () => {
    render(
      <Sheet foot level='1'>
        {section(
          'creature-one',
          1,
          'Creature One',
          <Sheet>
            {section('traits', 2, 'Traits', <p>a trait</p>)}
            {section('features', 2, 'Features', <p>a feature</p>)}
          </Sheet>,
        )}
        {section('creature-two', 1, 'Creature Two', <p>plain</p>)}
      </Sheet>,
    );

    const bars = screen.getAllByRole('group');
    expect(bars).toHaveLength(2);
  });

  it('should let the inner sheet keep its bar through a creature block', () => {
    render(
      <Sheet foot level='1'>
        {section(
          'creature-one',
          1,
          'Creature One',
          <Monster size='Medium' type='Construct'>
            <Sheet>
              {section('traits', 2, 'Traits', <p>a trait</p>)}
              {section('features', 2, 'Features', <p>a feature</p>)}
            </Sheet>
          </Monster>,
        )}
        {section('creature-two', 1, 'Creature Two', <p>plain</p>)}
      </Sheet>,
    );

    expect(screen.getAllByRole('group')).toHaveLength(2);
  });

  /* The compiler leaves the first heading inside a component unsectioned, so
     an inner sheet's opening division arrives bare and the rest arrive
     wrapped. */
  it('should read an inner sheet whose first division arrives bare', () => {
    render(
      <Sheet foot level='1'>
        <h1 data-anchor='creature-one'>Creature One</h1>
        <Monster size='Medium' type='Construct'>
          <Sheet>
            <h2 data-anchor='traits'>Traits</h2>
            <p>a trait</p>
            {section('features', 2, 'Features', <p>a feature</p>)}
          </Sheet>
        </Monster>
        {section('creature-two', 1, 'Creature Two', <p>plain</p>)}
      </Sheet>,
    );

    expect(screen.getAllByRole('group')).toHaveLength(2);
  });

  it('should name a tab by its heading, punctuation and all', () => {
    render(
      <Sheet foot level='1'>
        {section(
          'husk-of-xanthosis-spellcasterranged',
          1,
          'Husk of Xanthosis (Spellcaster/Ranged)',
          <p>a</p>,
        )}
        {section('husk-of-xanthosis-biter', 1, 'Husk of Xanthosis (Biter)', <p>b</p>)}
      </Sheet>,
    );

    expect(
      screen.getByRole('button', { name: 'Husk of Xanthosis (Spellcaster/Ranged)' }),
    ).toBeInTheDocument();
  });
});

describe('wordsOf', () => {
  /**
   * A stamped division whose first letter is drawn into its own span, the way
   * a rendered heading arrives.
   *
   * @param {string} anchor - Its anchor.
   * @param {string} title - Its words.
   * @returns {JSX.Element} The division.
   */
  const stamped = (anchor: string, title: string) => (
    <section
      key={anchor}
      data-anchor={anchor}
      data-title={title}
      data-heading-level={2}>
      <h2 data-anchor={anchor} data-title={title}>
        <span className='first-letter'>{title[0]}</span>
        {title.slice(1)}
      </h2>
    </section>
  );

  it('reads a heading whose first letter is drawn apart', () => {
    render(
      <Sheet foot multi>
        {stamped('lunar-chimera-lion', 'Lunar Chimera, Lion')}
        {stamped('lunar-chimera-goat', 'Lunar Chimera, Goat')}
      </Sheet>,
    );

    expect(screen.getByRole('button', { name: 'Lion' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Lunar Chimera, Lion' }),
    ).toBeInTheDocument();
  });

  it('drops the opening every creature on a swapper shares', () => {
    render(
      <Sheet foot multi>
        {stamped('husk-sword', 'Husk of Xanthosis (Sword-Wielder)')}
        {stamped('husk-biter', 'Husk of Xanthosis (Biter)')}
        {stamped('husk-caster', 'Husk of Xanthosis (Spellcaster/Ranged)')}
      </Sheet>,
    );

    for (const name of ['Sword-Wielder', 'Biter', 'Spellcaster/Ranged']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('keeps whole names when the creatures share no opening', () => {
    render(
      <Sheet foot multi>
        {stamped('hunter-frog', 'Hunter Frog')}
        {stamped('golden-frog', 'Golden Frog')}
      </Sheet>,
    );

    expect(screen.getByRole('button', { name: 'Hunter Frog' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Golden Frog' })).toBeInTheDocument();
  });
});
