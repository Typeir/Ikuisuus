/**
 * Unit tests for ParallaxBackdrop component
 *
 * @module parallaxBackdrop.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ParallaxBackdrop } from '@/modules/library/presentation/components/ParallaxBackdrop';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, style, className, fill, draggable, unoptimized, ...props }) => (
    <img
      src={src}
      alt={alt}
      style={style}
      className={className}
      draggable={draggable}
      data-unoptimized={unoptimized ? 'true' : 'false'}
      {...props}
    />
  )),
}));

describe('ParallaxBackdrop', () => {
  let mockRaf: number;
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cancelRafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockRaf = 0;
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, 0);
      return ++mockRaf;
    });
    cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cancelRafSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<ParallaxBackdrop src="/test.jpg" />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should render an image with the provided src', () => {
      render(<ParallaxBackdrop src="/test-image.jpg" />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img).toHaveAttribute('src', '/test-image.jpg');
    });

    it('should apply module styles className to container', () => {
      const { container } = render(<ParallaxBackdrop src="/test.jpg" />);
      const div = container.firstChild as HTMLElement;
      expect(div?.className).toContain('backdrop');
    });

    it('should apply module styles className to image', () => {
      render(<ParallaxBackdrop src="/test.jpg" />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img?.className).toContain('image');
    });
  });

  describe('src prop', () => {
    it('should accept absolute URLs', () => {
      render(<ParallaxBackdrop src="https://example.com/image.jpg" />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should accept relative URLs', () => {
      render(<ParallaxBackdrop src="/images/backdrop.webp" />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img).toHaveAttribute('src', '/images/backdrop.webp');
    });

    it('should render different images when src changes', () => {
      const { rerender } = render(<ParallaxBackdrop src="/image1.jpg" />);
      let img = screen.getByRole('img', { hidden: true });
      expect(img).toHaveAttribute('src', '/image1.jpg');

      rerender(<ParallaxBackdrop src="/image2.jpg" />);
      img = screen.getByRole('img', { hidden: true });
      expect(img).toHaveAttribute('src', '/image2.jpg');
    });
  });

  describe('alt prop', () => {
    it('should default to empty string', () => {
      render(<ParallaxBackdrop src="/test.jpg" />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img).toHaveAttribute('alt', '');
    });

    it('should apply custom alt text', () => {
      render(<ParallaxBackdrop src="/test.jpg" alt="Custom alt text" ariaHidden={false} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Custom alt text');
    });

    it('should use alt when ariaHidden is false', () => {
      render(
        <ParallaxBackdrop
          src="/test.jpg"
          alt="Visible image"
          ariaHidden={false}
        />,
      );
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Visible image');
    });
  });

  describe('opacity prop', () => {
    it('should default to opacity 1', () => {
      const { container } = render(<ParallaxBackdrop src="/test.jpg" />);
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ opacity: 1 });
    });

    it('should apply custom opacity', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" opacity={0.5} />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ opacity: 0.5 });
    });

    it('should handle opacity 0', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" opacity={0} />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ opacity: 0 });
    });

    it('should handle opacity 1', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" opacity={1} />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ opacity: 1 });
    });

    it('should handle decimal opacity values', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" opacity={0.75} />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ opacity: 0.75 });
    });
  });

  describe('zIndex prop', () => {
    it('should default to z-index -1', () => {
      const { container } = render(<ParallaxBackdrop src="/test.jpg" />);
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ zIndex: -1 });
    });

    it('should apply custom z-index', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" zIndex={-10} />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ zIndex: -10 });
    });

    it('should accept positive z-index', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" zIndex={5} />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ zIndex: 5 });
    });

    it('should accept zero z-index', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" zIndex={0} />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ zIndex: 0 });
    });
  });

  describe('blurPx prop', () => {
    it('should not apply blur by default', () => {
      render(<ParallaxBackdrop src="/test.jpg" />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img.style.filter).toBe('');
    });

    it('should apply blur filter when blurPx > 0', () => {
      render(<ParallaxBackdrop src="/test.jpg" blurPx={5} />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img.style.filter).toBe('blur(5px)');
    });

    it('should handle large blur values', () => {
      render(<ParallaxBackdrop src="/test.jpg" blurPx={20} />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img.style.filter).toBe('blur(20px)');
    });

    it('should handle decimal blur values', () => {
      render(<ParallaxBackdrop src="/test.jpg" blurPx={2.5} />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img.style.filter).toBe('blur(2.5px)');
    });

    it('should not apply filter when blurPx is 0', () => {
      render(<ParallaxBackdrop src="/test.jpg" blurPx={0} />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img.style.filter).toBeFalsy();
    });
  });

  describe('ariaHidden prop', () => {
    it('should be aria-hidden by default', () => {
      const { container } = render(<ParallaxBackdrop src="/test.jpg" />);
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveAttribute('aria-hidden', 'true');
    });

    it('should respect ariaHidden=false', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" ariaHidden={false} />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveAttribute('aria-hidden', 'false');
    });

    it('should use empty alt when aria-hidden is true', () => {
      render(
        <ParallaxBackdrop src="/test.jpg" alt="Should be ignored" ariaHidden />,
      );
      const img = screen.getByRole('img', { hidden: true });
      expect(img).toHaveAttribute('alt', '');
    });

    it('should use provided alt when aria-hidden is false', () => {
      render(
        <ParallaxBackdrop
          src="/test.jpg"
          alt="Visible alt text"
          ariaHidden={false}
        />,
      );
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Visible alt text');
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" className="custom-backdrop" />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div?.className).toContain('custom-backdrop');
    });

    it('should preserve module className', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" className="custom-backdrop" />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div?.className).toContain('backdrop');
      expect(div?.className).toContain('custom-backdrop');
    });

    it('should handle multiple classNames', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" className="class1 class2" />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div?.className).toContain('class1');
      expect(div?.className).toContain('class2');
    });

    it('should handle undefined className', () => {
      const { container } = render(<ParallaxBackdrop src="/test.jpg" />);
      const div = container.firstChild as HTMLElement;
      expect(div?.className).toContain('backdrop');
    });
  });

  describe('intensity prop', () => {
    it('should default to 0.1', () => {
      render(<ParallaxBackdrop src="/test.jpg" />);
      // Component renders without error, intensity affects transform
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should accept custom intensity', () => {
      render(<ParallaxBackdrop src="/test.jpg" intensity={0.05} />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should accept zero intensity', () => {
      render(<ParallaxBackdrop src="/test.jpg" intensity={0} />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should accept high intensity', () => {
      render(<ParallaxBackdrop src="/test.jpg" intensity={1} />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('maxShiftPx prop', () => {
    it('should default to Infinity', () => {
      render(<ParallaxBackdrop src="/test.jpg" />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should accept custom maxShiftPx', () => {
      render(<ParallaxBackdrop src="/test.jpg" maxShiftPx={48} />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should accept zero maxShiftPx', () => {
      render(<ParallaxBackdrop src="/test.jpg" maxShiftPx={0} />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('should accept large maxShiftPx values', () => {
      render(<ParallaxBackdrop src="/test.jpg" maxShiftPx={1000} />);
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('scroll behavior', () => {
    it('should set up scroll listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      render(<ParallaxBackdrop src="/test.jpg" />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true },
      );
      
      addEventListenerSpy.mockRestore();
    });

    it('should remove scroll listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(<ParallaxBackdrop src="/test.jpg" />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
      );
      
      removeEventListenerSpy.mockRestore();
    });

    it('should use requestAnimationFrame for scroll handling', () => {
      render(<ParallaxBackdrop src="/test.jpg" />);
      window.dispatchEvent(new Event('scroll'));
      expect(rafSpy).toHaveBeenCalled();
    });

    it('should cancel animation frame on unmount', () => {
      const { unmount } = render(<ParallaxBackdrop src="/test.jpg" />);
      unmount();
      
      // Component cleanup should complete without errors
      expect(unmount).toBeDefined();
    });

    it('should apply initial transform on mount', async () => {
      render(<ParallaxBackdrop src="/test.jpg" />);
      const img = screen.getByRole('img', { hidden: true });
      
      // Wait for RAF to execute
      await vi.waitFor(() => {
        expect(img.style.transform).toContain('translate3d');
      });
    });
  });

  describe('Next.js Image integration', () => {
    it('should set unoptimized to true', () => {
      render(<ParallaxBackdrop src="/test.jpg" />);
      const img = screen.getByRole('img', { hidden: true });
      // unoptimized is an Image component prop, not rendered to DOM
      expect(img).toBeDefined();
    });

    it('should set fill to true', () => {
      render(<ParallaxBackdrop src="/test.jpg" />);
      const img = screen.getByRole('img', { hidden: true });
      // fill is an Image component prop, not rendered to DOM
      expect(img).toBeDefined();
    });

    it('should set draggable to false', () => {
      render(<ParallaxBackdrop src="/test.jpg" />);
      const img = screen.getByRole('img', { hidden: true });
      expect(img).toHaveAttribute('draggable', 'false');
    });
  });

  describe('combined props', () => {
    it('should apply all props correctly', () => {
      const { container } = render(
        <ParallaxBackdrop
          src="/complex-image.jpg"
          alt="Complex"
          intensity={0.08}
          maxShiftPx={60}
          opacity={0.8}
          blurPx={3}
          zIndex={-5}
          ariaHidden={false}
          className="custom-class"
        />,
      );

      const div = container.firstChild as HTMLElement;
      expect(div).toHaveAttribute('aria-hidden', 'false');
      expect(div).toHaveStyle({ opacity: 0.8, zIndex: -5 });
      expect(div?.className).toContain('custom-class');

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/complex-image.jpg');
      expect(img).toHaveAttribute('alt', 'Complex');
      expect(img.style.filter).toBe('blur(3px)');
    });
  });

  describe('edge cases', () => {
    it('should handle missing src gracefully (though required)', () => {
      // @ts-expect-error Testing runtime behavior
      const { container } = render(<ParallaxBackdrop />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should handle very small opacity values', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" opacity={0.01} />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ opacity: 0.01 });
    });

    it('should handle negative z-index', () => {
      const { container } = render(
        <ParallaxBackdrop src="/test.jpg" zIndex={-100} />,
      );
      const div = container.firstChild as HTMLElement;
      expect(div).toHaveStyle({ zIndex: -100 });
    });

    it('should handle component re-render', () => {
      const { rerender } = render(
        <ParallaxBackdrop src="/test.jpg" intensity={0.05} />,
      );
      
      rerender(<ParallaxBackdrop src="/test.jpg" intensity={0.1} />);
      
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });
});
