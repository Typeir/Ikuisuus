/**
 * @fileoverview Scene Manager — Three.js Lifecycle Owner
 * @description Creates and manages the Three.js renderer, scene, camera, lights,
 * and animation loop. Single Responsibility: only owns the rendering lifecycle.
 * Does not handle user input (CameraController) or React state (Context).
 *
 * @module worldSim/canvas/SceneManager
 * @version 1.0.0
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

/** @constant {number} STARFIELD_COUNT - Number of background starfield particles */
const STARFIELD_COUNT = 2000;

/** @constant {number} STARFIELD_SPREAD - Spread radius for starfield particles */
const STARFIELD_SPREAD = 12000;

/**
 * Callback signature for the animation loop.
 * @typedef {Function} AnimationLoopCallback
 * @param {number} time - Elapsed time in seconds
 * @param {number} deltaTime - Time since last frame in seconds
 */
type AnimationLoopCallback = (time: number, deltaTime: number) => void;

/**
 * Manages the Three.js rendering lifecycle.
 * Creates renderer, scene, camera, base lighting, and starfield background.
 * Runs the animation loop and handles resize events.
 *
 * @class SceneManager
 *
 * @example
 * ```ts
 * const manager = new SceneManager(canvasElement);
 * manager.onAnimate((time, dt) => { ... });
 * manager.start();
 * // Later:
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

  /** @property {HTMLElement} container - The DOM element hosting the canvas */
  private container: HTMLElement;

  /** @property {number | null} animationFrameId - Current rAF handle */
  private animationFrameId: number | null = null;

  /** @property {AnimationLoopCallback[]} animationCallbacks - Registered animation callbacks */
  private animationCallbacks: AnimationLoopCallback[] = [];

  /** @property {number} lastTime - Timestamp of the last frame (seconds) */
  private lastTime: number = 0;

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
    this.camera.position.set(0, 800, 2500);
    this.camera.lookAt(0, 0, 0);

    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.createStarfield();

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
  }

  /**
   * Register a callback to be called each animation frame.
   *
   * @param {AnimationLoopCallback} callback - Function called with (time, deltaTime)
   */
  onAnimate(callback: AnimationLoopCallback): void {
    this.animationCallbacks.push(callback);
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
    this.animationCallbacks = [];

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
   * Main animation loop tick.
   *
   * @private
   */
  private tick(): void {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(() => this.tick());

    const now = performance.now() / 1000;
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    for (const callback of this.animationCallbacks) {
      callback(now, deltaTime);
    }

    this.renderer.render(this.scene, this.camera);
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
