/**
 * @fileoverview Unit tests for the Feature block.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Feature.test
 * @version 0.2.0
 * @author Typeir
 * @since 2026-09-02
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Feature, {
  Curse,
  Trait,
} from '@/modules/library/presentation/components/slots/Feature';
import {
  Cost,
  Targets,
} from '@/modules/library/presentation/components/slots/slotElements';

describe('Feature', () => {
  it('renders name, tag, cost in the heading, targets as a line, and prose', () => {
    render(
      <Feature kind='feature' cost='1 Minor Action' targets='you'>
        <h6>
          Moon Step <span>Technique</span>
        </h6>
        <p>Prose body.</p>
      </Feature>,
    );
    const article = screen.getByText('Prose body.').closest('article');
    expect(article).toHaveAttribute('data-kind', 'feature');
    expect(article).toHaveAttribute('data-anchor', 'moon-step');
    const heading = article?.querySelector('h6');
    expect(heading?.querySelector('[data-feature-tag]')?.textContent).toBe(
      'Technique',
    );
    expect(heading?.querySelector('[data-feature-cost]')?.textContent).toBe(
      '1 Minor Action',
    );
    expect(article?.querySelector('[data-slot="cost"]')).toBeNull();
    expect(article?.querySelector('[data-slot="targets"]')).toBeTruthy();
  });

  it('reads a paragraph of slot elements the same way', () => {
    render(
      <Feature>
        <h6>Lunar Dissolution</h6>
        <p>
          <Cost>1 Minor Action</Cost>
          {'\n'}
          <Targets>you</Targets>
        </p>
        <p>Body.</p>
      </Feature>,
    );
    const article = screen.getByText('Body.').closest('article');
    expect(
      article?.querySelector('h6 [data-feature-cost]')?.textContent,
    ).toBe('1 Minor Action');
    expect(article?.querySelector('[data-slot="targets"]')).toBeTruthy();
    expect(article?.querySelector('[data-slot="cost"]')).toBeNull();
  });

  it('an attribute wins over a same-named element', () => {
    render(
      <Feature cost='1 Reaction'>
        <h6>Parry</h6>
        <p>
          <Cost>1 Minor Action</Cost>
        </p>
        <p>Body.</p>
      </Feature>,
    );
    const article = screen.getByText('Body.').closest('article');
    expect(
      article?.querySelector('h6 [data-feature-cost]')?.textContent,
    ).toBe('1 Reaction');
    expect(article?.querySelectorAll('[data-feature-cost]')).toHaveLength(1);
  });

  it('Trait and Curse render their kind at the authored heading level', () => {
    const { container: traitBox } = render(
      <Trait>
        <h4>Blessing</h4>
        <p>Body.</p>
      </Trait>,
    );
    expect(traitBox.querySelector('article')).toHaveAttribute(
      'data-kind',
      'trait',
    );
    expect(traitBox.querySelector('section')).toBeNull();
    expect(traitBox.querySelector('[data-stream-rail]')).toBeNull();
    expect(traitBox.querySelector('h4 > span')?.textContent).toBe('Blessing');
    expect(traitBox.querySelector('[data-slot-grid]')).toBeNull();
    const { container: curseBox } = render(
      <Curse>
        <h6>Omen</h6>
        <p>Body.</p>
      </Curse>,
    );
    expect(curseBox.querySelector('article')).toHaveAttribute(
      'data-kind',
      'curse',
    );
    expect(curseBox.querySelector('h6')?.textContent).toBe('Omen');
  });

  it('a feature is a plain article carrying its anchor, with no section of its own', () => {
    const { container } = render(
      <Feature cost='1 Minor Action'>
        <h4>Vanish</h4>
        <p>Body.</p>
      </Feature>,
    );
    expect(container.querySelector('article')).toHaveAttribute('data-anchor', 'vanish');
    expect(container.querySelector('section')).toBeNull();
    expect(container.querySelector('h4')).toHaveAttribute('data-anchor', 'vanish');
    expect(container.querySelector('h4 [data-feature-cost]')?.textContent).toBe(
      '1 Minor Action',
    );
  });
});
