/**
 * Vertex shader for terrestrial planet surfaces — two-tier noise-driven
 * vertex displacement. A low-frequency "continental" layer carves large
 * ocean/continent shapes; a high-frequency "detail" layer adds local
 * variance (islands, ridges, mountains). Both layers blend additively to
 * produce a single elevation value shared with the fragment shader.
 *
 * All noise is sampled from the 3D object-space position (not UV), which
 * eliminates pole-pinch artefacts inherent in spherical UV mapping.
 *
 * noise3d.glsl (simplex noise) is prepended at build time by PlanetRenderer.
 */

uniform float uTime;
uniform float uDisplacementScale;
uniform float uSeed;
uniform float uContinentScale;
uniform float uDetailScale;
uniform float uOceanThreshold;

varying vec3  vNormal;
varying vec3  vWorldPosition;
varying float vElevation;
varying float vLatitude;

void main() {
  vec3 pos = position;

  /* Body-unique seed offset so each planet is distinct */
  vec3 seedOffset = vec3(uSeed, uSeed * 0.7, uSeed * 1.3);

  /**
   * Layer 1 — Continental noise (low frequency, large features).
   * Two octaves at continent scale define ocean basins vs landmasses.
   */
  vec3 contCoord = pos * uContinentScale + seedOffset;
  float continent  = snoise(contCoord) * 0.65;
  continent       += snoise(contCoord * 2.1 + vec3(3.7, 1.2, 5.9)) * 0.35;

  /**
   * Layer 2 — Detail noise (high frequency, local features).
   * Three octaves at detail scale add coastlines, mountain ridges, valleys.
   */
  vec3 detCoord = pos * uDetailScale + seedOffset + vec3(50.3, 17.1, 83.7);
  float detail  = snoise(detCoord) * 0.45;
  detail       += snoise(detCoord * 2.3 + vec3(5.2, 1.3, 2.8)) * 0.30;
  detail       += snoise(detCoord * 5.1 + vec3(2.8, 7.1, 4.3)) * 0.25;

  /**
   * Composite — the continental layer is dominant.  The detail layer is
   * scaled down to act as local variance on top of the continent mask.
   * Floor the result at the ocean threshold so water is mostly flat.
   */
  float raw = continent + detail * 0.35;
  float elevation = raw > uOceanThreshold ? raw : uOceanThreshold + (raw - uOceanThreshold) * 0.08;

  vElevation = elevation;

  /**
   * Latitude for polar-ice shading.  Derived from the normalized object
   * normal's Y component (range -1..1) so it is UV-independent and stable
   * at the poles.
   */
  vLatitude = normalize(normal).y;

  /* Displace along normal for terrain relief */
  pos += normal * elevation * uDisplacementScale;

  vNormal = normalize(mat3(modelMatrix) * normal);
  vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
