/**
 * Vertex shader for the Länsihenki × Itähenki collision opaque core —
 * heavy multi-octave simplex noise displacement along surface normals so the
 * grey debris ball reads as a lumpy, churning mass rather than a smooth
 * sphere. noise3d.glsl is prepended at runtime by CollisionCloudEffect.
 */

uniform float uTime;
uniform float uDisplacementScale;
uniform float uNoiseScale;

varying vec3 vNormal;
varying float vNoise;

void main() {
  vec3 pos = position;

  /* Four-octave noise: dominant heave + churn + wisp + grit. Time
     multipliers are high enough that the surface visibly ebbs and rolls
     against the group rotation, like a sun's photosphere. */
  vec3 coord = pos * uNoiseScale;
  float n1 = snoise(coord + vec3(uTime * 0.45, uTime * 0.18, 0.0));
  float n2 = snoise(coord * 2.10 + vec3(uTime * 0.22, uTime * 0.70, 0.0)) * 0.55;
  float n3 = snoise(coord * 4.30 + vec3(0.0, uTime * 0.35, uTime * 1.10)) * 0.28;
  float n4 = snoise(coord * 8.70 + vec3(uTime * 0.85)) * 0.14;
  float disp = n1 + n2 + n3 + n4;

  vNoise = disp;

  pos += normal * disp * uDisplacementScale;

  vNormal = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
