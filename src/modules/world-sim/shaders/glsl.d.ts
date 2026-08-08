/**
 * @fileoverview GLSL Module Declaration
 * @description Declares .glsl files as string modules so TypeScript
 * can import them with proper typing. The string is produced by
 * `scripts/build/glslRawLoader.cjs` under Turbopack and by the matching
 * `glsl-source` plugin in `vitest.config.ts` under test.
 *
 * @module worldSim/shaders/glsl
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 */

declare module '*.glsl' {
  const value: string;
  export default value;
}
