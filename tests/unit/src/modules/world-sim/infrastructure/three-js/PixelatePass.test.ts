/**
 * PixelatePass Unit Tests
 *
 * @fileoverview Tests for the Three.js post-processing pixelation pass.
 *
 * @module tests/unit/src/modules/world-sim/infrastructure/three-js/PixelatePass.test
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('three', () => {
  const Vector2Mock = vi.fn().mockImplementation(function MockVector2(
    x = 0,
    y = 0,
  ) {
    return {
      x,
      y,
      set: vi.fn(),
    };
  });

  return {
    LinearFilter: 1,
    RGBAFormat: 1,
    Vector2: Vector2Mock,
    WebGLRenderTarget: vi
      .fn()
      .mockImplementation(function MockWebGLRenderTarget() {
        return {
          texture: {},
          setSize: vi.fn(),
          dispose: vi.fn(),
        };
      }),
    ShaderMaterial: vi.fn().mockImplementation(function MockShaderMaterial(
      opts: any,
    ) {
      return {
        uniforms: opts?.uniforms ?? {},
        dispose: vi.fn(),
      };
    }),
    PlaneGeometry: vi.fn().mockImplementation(function MockPlaneGeometry() {
      return {
        dispose: vi.fn(),
      };
    }),
    Mesh: vi.fn().mockImplementation(function MockMesh(_geo: any, _mat: any) {
      return {
        name: '',
        frustumCulled: true,
      };
    }),
    Scene: vi.fn().mockImplementation(function MockScene() {
      return {
        add: vi.fn(),
        children: [{ geometry: { dispose: vi.fn() } }],
      };
    }),
    OrthographicCamera: vi
      .fn()
      .mockImplementation(function MockOrthographicCamera() {
        return {};
      }),
  };
});

vi.mock('@/modules/world-sim/shaders/pixelate.frag.glsl', () => ({
  default: 'void main() {}',
}));
vi.mock('@/modules/world-sim/shaders/pixelate.vert.glsl', () => ({
  default: 'void main() {}',
}));

import { PixelatePass } from '@/modules/world-sim/infrastructure/three-js/PixelatePass';

describe('PixelatePass', () => {
  it('should construct with width and height', () => {
    const pass = new PixelatePass(1920, 1080);
    expect(pass).toBeDefined();
  });

  it('should default to enabled', () => {
    const pass = new PixelatePass(800, 600);
    expect(pass.isEnabled()).toBe(true);
  });

  it('should toggle enabled state', () => {
    const pass = new PixelatePass(800, 600);
    pass.setEnabled(false);
    expect(pass.isEnabled()).toBe(false);
    pass.setEnabled(true);
    expect(pass.isEnabled()).toBe(true);
  });

  it('should update pixel count', () => {
    const pass = new PixelatePass(800, 600);
    pass.setPixelCount(480, 270);
    expect(pass.pixelCountX).toBe(480);
    expect(pass.pixelCountY).toBe(270);
  });

  it('should update CA strength', () => {
    const pass = new PixelatePass(800, 600);
    pass.setCAStrength(0.005);
    expect(pass.caStrength).toBe(0.005);
  });

  it('should update sharpen strength', () => {
    const pass = new PixelatePass(800, 600);
    pass.setSharpenStrength(1.2);
    expect(pass.sharpenStrength).toBe(1.2);
  });

  it('should update emboss strength', () => {
    const pass = new PixelatePass(800, 600);
    pass.setEmbossStrength(0.3);
    expect(pass.embossStrength).toBe(0.3);
  });

  it('should handle resize', () => {
    const pass = new PixelatePass(800, 600);
    pass.handleResize(1920, 1080);
    /** No error = success — internal render target was resized */
  });

  it('should render via direct renderer when disabled', () => {
    const pass = new PixelatePass(800, 600);
    pass.setEnabled(false);

    const mockRenderer = {
      setRenderTarget: vi.fn(),
      render: vi.fn(),
    } as any;
    const scene = {} as any;
    const camera = {} as any;

    pass.render(mockRenderer, scene, camera);
    expect(mockRenderer.setRenderTarget).toHaveBeenCalledWith(null);
    expect(mockRenderer.render).toHaveBeenCalledWith(scene, camera);
  });

  it('should dispose without error', () => {
    const pass = new PixelatePass(800, 600);
    expect(() => pass.dispose()).not.toThrow();
  });
});
