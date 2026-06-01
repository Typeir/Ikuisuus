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
import { registerIkModule, unregisterIkModule } from '@/lib/debug/ik';
import {
    CAMERA_FAR,
    CAMERA_FOV,
    CAMERA_NEAR,
    SCENE_BACKGROUND_COLOR,
    STARFIELD_COUNT,
    STARFIELD_SPREAD,
} from '@/modules/world-sim/infrastructure/config/sceneTuning';
import { DEFAULT_CAMERA_LOOK_AT, DEFAULT_CAMERA_POSITION } from '@/modules/world-sim/infrastructure/constants';
import { PixelatePass } from '@/modules/world-sim/infrastructure/three-js/PixelatePass';
import {
    RenderLifecycle,
    RenderPhase,
    type FrameContext,
    type LifecycleCallback,
} from '@/modules/world-sim/infrastructure/three-js/RenderLifecycle';

/**
 * Detect whether the current device is likely a mobile/touch device.
 * Combines touch-capability with viewport width for reliability.
 *
 * @function isMobileDevice
 * @returns {boolean} True if the device appears to be mobile
 */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const hasTouch = navigator.maxTouchPoints > 0;
  const isSmall = window.innerWidth <= 768;
  return hasTouch && isSmall;
}

/**
 * Compute the initial maximum pixel ratio based on device capability.
 * Mobile devices get DPR 1 to cut fill rate by 4× vs DPR 2.
 *
 * @function getInitialMaxDPR
 * @returns {number} Maximum pixel ratio for the WebGL renderer
 */
function getInitialMaxDPR(): number {
  if (isMobileDevice()) return 1;
  if (navigator.maxTouchPoints > 0) return 1.5;
  return 2;
}

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

  /** @property {PixelatePass} pixelatePass - Post-processing pixelation pass */
  public readonly pixelatePass: PixelatePass;

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

  /**
   * Maximum `deltaTime` clamped per frame in seconds.
   * Prevents physics and rotation jumps when the tab resumes from being
   * backgrounded. Writable via `window.ik.ws.deltaTimeCap`.
   * Clamped to the range [1/120, 1] on write.
   */
  private deltaTimeCap: number = 1 / 15;

  /** @property {number} lastFps - FPS computed from the previous raw delta (before clamping) */
  private lastFps: number = 0;

  /**
   * Accumulated simulation time in seconds since the loop started.
   * Advances at `clampedDelta * simSpeed` each frame.
   * Passed as `FrameContext.time` to all subscribers.
   */
  private simTime: number = 0;

  /**
   * Simulation speed multiplier applied to `deltaTime` to produce
   * `FrameContext.simDeltaTime` and to advance `simTime`.
   * Writable via `window.ik.ws.simulationSpeed`. Clamped to [0, 1000].
   */
  private simSpeed: number = 1;

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
      antialias: !isMobileDevice(),
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, getInitialMaxDPR()),
    );
    this.renderer.setClearColor(new Color(SCENE_BACKGROUND_COLOR), 1);

    this.scene = new Scene();

    const { width, height } = this.getContainerSize();
    this.camera = new PerspectiveCamera(
      CAMERA_FOV,
      width / height,
      CAMERA_NEAR,
      CAMERA_FAR,
    );
    this.camera.position.copy(DEFAULT_CAMERA_POSITION);
    this.camera.lookAt(DEFAULT_CAMERA_LOOK_AT);

    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    this.pixelatePass = new PixelatePass(
      width * this.renderer.getPixelRatio(),
      height * this.renderer.getPixelRatio(),
    );

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
    this.simTime = 0;
    this.lastTime = performance.now() / 1000;

    const self = this;
    registerIkModule('ws', {
      get deltaTimeCap(): number {
        return self.deltaTimeCap;
      },
      set deltaTimeCap(v: number) {
        self.deltaTimeCap = Math.min(1, Math.max(1 / 120, v));
      },
      get fps(): number {
        return self.lastFps;
      },
      get time(): number {
        return self.simTime;
      },
      get running(): boolean {
        return self.isRunning;
      },
      get simulationSpeed(): number {
        return self.simSpeed;
      },
      set simulationSpeed(v: number) {
        self.simSpeed = Math.min(1000, Math.max(0, v));
      },
    });

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
   * Adaptively cap the WebGL pixel ratio. Called by the mediator when
   * the performance controller transitions between quality tiers.
   * Reduces fill rate on struggling devices without a full resize.
   *
   * @param {number} maxDPR - Maximum device pixel ratio to allow
   */
  setPixelRatioCap(maxDPR: number): void {
    const effective = Math.min(window.devicePixelRatio, maxDPR);
    this.renderer.setPixelRatio(effective);
    const { width, height } = this.getContainerSize();
    this.renderer.setSize(width, height);
    this.pixelatePass.handleResize(
      width * this.renderer.getPixelRatio(),
      height * this.renderer.getPixelRatio(),
    );
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
    unregisterIkModule('ws');
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

    this.pixelatePass.dispose();
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
    const rawDelta = now - this.lastTime;
    this.lastFps = rawDelta > 0 ? 1 / rawDelta : 0;
    const deltaTime = Math.min(rawDelta, this.deltaTimeCap);
    const simDeltaTime = deltaTime * this.simSpeed;
    this.simTime += simDeltaTime;
    this.lastTime = now;
    this.frameCount++;

    const ctx: FrameContext = {
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      canvas: this.renderer.domElement,
      time: this.simTime,
      deltaTime,
      simDeltaTime,
      frame: this.frameCount,
    };

    this.lifecycle.runPreRenderPhases(ctx);
    this.pixelatePass.render(this.renderer, this.scene, this.camera);
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
    this.pixelatePass.handleResize(
      width * this.renderer.getPixelRatio(),
      height * this.renderer.getPixelRatio(),
    );
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
