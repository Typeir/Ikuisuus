/**
 * @fileoverview Unit tests for the feat card.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Feat.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Feat from '@/modules/library/presentation/components/slots/Feat';
import { briefText, printed } from './cardQueries';

describe('Feat', () => {
  it('writes the ability sentence the corpus repeats by hand', () => {
    render(<Feat ability='Dexterity or Wisdom' />);
    expect(document.querySelector('[data-feat-ability]')).not.toBeNull();
  });

  it('names its category and prerequisite', () => {
    render(<Feat category='Epic Boon' prerequisite='Level 19' />);
    /* Under test a translator echoes its key, so this asserts the lookup
       reached the catalogue rather than printing the authored text. */
    expect(briefText('data-feat-brief')).toBe('category.epicBoon');
    expect(printed()).toEqual(['prerequisite']);
  });

  it('prints an unlisted category as authored', () => {
    render(<Feat category='heroic' />);
    expect(briefText('data-feat-brief')).toBe('Heroic');
  });

  it('omits the ability sentence when the feat raises nothing', () => {
    render(
      <Feat category='General'>
        <p>Body prose.</p>
      </Feat>,
    );
    expect(document.querySelector('[data-feat-ability]')).toBeNull();
  });

  it('reads repeatable as a bare flag, a word, or a detail', () => {
    render(<Feat repeatable />);
    expect(briefText('data-feat-brief')).toBe('repeatable');
    document.body.innerHTML = '';

    render(<Feat category='General' repeatable='true' />);
    expect(briefText('data-feat-brief')).toBe('category.general, repeatable');
    document.body.innerHTML = '';

    render(<Feat category='General' repeatable='once per tier' />);
    expect(briefText('data-feat-brief')).toBe('category.general, once per tier');
    document.body.innerHTML = '';

    render(<Feat category='General' repeatable='false' />);
    expect(briefText('data-feat-brief')).toBe('category.general');
  });
});
