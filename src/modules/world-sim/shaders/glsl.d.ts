/**
 * @fileoverview GLSL Module Declaration
 * @description Declares .glsl files as string modules so TypeScript
 * can import them with proper typing.
 *
 * @module modules/world-sim/shaders/glsl
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

declare module '*.glsl' {
  const value: string;
  export default value;
}
