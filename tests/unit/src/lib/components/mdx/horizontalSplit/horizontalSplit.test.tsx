/**
 * Unit tests for HorizontalSplit component
 *
 * @module horizontalSplit.test
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HorizontalSplit } from '@/lib/components/mdx/horizontalSplit/horizontalSplit';

describe('HorizontalSplit', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<HorizontalSplit />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should apply module styles className', () => {
      const { container } = render(<HorizontalSplit />);
      const div = container.firstChild as HTMLElement;
      expect(div?.className).toContain('horizontalSplit');
    });

    it('should render without children', () => {
      const { container } = render(<HorizontalSplit />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should render with children', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <div>Child content</div>
        </HorizontalSplit>,
      );
      expect(getByText('Child content')).toBeInTheDocument();
    });
  });

  describe('gap prop', () => {
    it('should have default gap of 24px', () => {
      const { container } = render(<HorizontalSplit />);
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ gap: '24px' });
    });

    it('should apply numeric gap as px', () => {
      const { container } = render(<HorizontalSplit gap={32} />);
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ gap: '32px' });
    });

    it('should apply string gap as-is', () => {
      const { container } = render(<HorizontalSplit gap="2rem" />);
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ gap: '2rem' });
    });

    it('should handle zero gap', () => {
      const { container } = render(<HorizontalSplit gap={0} />);
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ gap: '0px' });
    });

    it('should handle percentage gap', () => {
      const { container } = render(<HorizontalSplit gap="5%" />);
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ gap: '5%' });
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <HorizontalSplit className="custom-split" />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div?.className).toContain('custom-split');
    });

    it('should preserve module className', () => {
      const { container } = render(
        <HorizontalSplit className="custom-split" />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div?.className).toContain('horizontalSplit');
      expect(div?.className).toContain('custom-split');
    });

    it('should handle multiple classNames', () => {
      const { container } = render(
        <HorizontalSplit className="class1 class2 class3" />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div?.className).toContain('class1');
      expect(div?.className).toContain('class2');
      expect(div?.className).toContain('class3');
    });

    it('should handle undefined className', () => {
      const { container } = render(<HorizontalSplit className={undefined} />);
      const div = container.firstChild as HTMLElement;
      expect(div?.className).toContain('horizontalSplit');
      expect(div?.className).toContain('undefined');
    });
  });

  describe('children rendering', () => {
    it('should render text children', () => {
      const { getByText } = render(
        <HorizontalSplit>Simple text</HorizontalSplit>,
      );
      expect(getByText('Simple text')).toBeInTheDocument();
    });

    it('should render React element children', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <h1>Title</h1>
        </HorizontalSplit>,
      );
      expect(getByText('Title')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </HorizontalSplit>,
      );
      expect(getByText('First')).toBeInTheDocument();
      expect(getByText('Second')).toBeInTheDocument();
      expect(getByText('Third')).toBeInTheDocument();
    });
  });

  describe('Left and Right slot components', () => {
    it('should render Left slot', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Left>Left content</HorizontalSplit.Left>
        </HorizontalSplit>,
      );
      expect(getByText('Left content')).toBeInTheDocument();
    });

    it('should render Right slot', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Right>Right content</HorizontalSplit.Right>
        </HorizontalSplit>,
      );
      expect(getByText('Right content')).toBeInTheDocument();
    });

    it('should render both Left and Right slots', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Left>Left content</HorizontalSplit.Left>
          <HorizontalSplit.Right>Right content</HorizontalSplit.Right>
        </HorizontalSplit>,
      );
      expect(getByText('Left content')).toBeInTheDocument();
      expect(getByText('Right content')).toBeInTheDocument();
    });

    it('should apply float right to Right slot', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Right float="right">Right content</HorizontalSplit.Right>
        </HorizontalSplit>,
      );
      const rightSlot = getByText('Right content');
      expect(rightSlot).toBeDefined();
    });

    it('should not apply float to Left slot by default', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Left>Left content</HorizontalSplit.Left>
        </HorizontalSplit>,
      );
      const leftSlot = getByText('Left content').parentElement;
      expect(leftSlot?.style.float).toBe('');
    });
  });

  describe('slot props', () => {
    it('should apply width to Left slot', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Left width="60%">
            Left content
          </HorizontalSplit.Left>
        </HorizontalSplit>,
      );
      const leftSlot = getByText('Left content');
      expect(leftSlot.getAttribute('style')).toContain('width');
    });

    it('should apply width to Right slot', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Right width={400}>
            Right content
          </HorizontalSplit.Right>
        </HorizontalSplit>,
      );
      const rightSlot = getByText('Right content');
      expect(rightSlot.getAttribute('style')).toContain('width');
    });

    it('should apply height to slots', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Left height={200}>
            Left content
          </HorizontalSplit.Left>
        </HorizontalSplit>,
      );
      const leftSlot = getByText('Left content');
      expect(leftSlot.getAttribute('style')).toContain('height');
    });

    it('should apply padding to slots', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Right padding={16}>
            Right content
          </HorizontalSplit.Right>
        </HorizontalSplit>,
      );
      const rightSlot = getByText('Right content');
      expect(rightSlot.getAttribute('style')).toContain('padding');
    });

    it('should apply custom className to slots', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Left className="left-class">
            Left content
          </HorizontalSplit.Left>
        </HorizontalSplit>,
      );
      const leftSlot = getByText('Left content');
      expect(leftSlot.className).toContain('left-class');
    });

    it('should apply custom styles to slots', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Right style={{ backgroundColor: 'red' }}>
            Right content
          </HorizontalSplit.Right>
        </HorizontalSplit>,
      );
      const rightSlot = getByText('Right content');
      expect(rightSlot.getAttribute('style')).toContain('background-color');
    });

    it('should apply float prop to slots', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Left float="left">
            Left content
          </HorizontalSplit.Left>
        </HorizontalSplit>,
      );
      const leftSlot = getByText('Left content');
      expect(leftSlot.getAttribute('style')).toContain('float');
    });
  });

  describe('complex layouts', () => {
    it('should render nested content in slots', () => {
      const { getByText, getByRole } = render(
        <HorizontalSplit>
          <HorizontalSplit.Left>
            <h1>Title</h1>
            <p>Paragraph</p>
          </HorizontalSplit.Left>
          <HorizontalSplit.Right>
            <img src="/test.jpg" alt="Test image" />
          </HorizontalSplit.Right>
        </HorizontalSplit>,
      );
      expect(getByText('Title')).toBeInTheDocument();
      expect(getByText('Paragraph')).toBeInTheDocument();
      expect(getByRole('img')).toBeInTheDocument();
    });

    it('should handle multiple slots with all props', () => {
      const { getByText } = render(
        <HorizontalSplit gap={20} className="split-container">
          <HorizontalSplit.Left
            width="65%"
            padding={10}
            className="left-side">
            Left
          </HorizontalSplit.Left>
          <HorizontalSplit.Right
            width="35%"
            padding={15}
            className="right-side">
            Right
          </HorizontalSplit.Right>
        </HorizontalSplit>,
      );

      const container = getByText('Left').parentElement;
      expect(container?.getAttribute('style')).toContain('gap');
      expect(container?.className).toBeDefined();

      const leftSlot = getByText('Left');
      expect(leftSlot.getAttribute('style')).toContain('width');
      expect(leftSlot.getAttribute('style')).toContain('padding');

      const rightSlot = getByText('Right');
      expect(rightSlot.getAttribute('style')).toContain('width');
      expect(rightSlot.getAttribute('style')).toContain('padding');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined gap gracefully', () => {
      const { container } = render(<HorizontalSplit gap={undefined} />);
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ gap: '24px' }); // Falls back to default
    });

    it('should handle empty slots', () => {
      const { container } = render(
        <HorizontalSplit>
          <HorizontalSplit.Left></HorizontalSplit.Left>
          <HorizontalSplit.Right></HorizontalSplit.Right>
        </HorizontalSplit>,
      );
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should handle null children in slots', () => {
      const { container } = render(
        <HorizontalSplit>
          <HorizontalSplit.Left>{null}</HorizontalSplit.Left>
        </HorizontalSplit>,
      );
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should handle slots without children prop', () => {
      const { container } = render(
        <HorizontalSplit>
          <HorizontalSplit.Left width={200} />
        </HorizontalSplit>,
      );
      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('component composition', () => {
    it('should have displayName on Right slot', () => {
      expect(HorizontalSplit.Right.displayName).toBe('HorizontalSplit.Right');
    });

    it('should allow mixing slot and non-slot children', () => {
      const { getByText } = render(
        <HorizontalSplit>
          <HorizontalSplit.Left>Slot content</HorizontalSplit.Left>
          <div>Non-slot content</div>
        </HorizontalSplit>,
      );
      expect(getByText('Slot content')).toBeInTheDocument();
      expect(getByText('Non-slot content')).toBeInTheDocument();
    });
  });

  describe('type safety', () => {
    it('should accept valid width types', () => {
      const validWidths: Array<string | number | undefined> = [
        200,
        '50%',
        '20rem',
        undefined,
      ];

      validWidths.forEach((width) => {
        expect(() => {
          render(
            <HorizontalSplit>
              <HorizontalSplit.Left width={width}>Test</HorizontalSplit.Left>
            </HorizontalSplit>,
          );
        }).not.toThrow();
      });
    });

    it('should accept valid gap types', () => {
      const validGaps: Array<string | number | undefined> = [
        24,
        '2rem',
        '10px',
        undefined,
      ];

      validGaps.forEach((gap) => {
        expect(() => {
          render(<HorizontalSplit gap={gap} />);
        }).not.toThrow();
      });
    });
  });
});
