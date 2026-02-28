/**
 * @fileoverview Scene Manager — Three.js Lifecycle Owner
 * @description Creates and manages the Three.js renderer, scene, camera, lights,
 * and animation loop. Delegates frame-phase dispatch to RenderLifecycle so
 * subsystems can subscribe to typed phases (PreUpdate → PostRender) with
 * priority ordering and full pipeline access.
 *
 * @module worldSim/canvas/SceneManager
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  AmbientLight,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
} from 'three';
import { DEFAULT_CAMERA_LOOK_AT, DEFAULT_CAMERA_POSITION } from '../constants';
import {
  RenderLifecycle,
  RenderPhase,
  type FrameContext,
  type LifecycleCallback,
} from './RenderLifecycle';

/** @constant {number} STARFIELD_COUNT - Number of background starfield particles */
const STARFIELD_COUNT = 2000;

/** @constant {number} STARFIELD_SPREAD - Spread radius for starfield particles */
const STARFIELD_SPREAD = 12000;

/**
 * Manages the Three.js rendering lifecycle.
 * Creates renderer, scene, camera, base lighting, and starfield background.
 * Runs the animation loop, delegates phase dispatch to RenderLifecycle,
 * and handles resize events.
 *
 * @class SceneManager
 *
 * @example
 * ```ts
 * const manager = new SceneManager(canvasElement);
 * manager.lifecycle.on(RenderPhase.Update, (ctx) => {
 *   updateOrbits(ctx.time, ctx.deltaTime);
 * }, { priority: 10, label: 'orbits' });
 * manager.lifecycle.on(RenderPhase.PostRender, (ctx) => {
 *   projectLabels(ctx.camera, ctx.canvas);
 * }, { label: 'labels' });
 * manager.start();
 * manager.dispose();
 * ```
 */
export class SceneManager {
  /** @property {WebGLRenderer} renderer - The WebGL renderer */
  public readonly renderer: WebGLRenderer;

  /** @property {Scene} scene - The Three.js scene graph root */
  public readonly scene: Scene;

  /** @property {PerspectiveCamera} camera - The perspective camera */
  public readonly camera: PerspectiveCamera;

  /** @property {RenderLifecycle} lifecycle - Phase-based frame event system */
  public readonly lifecycle: RenderLifecycle;

  /** @property {HTMLElement} container - The DOM element hosting the canvas */
  private container: HTMLElement;

  /** @property {number | null} animationFrameId - Current rAF handle */
  private animationFrameId: number | null = null;

  /** @property {number} lastTime - Timestamp of the last frame (seconds) */
  private lastTime: number = 0;

  /** @property {number} frameCount - Monotonic frame counter */
  private frameCount: number = 0;

  /** @property {boolean} isRunning - Whether the animation loop is active */
  private isRunning: boolean = false;

  /** @property {ResizeObserver} resizeObserver - Watches container size changes */
  private resizeObserver: ResizeObserver;

  /**
   * Create a new SceneManager and attach to a DOM element.
   *
   * @param {HTMLElement} container - DOM element that will hold the WebGL canvas
   */
  constructor(container: HTMLElement) {
    this.container = container;
    this.lifecycle = new RenderLifecycle();

    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(new Color('#050508'), 1);

    this.scene = new Scene();

    const { width, height } = this.getContainerSize();
    this.camera = new PerspectiveCamera(60, width / height, 0.1, 15000);
    this.camera.position.copy(DEFAULT_CAMERA_POSITION);
    this.camera.lookAt(DEFAULT_CAMERA_LOOK_AT);

    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.createStarfield();

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
  }

  /**
   * Register a callback for the Update phase (before WebGL render).
   * Convenience wrapper — prefer `lifecycle.on(RenderPhase.*, ...)` for
   * full phase and priority control.
   *
   * @param {LifecycleCallback} callback - Function called with FrameContext
   * @returns {Function} Unsubscribe function
   */
  onAnimate(callback: LifecycleCallback): () => void {
    return this.lifecycle.on(RenderPhase.Update, callback);
  }

  /**
   * Register a callback for the PostRender phase (after WebGL render).
   * Convenience wrapper — prefer `lifecycle.on(RenderPhase.*, ...)` for
   * full phase and priority control.
   *
   * @param {LifecycleCallback} callback - Function called with FrameContext
   * @returns {Function} Unsubscribe function
   */
  onPostRender(callback: LifecycleCallback): () => void {
    return this.lifecycle.on(RenderPhase.PostRender, callback);
  }

  /**
   * Start the animation loop.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now() / 1000;
    this.tick();
  }

  /**
   * Stop the animation loop.
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get the bounding rect of the renderer's canvas.
   *
   * @returns {DOMRect} Canvas bounding rectangle
   */
  getCanvasRect(): DOMRect {
    return this.renderer.domElement.getBoundingClientRect();
  }

  /**
   * Dispose all Three.js resources and remove the canvas from the DOM.
   * Must be called when the component unmounts.
   */
  dispose(): void {
    this.stop();
    this.resizeObserver.disconnect();
    this.lifecycle.clear();

    this.scene.traverse((object) => {
      if ('geometry' in object && object.geometry) {
        (object.geometry as BufferGeometry).dispose();
      }
      if ('material' in object && object.material) {
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        for (const material of materials) {
          material.dispose();
        }
      }
    });

    this.renderer.dispose();

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement,
      );
    }
  }

  /**
   * Main animation loop tick. Builds a FrameContext and dispatches
   * lifecycle phases around the WebGL render call:
   * PreUpdate → Update → PostUpdate → PreRender → render() → PostRender
   *
   * @private
   */
  private tick(): void {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(() => this.tick());

    const now = performance.now() / 1000;
    const deltaTime = now - this.lastTime;
    this.lastTime = now;
    this.frameCount++;

    const ctx: FrameContext = {
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      canvas: this.renderer.domElement,
      time: now,
      deltaTime,
      frame: this.frameCount,
    };

    this.lifecycle.runPreRenderPhases(ctx);
    this.renderer.render(this.scene, this.camera);
    this.lifecycle.runPostRenderPhases(ctx);
  }

  /**
   * Set up ambient and directional lighting for the scene.
   *
   * @private
   */
  private setupLighting(): void {
    const ambientLight = new AmbientLight(0x606068, 0.6);
    this.scene.add(ambientLight);

    const sunLight = new PointLight(0xffeedd, 2.0, 12000, 0.5);
    sunLight.position.set(0, 0, 0);
    sunLight.name = 'sun-point-light';
    this.scene.add(sunLight);
  }

  /**
   * Create a particle starfield as background decoration.
   *
   * @private
   */
  private createStarfield(): void {
    const positions = new Float32Array(STARFIELD_COUNT * 3);

    for (let i = 0; i < STARFIELD_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * STARFIELD_SPREAD * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * STARFIELD_SPREAD * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * STARFIELD_SPREAD * 2;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

    const material = new PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    });

    const starfield = new Points(geometry, material);
    starfield.name = 'starfield';
    this.scene.add(starfield);
  }

  /**
   * Handle container resize events.
   *
   * @private
   */
  private handleResize(): void {
    const { width, height } = this.getContainerSize();
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Get the container's current content dimensions.
   *
   * @private
   * @returns {{ width: number; height: number }} Container dimensions
   */
  private getContainerSize(): { width: number; height: number } {
    return {
      width: this.container.clientWidth || window.innerWidth,
      height: this.container.clientHeight || window.innerHeight,
    };
  }
}
