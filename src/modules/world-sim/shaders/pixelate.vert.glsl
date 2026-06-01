/**
 * Vertex shader for the full-screen post-processing quad.
 * Passes through clip-space position and UV to the fragment shader.
 * The quad geometry is a PlaneGeometry(2,2) in an orthographic scene,
 * so position.xy already covers the full NDC range [-1, 1].
 */

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
