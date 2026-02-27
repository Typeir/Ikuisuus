/**
 * @fileoverview GLSL Module Declaration
 * @description Declares .glsl files as string modules so TypeScript
 * can import them with proper typing. Webpack's raw-loader handles
 * the actual bundling.
 *
 * @module worldSim/shaders/glsl
 */

declare module '*.glsl' {
  const value: string;
  export default value;
}
