/**
 * @fileoverview Unit tests for Collapsible MDX component
 * @module tests/unit/src/modules/library/presentation/components/Collapsible/collapsible.test
 * @description Validates Collapsible rendering, heading detection, cost extraction,
 * body content, and native details/summary behaviour.
 *
 * @version 2.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @testing-library/react
 * @requires @/modules/library/presentation/components/Collapsible
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import Collapsible from '@/modules/library/presentation/components/Collapsible';

describe('Collapsible', () => {
  it('renders with native details/summary', () => {
    const { container } = render(
      <Collapsible>
        <h2>Title</h2>
        <p>Body content</p>
      </Collapsible>,
    );
    expect(container.querySelector('details')).toBeInTheDocument();
    expect(container.querySelector('summary')).toBeInTheDocument();
  });

  it('extracts heading text into summary', () => {
    render(
      <Collapsible>
        <h3>Extended Reach</h3>
        <p>Your melee weapon attacks have a reach of 5 ft greater.</p>
      </Collapsible>,
    );
    expect(screen.getByText('Extended Reach')).toBeInTheDocument();
  });

  it('extracts cost from trailing span in heading', () => {
    render(
      <Collapsible>
        <h3>
          Extended Reach <span>6 BP</span>
        </h3>
        <p>Body</p>
      </Collapsible>,
    );
    expect(screen.getByText('6 BP')).toBeInTheDocument();
    expect(screen.getByText('Extended Reach')).toBeInTheDocument();
  });

  it('renders body content outside summary', () => {
    render(
      <Collapsible>
        <h2>Title</h2>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
      </Collapsible>,
    );
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });

  it('uses "Details" as fallback when no heading', () => {
    render(
      <Collapsible>
        <p>Some content without heading</p>
      </Collapsible>,
    );
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('starts collapsed by default', () => {
    const { container } = render(
      <Collapsible>
        <h2>Title</h2>
        <p>Body</p>
      </Collapsible>,
    );
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('starts open when open prop is true', () => {
    const { container } = render(
      <Collapsible open>
        <h2>Title</h2>
        <p>Body</p>
      </Collapsible>,
    );
    expect(container.querySelector('details')).toHaveAttribute('open');
  });

  it('handles multiple children with heading not first', () => {
    render(
      <Collapsible>
        <p>Before heading</p>
        <h4>The Heading</h4>
        <p>After heading</p>
      </Collapsible>,
    );
    expect(screen.getByText('The Heading')).toBeInTheDocument();
    expect(screen.getByText('Before heading')).toBeInTheDocument();
    expect(screen.getByText('After heading')).toBeInTheDocument();
  });

  it('handles heading levels h1-h6', () => {
    for (const Tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const) {
      const { unmount } = render(
        <Collapsible>
          {React.createElement(Tag, null, `Level ${Tag}`)}
          <p>Body</p>
        </Collapsible>,
      );
      expect(screen.getByText(`Level ${Tag}`)).toBeInTheDocument();
      unmount();
    }
  });

  it('renders without children', () => {
    const { container } = render(<Collapsible />);
    expect(container.querySelector('details')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('ignores cost span with empty text', () => {
    render(
      <Collapsible>
        <h3>
          Title <span> </span>
        </h3>
        <p>Body</p>
      </Collapsible>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
  });
});
