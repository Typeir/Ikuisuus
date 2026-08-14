/**
 * @fileoverview Skeleton Component Unit Tests
 * @description Unit tests for the skeleton loader component: renders a given
 * count, applies variant classes, width/height styles, and className.
 *
 * @module tests/unit/lib/components/skeleton/skeleton
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/lib/components/skeleton/skeleton Component under test
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonGroup, type SkeletonVariant } from '@/lib/components/skeleton/skeleton';

describe('Skeleton', () => {
  describe('rendering', () => {
    it('should render a single skeleton element by default', () => {
      render(<Skeleton />);
      const skeletons = document.querySelectorAll('[class*="skeleton"]');
      expect(skeletons.length).toBe(1);
    });

    it('should render multiple skeleton elements when count is specified', () => {
      render(<Skeleton count={3} />);
      const skeletons = document.querySelectorAll('[class*="skeleton"]');
      expect(skeletons.length).toBe(3);
    });

    it('should render exactly the specified count of elements', () => {
      render(<Skeleton count={5} />);
      const skeletons = document.querySelectorAll('[class*="skeleton"]');
      expect(skeletons.length).toBe(5);
    });
  });

  describe('variants', () => {
    const variants: SkeletonVariant[] = ['text', 'title', 'card', 'button', 'circle', 'rectangle'];

    variants.forEach((variant) => {
      it(`should apply ${variant} variant class`, () => {
        render(<Skeleton variant={variant} />);
        const skeleton = document.querySelector('[class*="skeleton"]');
        expect(skeleton).toBeTruthy();
        expect(skeleton?.className).toContain(variant);
      });
    });

    it('should use text variant by default', () => {
      render(<Skeleton />);
      const skeleton = document.querySelector('[class*="skeleton"]');
      expect(skeleton?.className).toContain('text');
    });
  });

  describe('custom dimensions', () => {
    it('should apply custom width style', () => {
      render(<Skeleton width="200px" />);
      const skeleton = document.querySelector('[class*="skeleton"]') as HTMLElement;
      expect(skeleton.style.width).toBe('200px');
    });

    it('should apply custom height style', () => {
      render(<Skeleton height="50px" />);
      const skeleton = document.querySelector('[class*="skeleton"]') as HTMLElement;
      expect(skeleton.style.height).toBe('50px');
    });

    it('should apply both width and height styles', () => {
      render(<Skeleton width="300px" height="100px" />);
      const skeleton = document.querySelector('[class*="skeleton"]') as HTMLElement;
      expect(skeleton.style.width).toBe('300px');
      expect(skeleton.style.height).toBe('100px');
    });

    it('should accept percentage width', () => {
      render(<Skeleton width="80%" />);
      const skeleton = document.querySelector('[class*="skeleton"]') as HTMLElement;
      expect(skeleton.style.width).toBe('80%');
    });

    it('should accept rem units', () => {
      render(<Skeleton height="3rem" />);
      const skeleton = document.querySelector('[class*="skeleton"]') as HTMLElement;
      expect(skeleton.style.height).toBe('3rem');
    });

    it('should not set style when dimensions are undefined', () => {
      render(<Skeleton />);
      const skeleton = document.querySelector('[class*="skeleton"]') as HTMLElement;
      expect(skeleton.style.width).toBe('');
      expect(skeleton.style.height).toBe('');
    });
  });

  describe('custom className', () => {
    it('should append custom className to element', () => {
      render(<Skeleton className="my-custom-class" />);
      const skeleton = document.querySelector('[class*="skeleton"]');
      expect(skeleton?.className).toContain('my-custom-class');
    });

    it('should preserve variant class when custom className is added', () => {
      render(<Skeleton variant="card" className="extra-styling" />);
      const skeleton = document.querySelector('[class*="skeleton"]');
      expect(skeleton?.className).toContain('card');
      expect(skeleton?.className).toContain('extra-styling');
    });

    it('should handle empty className gracefully', () => {
      render(<Skeleton className="" />);
      const skeleton = document.querySelector('[class*="skeleton"]');
      expect(skeleton).toBeTruthy();
    });
  });

  describe('combined props', () => {
    it('should apply variant, dimensions, and className together', () => {
      render(
        <Skeleton
          variant="button"
          width="150px"
          height="40px"
          className="loading-button"
        />
      );
      const skeleton = document.querySelector('[class*="skeleton"]') as HTMLElement;
      expect(skeleton.className).toContain('button');
      expect(skeleton.className).toContain('loading-button');
      expect(skeleton.style.width).toBe('150px');
      expect(skeleton.style.height).toBe('40px');
    });

    it('should render multiple skeletons with all props applied', () => {
      render(
        <Skeleton
          variant="text"
          width="100%"
          className="line-skeleton"
          count={3}
        />
      );
      const skeletons = document.querySelectorAll('[class*="skeleton"]');
      expect(skeletons.length).toBe(3);
      skeletons.forEach((skeleton) => {
        expect(skeleton.className).toContain('text');
        expect(skeleton.className).toContain('line-skeleton');
        expect((skeleton as HTMLElement).style.width).toBe('100%');
      });
    });
  });
});

describe('SkeletonGroup', () => {
  describe('rendering', () => {
    it('should render children inside group container', () => {
      render(
        <SkeletonGroup>
          <Skeleton variant="text" />
        </SkeletonGroup>
      );
      const group = document.querySelector('[class*="skeletonGroup"]');
      expect(group).toBeTruthy();
      expect(group?.querySelector('[class*="skeleton"]')).toBeTruthy();
    });

    it('should render multiple skeleton children', () => {
      render(
        <SkeletonGroup>
          <Skeleton variant="title" />
          <Skeleton variant="text" count={2} />
          <Skeleton variant="button" />
        </SkeletonGroup>
      );
      const group = document.querySelector('[class*="skeletonGroup"]');
      const skeletons = group?.querySelectorAll('[class*="skeleton"]');
      expect(skeletons?.length).toBe(4);
    });

    it('should render non-skeleton children', () => {
      render(
        <SkeletonGroup>
          <div data-testid="custom-child">Custom content</div>
        </SkeletonGroup>
      );
      expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('should apply custom className to group container', () => {
      render(
        <SkeletonGroup className="my-group-class">
          <Skeleton />
        </SkeletonGroup>
      );
      const group = document.querySelector('[class*="skeletonGroup"]');
      expect(group?.className).toContain('my-group-class');
    });

    it('should preserve default group styling with custom className', () => {
      render(
        <SkeletonGroup className="additional">
          <Skeleton />
        </SkeletonGroup>
      );
      const group = document.querySelector('[class*="skeletonGroup"]');
      expect(group?.className).toContain('skeletonGroup');
      expect(group?.className).toContain('additional');
    });

    it('should handle empty className gracefully', () => {
      render(
        <SkeletonGroup className="">
          <Skeleton />
        </SkeletonGroup>
      );
      const group = document.querySelector('[class*="skeletonGroup"]');
      expect(group).toBeTruthy();
    });
  });

  describe('complex layouts', () => {
    it('should support nested skeleton patterns for card loading', () => {
      render(
        <SkeletonGroup>
          <Skeleton variant="rectangle" width="100%" height="200px" />
          <Skeleton variant="title" width="60%" />
          <Skeleton variant="text" count={3} />
          <Skeleton variant="button" width="120px" />
        </SkeletonGroup>
      );
      const group = document.querySelector('[class*="skeletonGroup"]');
      const skeletons = group?.querySelectorAll('[class*="skeleton"]');
      expect(skeletons?.length).toBe(6);
    });

    it('should support profile loading pattern', () => {
      render(
        <SkeletonGroup className="profile-loader">
          <Skeleton variant="circle" width="80px" height="80px" />
          <Skeleton variant="title" width="200px" />
          <Skeleton variant="text" width="150px" />
        </SkeletonGroup>
      );
      const group = document.querySelector('[class*="skeletonGroup"]');
      expect(group?.className).toContain('profile-loader');
      const circle = group?.querySelector('[class*="circle"]');
      expect(circle).toBeTruthy();
    });
  });
});
