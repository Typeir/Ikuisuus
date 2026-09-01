/**
 * @fileoverview CelestialGlow Unit Tests
 * @description Tests createRadialGradientTexture and createCelestialGlow.
 * Mocks canvas 2D context.
 *
 * @module tests/unit/src/modules/world-sim/infrastructure/effects/CelestialGlow.test
 */

import {
    createCelestialGlow,
    createRadialGradientTexture,
    type GradientStop,
} from '@/modules/world-sim/infrastructure/effects/CelestialGlow';
import { Color, Sprite } from 'three';
import { describe, expect, it, vi } from 'vitest';

/** Mock canvas context for gradient creation */
const mockGradient = {
  addColorStop: vi.fn(),
};

const originalCreateElement = document.createElement.bind(document);
document.createElement = ((tag: string, ...args: unknown[]) => {
  if (tag === 'canvas') {
    const canvas = originalCreateElement('canvas');
    (canvas as any).getContext = () => ({
      createRadialGradient: () => mockGradient,
      fillRect: vi.fn(),
      set fillStyle(_v: any) {},
    });
    return canvas;
  }
  return originalCreateElement(tag, ...(args as [any]));
}) as typeof document.createElement;

describe('createRadialGradientTexture', () => {
  it('returns a texture from gradient stops', () => {
    const stops: GradientStop[] = [
      { offset: 0, color: 'rgba(255,255,255,1)' },
      { offset: 1, color: 'rgba(255,255,255,0)' },
    ];
    const texture = createRadialGradientTexture(128, stops);
    expect(texture).toBeDefined();
    expect(texture.image).toBeDefined();
  });

  it('calls addColorStop for each gradient stop', () => {
    mockGradient.addColorStop.mockClear();
    const stops: GradientStop[] = [
      { offset: 0, color: 'white' },
      { offset: 0.5, color: 'gray' },
      { offset: 1, color: 'black' },
    ];
    createRadialGradientTexture(64, stops);
    expect(mockGradient.addColorStop).toHaveBeenCalledTimes(3);
  });

  it('sets canvas dimensions to the requested size', () => {
    const texture = createRadialGradientTexture(256, [
      { offset: 0, color: 'white' },
      { offset: 1, color: 'black' },
    ]);
    const canvas = texture.image as HTMLCanvasElement;
    expect(canvas.width).toBe(256);
    expect(canvas.height).toBe(256);
  });

  it('reuses cached texture for identical size and stops', () => {
    mockGradient.addColorStop.mockClear();

    const stops: GradientStop[] = [
      { offset: 0, color: 'rgba(17, 23, 31, 1)' },
      { offset: 1, color: 'rgba(17, 23, 31, 0)' },
    ];

    const tex1 = createRadialGradientTexture(96, stops);
    const tex2 = createRadialGradientTexture(96, stops);

    expect(tex1).toBe(tex2);
    expect(mockGradient.addColorStop).toHaveBeenCalledTimes(2);
  });

  it('creates distinct textures when cache key differs', () => {
    const stops: GradientStop[] = [
      { offset: 0, color: 'rgba(9, 9, 9, 1)' },
      { offset: 1, color: 'rgba(9, 9, 9, 0)' },
    ];

    const texA = createRadialGradientTexture(80, stops);
    const texB = createRadialGradientTexture(120, stops);

    expect(texA).not.toBe(texB);
  });
});

describe('createCelestialGlow', () => {
  it('returns a Sprite instance', () => {
    const glow = createCelestialGlow(10, '#ff0000');
    expect(glow).toBeInstanceOf(Sprite);
  });

  it('sets sprite name to celestial-glow', () => {
    const glow = createCelestialGlow(10, '#ff0000');
    expect(glow.name).toBe('celestial-glow');
  });

  it('scales sprite based on radius and scale factor', () => {
    const glow = createCelestialGlow(10, '#ff0000', 4.0);
    expect(glow.scale.x).toBeCloseTo(40);
    expect(glow.scale.y).toBeCloseTo(40);
  });

  it('uses default scale and opacity', () => {
    const glow = createCelestialGlow(5, new Color('#0000ff'));
    /** Default scale is 3.0 → 5 * 3 = 15 */
    expect(glow.scale.x).toBeCloseTo(15);
  });

  it('accepts Color instance', () => {
    const glow = createCelestialGlow(10, new Color(0xff0000));
    expect(glow).toBeInstanceOf(Sprite);
  });
});
