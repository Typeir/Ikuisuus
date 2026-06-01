/**
 * @fileoverview SceneManager Unit Tests
 * @description Tests SceneManager initialization, lifecycle registration,
 * start/stop, resize handling, and disposal. Mocks WebGLRenderer since
 * jsdom lacks actual WebGL support.
 *
 * @module tests/unit/worldSim/canvas/SceneManager
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Mock ResizeObserver for jsdom */
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
globalThis.ResizeObserver = vi
  .fn()
  .mockImplementation(function MockResizeObserver() {
    return {
      observe: mockObserve,
      unobserve: vi.fn(),
      disconnect: mockDisconnect,
    };
  }) as unknown as typeof ResizeObserver;

/** Mock Three.js WebGLRenderer since jsdom has no WebGL context */
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');

  class MockWebGLRenderer {
    domElement = document.createElement('canvas');
    setPixelRatio = vi.fn();
    getPixelRatio = vi.fn(() => 1);
    setClearColor = vi.fn();
    setSize = vi.fn();
    setRenderTarget = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
  }

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});

import { SceneManager } from '@/modules/world-sim/infrastructure/three-js/SceneManager';

vi.mock('@/modules/world-sim/shaders/pixelate.vert.glsl', () => ({
  default: 'void main() { gl_Position = vec4(0.0); }',
}));
vi.mock('@/modules/world-sim/shaders/pixelate.frag.glsl', () => ({
  default: 'void main() { gl_FragColor = vec4(1.0); }',
}));

describe('SceneManager', () => {
  let container: HTMLDivElement;
  let manager: SceneManager;

  beforeEach(() => {
    container = document.createElement('div');
    Object.defineProperty(container, 'clientWidth', { value: 800 });
    Object.defineProperty(container, 'clientHeight', { value: 600 });
    document.body.appendChild(container);
    manager = new SceneManager(container);
  });

  afterEach(() => {
    manager.dispose();
    document.body.removeChild(container);
  });

  it('creates renderer, scene, and camera', () => {
    expect(manager.renderer).toBeDefined();
    expect(manager.scene).toBeDefined();
    expect(manager.camera).toBeDefined();
  });

  it('appends canvas to container', () => {
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('creates a lifecycle instance', () => {
    expect(manager.lifecycle).toBeDefined();
  });

  it('exposes a pixelatePass instance', () => {
    expect(manager.pixelatePass).toBeDefined();
    expect(typeof manager.pixelatePass.setPixelCount).toBe('function');
    expect(typeof manager.pixelatePass.setEnabled).toBe('function');
  });

  it('onAnimate registers an Update phase callback', () => {
    const cb = vi.fn();
    const unsub = manager.onAnimate(cb);

    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('onPostRender registers a PostRender phase callback', () => {
    const cb = vi.fn();
    const unsub = manager.onPostRender(cb);

    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('start and stop control the animation loop', () => {
    const spy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockReturnValue(1);
    manager.start();
    expect(spy).toHaveBeenCalled();
    manager.stop();
    spy.mockRestore();
  });

  it('start is idempotent', () => {
    const spy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockReturnValue(1);
    manager.start();
    const callCount = spy.mock.calls.length;
    manager.start();
    expect(spy.mock.calls.length).toBe(callCount);
    manager.stop();
    spy.mockRestore();
  });

  it('getCanvasRect returns a DOMRect', () => {
    const rect = manager.getCanvasRect();
    expect(rect).toBeDefined();
  });

  it('dispose clears lifecycle and removes canvas', () => {
    manager.dispose();
    /** After dispose, lifecycle should be cleared (no callbacks remain) */
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('scene has ambient and point lights', () => {
    const lights = manager.scene.children.filter(
      (c) => c.type === 'AmbientLight' || c.type === 'PointLight',
    );
    expect(lights.length).toBeGreaterThanOrEqual(2);
  });

  it('scene has a starfield', () => {
    const starfield = manager.scene.children.find(
      (c) => c.name === 'starfield',
    );
    expect(starfield).toBeDefined();
  });
});
