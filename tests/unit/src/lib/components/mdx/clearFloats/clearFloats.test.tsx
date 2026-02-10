/**
 * Unit tests for ClearFloats component
 *
 * @module clearFloats.test
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ClearFloats } from '@/lib/components/mdx/clearFloats/clearFloats';

describe('ClearFloats', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<ClearFloats />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should render with default side "both"', () => {
      const { container } = render(<ClearFloats />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ clear: 'both' });
    });

    it('should apply className from module styles', () => {
      const { container } = render(<ClearFloats />);
      const div = container.querySelector('div');
      expect(div?.className).toContain('clear');
    });
  });

  describe('side prop', () => {
    it('should clear left when side is "left"', () => {
      const { container } = render(<ClearFloats side="left" />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ clear: 'left' });
    });

    it('should clear right when side is "right"', () => {
      const { container } = render(<ClearFloats side="right" />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ clear: 'right' });
    });

    it('should clear both when side is "both"', () => {
      const { container } = render(<ClearFloats side="both" />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ clear: 'both' });
    });

    it('should clear none when side is "none"', () => {
      const { container } = render(<ClearFloats side="none" />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ clear: 'none' });
    });
  });

  describe('height prop', () => {
    it('should apply numeric height as px', () => {
      const { container } = render(<ClearFloats height={20} />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ height: '20px' });
    });

    it('should apply string height as-is', () => {
      const { container } = render(<ClearFloats height="2rem" />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ height: '2rem' });
    });

    it('should apply percentage height', () => {
      const { container } = render(<ClearFloats height="50%" />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ height: '50%' });
    });

    it('should not apply height when undefined', () => {
      const { container } = render(<ClearFloats />);
      const div = container.querySelector('div');
      expect(div?.style.height).toBe('');
    });

    it('should handle zero height', () => {
      const { container } = render(<ClearFloats height={0} />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ height: '0px' });
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(<ClearFloats className="custom-class" />);
      const div = container.querySelector('div');
      expect(div?.className).toContain('custom-class');
    });

    it('should preserve module className when custom className is added', () => {
      const { container } = render(<ClearFloats className="custom-class" />);
      const div = container.querySelector('div');
      expect(div?.className).toContain('clear');
      expect(div?.className).toContain('custom-class');
    });

    it('should handle multiple custom classNames', () => {
      const { container } = render(
        <ClearFloats className="class1 class2 class3" />,
      );
      const div = container.querySelector('div');
      expect(div?.className).toContain('class1');
      expect(div?.className).toContain('class2');
      expect(div?.className).toContain('class3');
    });
  });

  describe('style prop', () => {
    it('should apply custom inline styles', () => {
      const { container } = render(
        <ClearFloats style={{ backgroundColor: 'red', padding: '10px' }} />,
      );
      const div = container.querySelector('div');
      expect(div).toHaveStyle('clear: both');
      expect(div?.getAttribute('style')).toContain('background-color');
    });

    it('should merge custom styles with component styles', () => {
      const { container } = render(
        <ClearFloats side="left" height={20} style={{ margin: '5px' }} />,
      );
      const div = container.querySelector('div');
      expect(div).toHaveStyle({
        clear: 'left',
        height: '20px',
        margin: '5px',
      });
    });

    it('should allow custom styles to override component styles', () => {
      const { container } = render(
        <ClearFloats height={20} style={{ height: '50px' }} />,
      );
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ height: '50px' });
    });
  });

  describe('combined props', () => {
    it('should apply all props together', () => {
      const { container } = render(
        <ClearFloats
          side="right"
          height={30}
          className="my-clear"
          style={{ marginTop: '10px' }}
        />,
      );
      const div = container.querySelector('div');
      expect(div).toHaveStyle({
        clear: 'right',
        height: '30px',
        marginTop: '10px',
      });
      expect(div?.className).toContain('my-clear');
      expect(div?.className).toContain('clear');
    });
  });

  describe('accessibility', () => {
    it('should render a div element', () => {
      const { container } = render(<ClearFloats />);
      expect(container.querySelector('div')).toBeTruthy();
    });

    it('should not have any content', () => {
      const { container } = render(<ClearFloats />);
      const div = container.querySelector('div');
      expect(div?.textContent).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined props gracefully', () => {
      const { container } = render(
        <ClearFloats
          side={undefined}
          height={undefined}
          className={undefined}
          style={undefined}
        />,
      );
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should handle empty string className', () => {
      const { container } = render(<ClearFloats className="" />);
      const div = container.querySelector('div');
      expect(div).toBeInTheDocument();
    });

    it('should handle empty style object', () => {
      const { container } = render(<ClearFloats style={{}} />);
      const div = container.querySelector('div');
      expect(div).toBeInTheDocument();
    });
  });
});
