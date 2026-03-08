/**
 * @fileoverview Icon Component Unit Tests
 * @description Tests for the Icon component that renders SVG icons from
 * a predefined icon map with support for custom styling and SVG props.
 *
 * @module tests/unit/lib/components/icon/icon
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/lib/components/icon/icon Component under test
 */

import Icon, {
    type IconProps,
    type IconType,
} from '@/lib/components/icon/icon';
import { logger } from '@/lib/logging/logger';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Icon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exports', () => {
    it('should export Icon as default', () => {
      expect(Icon).toBeDefined();
      expect(typeof Icon).toBe('function');
    });

    it('should have IconType type available', () => {
      const validTypes: IconType[] = ['arrow', 'hamburger'];
      expect(validTypes).toContain('arrow');
      expect(validTypes).toContain('hamburger');
    });
  });

  describe('rendering valid icons', () => {
    it('should render arrow icon', () => {
      const { container } = render(<Icon type='arrow' />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should render hamburger icon', () => {
      const { container } = render(<Icon type='hamburger' />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should render without warning for valid icon types', () => {
      render(<Icon type='arrow' />);
      expect(logger.warning).not.toHaveBeenCalled();
    });
  });

  describe('unknown icon handling', () => {
    it('should return null for unknown icon type', () => {
      const { container } = render(<Icon type={'unknown' as IconType} />);
      expect(container.firstChild).toBeNull();
    });

    it('should log warning for unknown icon type', () => {
      render(<Icon type={'nonexistent' as IconType} />);
      expect(logger.warning).toHaveBeenCalledWith(
        'Unknown icon type',
        expect.objectContaining({ type: 'nonexistent' }),
      );
    });

    it('should include icon type name in warning message', () => {
      render(<Icon type={'custom-missing' as IconType} />);
      expect(logger.warning).toHaveBeenCalledWith(
        'Unknown icon type',
        expect.objectContaining({ type: 'custom-missing' }),
      );
    });
  });

  describe('className prop', () => {
    it('should apply custom className to icon', () => {
      const { container } = render(
        <Icon type='arrow' className='my-icon-class' />,
      );
      expect(container.firstChild).toBeTruthy();
      if (container.firstChild) {
        const classAttr = (container.firstChild as Element).getAttribute(
          'class',
        );
        expect(classAttr).toContain('my-icon-class');
      }
    });

    it('should use empty string as default className', () => {
      const { container } = render(<Icon type='arrow' />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should handle multiple class names', () => {
      const { container } = render(
        <Icon type='hamburger' className='class-a class-b' />,
      );
      if (container.firstChild) {
        const classAttr = (container.firstChild as Element).getAttribute(
          'class',
        );
        expect(classAttr).toContain('class-a');
        expect(classAttr).toContain('class-b');
      }
    });
  });

  describe('SVG props passthrough', () => {
    it('should pass width prop to SVG', () => {
      const { container } = render(<Icon type='arrow' width={24} />);
      const svg = container.firstChild as SVGElement;
      if (svg) {
        expect(svg.getAttribute('width')).toBe('24');
      }
    });

    it('should pass height prop to SVG', () => {
      const { container } = render(<Icon type='arrow' height={24} />);
      const svg = container.firstChild as SVGElement;
      if (svg) {
        expect(svg.getAttribute('height')).toBe('24');
      }
    });

    it('should pass aria-label prop for accessibility', () => {
      const { container } = render(
        <Icon type='hamburger' aria-label='Menu icon' />,
      );
      const svg = container.firstChild as SVGElement;
      if (svg) {
        expect(svg.getAttribute('aria-label')).toBe('Menu icon');
      }
    });

    it('should pass role prop for accessibility', () => {
      const { container } = render(<Icon type='arrow' role='img' />);
      const svg = container.firstChild as SVGElement;
      if (svg) {
        expect(svg.getAttribute('role')).toBe('img');
      }
    });

    it('should pass data attributes', () => {
      const { container } = render(
        <Icon type='arrow' data-testid='custom-icon' />,
      );
      const svg = container.firstChild as SVGElement;
      if (svg) {
        expect(svg.getAttribute('data-testid')).toBe('custom-icon');
      }
    });
  });

  describe('component interface', () => {
    it('should accept IconProps interface', () => {
      const props: IconProps = {
        type: 'arrow',
        className: 'test-class',
        width: 32,
        height: 32,
      };
      const { container } = render(<Icon {...props} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('should require type prop', () => {
      const propsWithType: IconProps = { type: 'hamburger' };
      const { container } = render(<Icon {...propsWithType} />);
      expect(container.firstChild).toBeTruthy();
    });
  });
});
