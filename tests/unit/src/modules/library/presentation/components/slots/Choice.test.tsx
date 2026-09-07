/**
 * @fileoverview Unit tests for the Choice group.
 * @description The group fences blocks that exclude one another and says how
 * many are taken, so a run of them cannot read as a list of grants.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Choice.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import Choice from '@/modules/library/presentation/components/slots/Choice';
import Feature from '@/modules/library/presentation/components/slots/Feature';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('Choice', () => {
  it('fences its blocks and asks for one by default', () => {
    const { container } = render(
      <Choice>
        <Feature>
          <h4>The Blast</h4>
          <p>Prose.</p>
        </Feature>
        <Feature>
          <h4>The Wave</h4>
          <p>Prose.</p>
        </Feature>
      </Choice>,
    );
    const group = container.querySelector('[data-choice]');
    expect(group).toHaveAttribute('data-choice', 'one');
    expect(group?.querySelectorAll('article[data-kind="feature"]')).toHaveLength(2);
    expect(container.querySelector('[data-choice-lead]')).not.toBeNull();
  });

  it('carries the count a page words for itself', () => {
    const { container } = render(
      <Choice pick='up to four'>
        <Feature>
          <h4>Fog</h4>
        </Feature>
      </Choice>,
    );
    expect(container.querySelector('[data-choice]')).toHaveAttribute('data-choice', 'up to four');
  });

  it('treats an empty count as one', () => {
    const { container } = render(
      <Choice pick='  '>
        <Feature>
          <h4>Spare</h4>
        </Feature>
      </Choice>,
    );
    expect(container.querySelector('[data-choice]')).toHaveAttribute('data-choice', 'one');
  });
});
