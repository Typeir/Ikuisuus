/**
 * @fileoverview Unit tests for the inherited action cost.
 * @description A block that states no cost of its own is spent within the one
 * around it
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/feature/costMarkContext.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import Feature from '@/modules/library/presentation/components/slots/feature/Feature';
import Spell from '@/modules/library/presentation/components/slots/spell/Spell';
import {
  CostMarkProvider,
  useCostMark,
} from '@/modules/library/presentation/components/slots/feature/costMarkContext';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

/**
 * Prints whatever cost it was handed.
 *
 * @returns {JSX.Element} The mark as text
 */
const Reader: React.FC = () => <span data-mark-read>{useCostMark()}</span>;

describe('CostMarkProvider', () => {
  it('reads other where nothing encloses it', () => {
    render(<Reader />);
    expect(screen.getByText('other')).toBeInTheDocument();
  });

  it('hands its mark down', () => {
    render(
      <CostMarkProvider mark='deed'>
        <Reader />
      </CostMarkProvider>,
    );
    expect(screen.getByText('deed')).toBeInTheDocument();
  });
});

describe('a block that states no cost', () => {
  it('takes the mark of the block around it', () => {
    const { container } = render(
      <Feature cost='1 Major Action'>
        <h4>The Blast</h4>
        <Feature>
          <h5>The Echo</h5>
        </Feature>
      </Feature>,
    );
    const blocks = container.querySelectorAll('article[data-kind]');
    expect(blocks[0]).toHaveAttribute('data-mark', 'major');
    expect(blocks[1]).toHaveAttribute('data-mark', 'major');
  });

  it('takes the casting time of the spell around it', () => {
    const { container } = render(
      <Spell level='1' cost='1 Minor Action'>
        <Feature>
          <h4>A mode</h4>
        </Feature>
      </Spell>,
    );
    expect(container.querySelector('article[data-kind]')).toHaveAttribute(
      'data-mark',
      'minor',
    );
  });

  it('keeps its own cost over the one around it', () => {
    const { container } = render(
      <Feature cost='1 Major Action'>
        <h4>The Blast</h4>
        <Feature cost='1 Reaction'>
          <h5>The Riposte</h5>
        </Feature>
      </Feature>,
    );
    const blocks = container.querySelectorAll('article[data-kind]');
    expect(blocks[1]).toHaveAttribute('data-mark', 'reaction');
  });
});
