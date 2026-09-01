/**
 * @fileoverview Pixelation Post-Processing Pass
 * @description Renders the scene into a WebGLRenderTarget, then draws it
 * through a single fragment pass applying pixelation, chromatic aberration,
 * sharpening, and pseudo-emboss, with no extra render targets.
 *
 * @module modules/world-sim/infrastructure/three-js/PixelatePass
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import type { Camera, WebGLRenderer } from 'three';
import {
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
} from 'three';
import pixelateFrag from '../../shaders/pixelate.frag.glsl';
import pixelateVert from '../../shaders/pixelate.vert.glsl';

/** @constant {number} DEFAULT_PIXEL_COUNT_X - Default horizontal pixel grid size */
const DEFAULT_PIXEL_COUNT_X = 960;

/** @constant {number} DEFAULT_PIXEL_COUNT_Y - Default vertical pixel grid size */
const DEFAULT_PIXEL_COUNT_Y = 540;

/**
 * Default chromatic aberration strength in canvas-pixel units.
 * Shader suppresses near-white pixels; 1.5 ≈ <1 px shift at corner.
 */
const DEFAULT_CA_STRENGTH = 1.5;

/** @constant {number} DEFAULT_SHARPEN_STRENGTH - Default unsharp-mask weight */
const DEFAULT_SHARPEN_STRENGTH = 0.7;

/** @constant {number} DEFAULT_EMBOSS_STRENGTH - Default pseudo-emboss bevel intensity */
const DEFAULT_EMBOSS_STRENGTH = 0.25;

/**
 * Post-processing pass applying pixelation, chromatic aberration,
 * sharpening, and pseudo-emboss in a single fragment-shader pass.
 *
 * @class PixelatePass
 *
 * @property {boolean} enabled - Whether the effect is currently active
 * @property {number} pixelCountX - Horizontal grid resolution
 * @property {number} pixelCountY - Vertical grid resolution
 */
export class PixelatePass {
  /** @property {WebGLRenderTarget} renderTarget - Off-screen target for the scene pass */
  private readonly renderTarget: WebGLRenderTarget;

  /** @property {Scene} quadScene - Orthographic scene containing the full-screen quad */
  private readonly quadScene: Scene;

  /** @property {OrthographicCamera} quadCamera - NDC-space orthographic camera */
  private readonly quadCamera: OrthographicCamera;

  /** @property {ShaderMaterial} material - Pixelation shader material */
  private readonly material: ShaderMaterial;

  /** @property {boolean} enabled - Whether the pass is active */
  private enabled: boolean = true;

  /** @property {number} pixelCountX - Horizontal grid cell count */
  public pixelCountX: number = DEFAULT_PIXEL_COUNT_X;

  /** @property {number} pixelCountY - Vertical grid cell count */
  public pixelCountY: number = DEFAULT_PIXEL_COUNT_Y;

  /** @property {number} caStrength - Chromatic aberration spread */
  public caStrength: number = DEFAULT_CA_STRENGTH;

  /** @property {number} sharpenStrength - Unsharp-mask blend weight */
  public sharpenStrength: number = DEFAULT_SHARPEN_STRENGTH;

  /** @property {number} embossStrength - Pseudo-emboss bevel intensity */
  public embossStrength: number = DEFAULT_EMBOSS_STRENGTH;

  /**
   * Create a PixelatePass sized to the initial canvas dimensions.
   *
   * @param {number} width - Initial canvas width in physical pixels
   * @param {number} height - Initial canvas height in physical pixels
   */
  constructor(width: number, height: number) {
    this.renderTarget = new WebGLRenderTarget(width, height, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      stencilBuffer: false,
    });

    this.material = new ShaderMaterial({
      vertexShader: pixelateVert,
      fragmentShader: pixelateFrag,
      uniforms: {
        uTexture: { value: this.renderTarget.texture },
        uPixelCount: {
          value: new Vector2(DEFAULT_PIXEL_COUNT_X, DEFAULT_PIXEL_COUNT_Y),
        },
        uResolution: { value: new Vector2(width, height) },
        uCAStrength: { value: DEFAULT_CA_STRENGTH },
        uSharpenStrength: { value: DEFAULT_SHARPEN_STRENGTH },
        uEmbossStrength: { value: DEFAULT_EMBOSS_STRENGTH },
      },
      depthTest: false,
      depthWrite: false,
    });

    const quad = new Mesh(new PlaneGeometry(2, 2), this.material);
    quad.name = 'pixelate-quad';
    quad.frustumCulled = false;

    this.quadScene = new Scene();
    this.quadScene.add(quad);

    this.quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  /**
   * Two-pass render: scene → render target, then quad → screen.
   * When disabled, falls back to a direct render with no extra allocation.
   *
   * @param {WebGLRenderer} renderer - Active WebGL renderer
   * @param {Scene} scene - The main Three.js scene
   * @param {Camera} camera - The main scene camera
   */
  render(renderer: WebGLRenderer, scene: Scene, camera: Camera): void {
    if (!this.enabled) {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }

    renderer.setRenderTarget(this.renderTarget);
    renderer.render(scene, camera);

    renderer.setRenderTarget(null);
    renderer.render(this.quadScene, this.quadCamera);
  }

  /**
   * Change the pixel grid resolution.
   * Lower values produce coarser output.
   *
   * @param {number} x - Horizontal cell count
   * @param {number} y - Vertical cell count
   */
  setPixelCount(x: number, y: number): void {
    this.pixelCountX = x;
    this.pixelCountY = y;
    this.material.uniforms.uPixelCount.value.set(x, y);
  }

  /**
   * Set chromatic aberration spread. Larger values produce more colour
   * fringing at screen edges.
   *
   * @param {number} strength - Radial UV offset per channel
   */
  setCAStrength(strength: number): void {
    this.caStrength = strength;
    this.material.uniforms.uCAStrength.value = strength;
  }

  /**
   * Set unsharp-mask sharpening weight. Values above ~1.5 cause haloing;
   * 0.5–1.0 is a natural range.
   *
   * @param {number} strength - Sharpening blend weight
   */
  setSharpenStrength(strength: number): void {
    this.sharpenStrength = strength;
    this.material.uniforms.uSharpenStrength.value = strength;
  }

  /**
   * Set pseudo-emboss bevel intensity from the luminance gradient.
   *
   * @param {number} strength - Bevel intensity
   */
  setEmbossStrength(strength: number): void {
    this.embossStrength = strength;
    this.material.uniforms.uEmbossStrength.value = strength;
  }

  /**
   * Enable or disable the pixelation effect. When disabled, the scene is
   * rendered directly without the extra pass.
   *
   * @param {boolean} enabled - Whether to apply the effect
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Returns whether the effect is currently active.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Resize the render target to match the new canvas dimensions.
   * Must be called whenever the canvas is resized.
   *
   * @param {number} width - New canvas width in physical pixels
   * @param {number} height - New canvas height in physical pixels
   */
  handleResize(width: number, height: number): void {
    this.renderTarget.setSize(width, height);
    this.material.uniforms.uResolution.value.set(width, height);
  }

  /**
   * Release all GPU resources. Call when the pass is no longer needed.
   */
  dispose(): void {
    this.renderTarget.dispose();
    this.material.dispose();
    const quad = this.quadScene.children[0] as Mesh;
    quad.geometry.dispose();
  }
}
