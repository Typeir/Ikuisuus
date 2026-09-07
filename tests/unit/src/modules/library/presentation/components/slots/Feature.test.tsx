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
  Attack,
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

  it('marks a block by what using it costs, and takes the author\'s word over that', () => {
    const marks = (cost?: string, mark?: 'major' | 'minor' | 'other') => {
      const { container } = render(
        <Feature cost={cost} mark={mark}>
          <h4>Probe</h4>
          <p>Body.</p>
        </Feature>,
      );
      return container.querySelector('article')?.getAttribute('data-mark');
    };

    expect(marks('1 Major Action')).toBe('major');
    expect(marks('1 Minor Action')).toBe('minor');
    expect(marks('forgo all movement on your turn, in combat')).toBe('other');
    expect(marks()).toBe('other');
    expect(marks('1 Major Action', 'other')).toBe('other');

    /* The cost is free text: only the action counts, not the word. */
    expect(marks('1 Reaction, taken when a major threat appears')).toBe('other');
    expect(marks('none, when a minor wound closes')).toBe('other');
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

describe('Attack', () => {
  it('prints accuracy and reach as slot lines under the heading, and the hit as prose', () => {
    const { container } = render(
      <Attack accuracy='+7' reach='[= 3 stride =]'>
        <h5>Lash</h5>
        <p>On a hit, 13.</p>
      </Attack>,
    );
    const article = container.querySelector('article');
    expect(article).toHaveAttribute('data-kind', 'attack');
    expect(article).toHaveAttribute('data-anchor', 'lash');
    expect(container.querySelector('h5 [data-heading-title]')?.textContent).toBe('Lash');
    expect(container.querySelector('[data-slot="accuracy"] [data-slot-value]')?.textContent).toBe('+7');
    expect(container.querySelector('[data-slot="reach"] [data-slot-value]')?.textContent).toBe('[= 3 stride =]');
    expect(container.querySelector('[data-feature-body]')?.textContent).toBe('On a hit, 13.');
  });

  it('renders without a heading inside a bare action, range and targets as lines', () => {
    const { container } = render(
      <Attack accuracy='+8' range='[= 6 stride =]' targets='up to two targets'>
        <p>On a hit, 5.</p>
      </Attack>,
    );
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    expect(container.querySelector('[data-slot="range"] [data-slot-value]')?.textContent).toBe('[= 6 stride =]');
    expect(container.querySelector('[data-slot="targets"] [data-slot-value]')?.textContent).toBe('up to two targets');
  });

  it('folds into a details block when collapsible, keeping the heading as the summary', () => {
    const { container } = render(
      <Feature collapsible cost='1 Minor Action' targets='you'>
        <h6>
          Extended Reach <span>6 BP</span>
        </h6>
        <p>Prose body.</p>
      </Feature>,
    );
    const article = container.querySelector('article');
    expect(article).toHaveAttribute('data-collapsible', 'true');
    expect(article).toHaveAttribute('data-anchor', 'extended-reach');
    const summary = container.querySelector('details > summary');
    expect(summary?.textContent).toContain('Extended Reach');
    expect(summary?.textContent).toContain('6 BP');
    expect(summary).toHaveAttribute('data-anchor', 'extended-reach');
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    // the slot grid folds away with the prose rather than sitting above it
    expect(container.querySelector('details [data-slot-grid]')).not.toBeNull();
    expect(container.querySelector('details [data-feature-body]')?.textContent).toBe('Prose body.');
  });

  it('keeps its heading and shows the grid outside any details block when not collapsible', () => {
    const { container } = render(
      <Feature cost='1 Minor Action'>
        <h6>Extended Reach</h6>
        <p>Prose body.</p>
      </Feature>,
    );
    expect(container.querySelector('details')).toBeNull();
    expect(container.querySelector('article')).not.toHaveAttribute('data-collapsible');
    expect(container.querySelector('h6 [data-heading-title]')?.textContent).toBe('Extended Reach');
  });

  it('waives the section ornament when it folds, since it draws its own bar', () => {
    const { container } = render(
      <Feature collapsible>
        <h6>Extended Reach</h6>
      </Feature>,
    );
    expect(container.querySelector('article')).toHaveAttribute('data-ornament', 'none');
  });

  it('keeps the ornament on a block that does not fold', () => {
    const { container } = render(
      <Feature>
        <h6>Extended Reach</h6>
      </Feature>,
    );
    expect(container.querySelector('article')).not.toHaveAttribute('data-ornament');
  });

  it('takes the ornament back when the block asks for it', () => {
    const { container } = render(
      <Feature collapsible ornament>
        <h6>Extended Reach</h6>
      </Feature>,
    );
    expect(container.querySelector('article')).not.toHaveAttribute('data-ornament');
  });
});
