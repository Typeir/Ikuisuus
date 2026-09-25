/**
 * @fileoverview ParallaxBackdrop tests.
 *
 * @module tests/unit/src/modules/library/presentation/components/ParallaxBackdrop/parallaxBackdrop.test
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { act, cleanup, render, screen } from '@testing-library/react';
import type { ComponentProps, ComponentPropsWithRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { imageProps, stop, watchViewport } = vi.hoisted(() => ({
  imageProps: vi.fn(),
  stop: vi.fn(),
  watchViewport: vi.fn(),
}));

vi.mock('@/lib/utils/motion', async (real) => ({
  ...(await real<typeof import('@/lib/utils/motion')>()),
  watchViewport,
}));

type ImageMockProps = ComponentPropsWithRef<'img'> & {
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
};

vi.mock('next/image', () => ({
  default: (props: ImageMockProps) => {
    const { ref, src, alt, className, draggable, ...rest } = props;
    imageProps(rest);
    return (
      <img
        ref={ref}
        src={src as string}
        alt={alt}
        className={className}
        draggable={draggable}
      />
    );
  },
}));

const { ParallaxBackdrop } = await import(
  '@/modules/library/presentation/components/ParallaxBackdrop'
);

const SCREEN = 1000;

/**
 * Runs the watcher the component registered.
 *
 * @returns {void} Nothing.
 */
const tick = (): void => {
  const run = watchViewport.mock.calls.at(-1)?.[0] as () => void;
  act(() => run());
};

/**
 * Renders the backdrop and returns its image.
 *
 * @param {Partial<ComponentProps<typeof ParallaxBackdrop>>} props - Overrides.
 * @returns {HTMLElement} The image element.
 */
const mount = (
  props: Partial<ComponentProps<typeof ParallaxBackdrop>> = {},
): HTMLElement => {
  render(<ParallaxBackdrop src='/library/images/fog.webp' {...props} />);
  return screen.getByRole('img', { hidden: true });
};

beforeEach(() => {
  stop.mockClear();
  watchViewport.mockClear();
  imageProps.mockClear();
  watchViewport.mockReturnValue(stop);
  vi.stubGlobal('innerHeight', SCREEN);
  vi.stubGlobal('scrollY', 0);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ParallaxBackdrop image', () => {
  it('should hide the image and blank its alt by default', () => {
    const img = mount({ alt: 'Fog' });
    expect(img.getAttribute('alt')).toBe('');
    expect(img.parentElement?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should expose the alt when not hidden', () => {
    const img = mount({ alt: 'Fog', ariaHidden: false });
    expect(img.getAttribute('alt')).toBe('Fog');
    expect(img.parentElement?.getAttribute('aria-hidden')).toBe('false');
  });

  it('should ask for the image at low priority and viewport width', () => {
    mount();
    const props = imageProps.mock.calls.at(-1)?.[0];
    expect(props).toMatchObject({
      fill: true,
      sizes: '100vw',
      fetchPriority: 'low',
    });
    expect(props).not.toHaveProperty('priority');
    expect(props).not.toHaveProperty('unoptimized');
  });

  it('should hand opacity and z-index to the stylesheet', () => {
    const img = mount({ opacity: 0.15, zIndex: -5 });
    const div = img.parentElement as HTMLElement;
    expect(div.style.getPropertyValue('--backdrop-opacity')).toBe('0.15');
    expect(div.style.zIndex).toBe('-5');
    expect(div.style.filter).toBe('');
    expect(img.style.filter).toBe('');
  });
});

describe('ParallaxBackdrop scroll', () => {
  it('should start one watcher and stop it on unmount', () => {
    const { unmount } = render(<ParallaxBackdrop src='/x.webp' />);
    expect(watchViewport).toHaveBeenCalledTimes(1);
    unmount();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('should shift the image up by intensity times scroll', () => {
    const img = mount({ intensity: 0.1 });
    vi.stubGlobal('scrollY', 200);
    tick();
    expect(img.style.transform).toBe('translate3d(0, -20px, 0) scale(1.06)');
  });

  it('should clamp the shift to the overscan by default', () => {
    const img = mount({ intensity: 0.1 });
    vi.stubGlobal('scrollY', 5000);
    tick();
    expect(img.style.transform).toBe('translate3d(0, -30px, 0) scale(1.06)');
  });

  it('should honour an explicit clamp', () => {
    const img = mount({ intensity: 0.1, maxShiftPx: 12 });
    vi.stubGlobal('scrollY', 5000);
    tick();
    expect(img.style.transform).toBe('translate3d(0, -12px, 0) scale(1.06)');
  });

  it('should skip the write when nothing moved', () => {
    const img = mount();
    vi.stubGlobal('scrollY', 100);
    tick();
    img.style.transform = 'none';
    tick();
    expect(img.style.transform).toBe('none');
  });
});
