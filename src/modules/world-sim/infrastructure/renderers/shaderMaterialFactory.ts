/**
 * @fileoverview Shader Material Factory
 * @description Constructs `ShaderMaterial` instances with a noise GLSL
 * snippet prepended to the vertex (and optionally fragment) shader.
 *
 * @module worldSim/celestials/shaderMaterialFactory
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { ShaderMaterial, type ShaderMaterialParameters } from 'three';
import noise3dGlsl from '../../shaders/noise3d.glsl';

/**
 * Options accepted by `createDisplacedShaderMaterial`.
 *
 * @interface DisplacedShaderMaterialOptions
 * @property {string} vertexShader - The renderer-specific vertex shader source. The noise snippet is prepended automatically.
 * @property {string} fragmentShader - The renderer-specific fragment shader source. The noise snippet is NOT prepended unless `prependNoiseToFragment` is true.
 * @property {Record<string, { value: unknown }>} uniforms - Uniform map forwarded to the `ShaderMaterial`.
 * @property {boolean} [prependNoiseToFragment] - When true, also prepend the noise snippet to the fragment shader. Defaults to false.
 * @property {string} [noiseSnippet] - Override the noise GLSL source. Defaults to the project-wide `noise3d.glsl` import.
 * @property {Omit<ShaderMaterialParameters, 'vertexShader' | 'fragmentShader' | 'uniforms'>} [materialParams] - Optional additional `ShaderMaterial` parameters (transparent, depthWrite, blending, side, defines, etc.).
 */
export interface DisplacedShaderMaterialOptions {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
  prependNoiseToFragment?: boolean;
  noiseSnippet?: string;
  materialParams?: Omit<
    ShaderMaterialParameters,
    'vertexShader' | 'fragmentShader' | 'uniforms'
  >;
}

/**
 * Construct a `ShaderMaterial` with a noise GLSL snippet automatically
 * prepended to the vertex shader (and optionally the fragment shader).
 *
 * @param {DisplacedShaderMaterialOptions} options - Shader sources, uniforms, and optional material params.
 * @returns {ShaderMaterial} A configured `ShaderMaterial` ready for assignment.
 */
export function createDisplacedShaderMaterial(
  options: DisplacedShaderMaterialOptions,
): ShaderMaterial {
  const snippet = options.noiseSnippet ?? noise3dGlsl;
  return new ShaderMaterial({
    ...(options.materialParams ?? {}),
    vertexShader: `${snippet}\n${options.vertexShader}`,
    fragmentShader: options.prependNoiseToFragment
      ? `${snippet}\n${options.fragmentShader}`
      : options.fragmentShader,
    uniforms: options.uniforms,
  });
}
