/**
 * Unit tests for FloatedContainer component
 *
 * @module floatedContainer.test
 */

import { FloatedContainer } from '@/modules/library/presentation/components/FloatedContainer';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('FloatedContainer', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<FloatedContainer />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should render children', () => {
      const { getByText } = render(
        <FloatedContainer>
          <p>Test content</p>
        </FloatedContainer>,
      );
      expect(getByText('Test content')).toBeInTheDocument();
    });

    it('should apply module styles className', () => {
      const { container } = render(<FloatedContainer />);
      const div = container.querySelector('div');
      expect(div?.className).toContain('floated');
    });
  });

  describe('side prop', () => {
    it('should float right by default', () => {
      const { container } = render(<FloatedContainer />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ float: 'right' });
    });

    it('should float left when side is "left"', () => {
      const { container } = render(<FloatedContainer side='left' />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ float: 'left' });
    });

    it('should float right when side is "right"', () => {
      const { container } = render(<FloatedContainer side='right' />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ float: 'right' });
    });
  });

  describe('width prop', () => {
    it('should have default width of 40%', () => {
      const { container } = render(<FloatedContainer />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ width: '40%' });
    });

    it('should apply numeric width as px', () => {
      const { container } = render(<FloatedContainer width={300} />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ width: '300px' });
    });

    it('should apply string width as-is', () => {
      const { container } = render(<FloatedContainer width='50%' />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ width: '50%' });
    });

    it('should handle rem values', () => {
      const { container } = render(<FloatedContainer width='20rem' />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ width: '20rem' });
    });

    it('should handle zero width', () => {
      const { container } = render(<FloatedContainer width={0} />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ width: '0px' });
    });
  });

  describe('margin prop', () => {
    it('should have default margin of 24px', () => {
      const { container } = render(<FloatedContainer />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ marginBottom: '24px' });
    });

    it('should apply marginLeft when floated right', () => {
      const { container } = render(
        <FloatedContainer side='right' margin={16} />,
      );
      const div = container.querySelector('div');
      expect(div).toHaveStyle({
        marginLeft: '16px',
        marginBottom: '16px',
      });
      expect(div?.style.marginRight).toBe('');
    });

    it('should apply marginRight when floated left', () => {
      const { container } = render(
        <FloatedContainer side='left' margin={16} />,
      );
      const div = container.querySelector('div');
      expect(div).toHaveStyle({
        marginRight: '16px',
        marginBottom: '16px',
      });
      expect(div?.style.marginLeft).toBe('');
    });

    it('should apply string margin values', () => {
      const { container } = render(<FloatedContainer margin='2rem' />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({
        marginLeft: '2rem',
        marginBottom: '2rem',
      });
    });

    it('should handle zero margin', () => {
      const { container } = render(<FloatedContainer margin={0} />);
      const div = container.querySelector('div');
      expect(div).toHaveStyle({
        marginBottom: '0px',
      });
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <FloatedContainer className='custom-float' />,
      );
      const div = container.querySelector('div');
      expect(div?.className).toContain('custom-float');
    });

    it('should preserve module className', () => {
      const { container } = render(
        <FloatedContainer className='custom-float' />,
      );
      const div = container.querySelector('div');
      expect(div?.className).toContain('floated');
      expect(div?.className).toContain('custom-float');
    });

    it('should handle multiple classNames', () => {
      const { container } = render(
        <FloatedContainer className='class1 class2' />,
      );
      const div = container.querySelector('div');
      expect(div?.className).toContain('class1');
      expect(div?.className).toContain('class2');
    });
  });

  describe('style prop', () => {
    it('should apply custom inline styles', () => {
      const { container } = render(
        <FloatedContainer
          style={{ backgroundColor: 'blue', padding: '20px' }}
        />,
      );
      const div = container.querySelector('div');
      expect(div?.getAttribute('style')).toContain('background-color');
      expect(div?.getAttribute('style')).toContain('padding');
    });

    it('should merge custom styles with component styles', () => {
      const { container } = render(
        <FloatedContainer
          side='left'
          width={200}
          margin={10}
          style={{ border: '1px solid red' }}
        />,
      );
      const div = container.querySelector('div');
      const style = div?.getAttribute('style') || '';
      expect(style).toContain('float');
      expect(style).toContain('width');
      expect(style).toContain('border');
    });

    it('should allow custom styles to override component styles', () => {
      const { container } = render(
        <FloatedContainer width={100} style={{ width: '50%' }} />,
      );
      const div = container.querySelector('div');
      expect(div).toHaveStyle({ width: '50%' });
    });
  });

  describe('children rendering', () => {
    it('should render text children', () => {
      const { getByText } = render(
        <FloatedContainer>Simple text</FloatedContainer>,
      );
      expect(getByText('Simple text')).toBeInTheDocument();
    });

    it('should render React element children', () => {
      const { getByRole } = render(
        <FloatedContainer>
          <img src='/test.jpg' alt='Test' />
        </FloatedContainer>,
      );
      expect(getByRole('img')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      const { getByText, getByRole } = render(
        <FloatedContainer>
          <h3>Title</h3>
          <p>Content</p>
          <img src='/test.jpg' alt='Test' />
        </FloatedContainer>,
      );
      expect(getByText('Title')).toBeInTheDocument();
      expect(getByText('Content')).toBeInTheDocument();
      expect(getByRole('img')).toBeInTheDocument();
    });

    it('should render without children', () => {
      const { container } = render(<FloatedContainer />);
      const div = container.querySelector('div');
      expect(div).toBeInTheDocument();
    });
  });

  describe('combined props', () => {
    it('should apply all props together correctly', () => {
      const { container, getByText } = render(
        <FloatedContainer
          side='left'
          width='30%'
          margin='16px'
          className='my-container'
          style={{ padding: '10px' }}>
          <p>Test</p>
        </FloatedContainer>,
      );
      const div = container.querySelector('div');
      expect(div).toHaveStyle({
        float: 'left',
        width: '30%',
        marginRight: '16px',
        marginBottom: '16px',
        padding: '10px',
      });
      expect(div?.className).toContain('my-container');
      expect(getByText('Test')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined props gracefully', () => {
      const { container } = render(
        <FloatedContainer
          side={undefined}
          width={undefined}
          margin={undefined}
          className={undefined}
          style={undefined}
        />,
      );
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should handle empty string className', () => {
      const { container } = render(<FloatedContainer className='' />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should handle empty style object', () => {
      const { container } = render(<FloatedContainer style={{}} />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should handle null children gracefully', () => {
      const { container } = render(<FloatedContainer>{null}</FloatedContainer>);
      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('layout behavior', () => {
    it('should apply correct margins for right float', () => {
      const { container } = render(
        <FloatedContainer side='right' margin={20} />,
      );
      const div = container.querySelector('div');
      expect(div).toHaveStyle({
        float: 'right',
        marginLeft: '20px',
        marginBottom: '20px',
      });
    });

    it('should apply correct margins for left float', () => {
      const { container } = render(
        <FloatedContainer side='left' margin={20} />,
      );
      const div = container.querySelector('div');
      expect(div).toHaveStyle({
        float: 'left',
        marginRight: '20px',
        marginBottom: '20px',
      });
    });

    it('should always apply marginBottom regardless of side', () => {
      const { container: rightContainer } = render(
        <FloatedContainer side='right' margin={15} />,
      );
      const { container: leftContainer } = render(
        <FloatedContainer side='left' margin={15} />,
      );

      expect(rightContainer.querySelector('div')).toHaveStyle({
        marginBottom: '15px',
      });
      expect(leftContainer.querySelector('div')).toHaveStyle({
        marginBottom: '15px',
      });
    });
  });
});
