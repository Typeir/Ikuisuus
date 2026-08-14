/**
 * @fileoverview Scene Graph Dispose Utility
 * @description Recursively disposes geometries, materials, and textures in a
 * Three.js scene graph subtree.
 *
 * @module worldSim/celestials/disposeUtils
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { BufferGeometry, Material, Object3D, Texture } from 'three';

/**
 * Mesh-like object with optional geometry and material properties.
 *
 * @interface DisposableChild
 * @property {BufferGeometry} [geometry] - Geometry to dispose
 * @property {Material | Material[]} [material] - Material(s) to dispose
 */
interface DisposableChild {
  /** @property {BufferGeometry} [geometry] - Geometry to dispose */
  geometry?: BufferGeometry;
  /** @property {Material | Material[]} [material] - Material(s) to dispose */
  material?: Material | Material[];
}

/**
 * Material with optional map textures to dispose.
 *
 * @interface DisposableMaterial
 * @property {Texture} [map] - Diffuse map texture
 */
interface DisposableMaterial extends Material {
  /** @property {Texture} [map] - Diffuse map texture */
  map?: Texture | null;
}

/**
 * Recursively traverses the scene graph node and disposes each child's
 * geometry, material, and texture map.
 *
 * @function disposeSceneGraph
 * @param {Object3D} root - Root node to traverse and dispose
 *
 * @example
 * ```ts
 * dispose(mesh: Object3D): void {
 *   disposeSceneGraph(mesh);
 * }
 * ```
 */
export function disposeSceneGraph(root: Object3D): void {
  root.traverse((child) => {
    const disposable = child as unknown as DisposableChild;

    if (disposable.geometry) {
      disposable.geometry.dispose();
    }

    if (disposable.material) {
      const materials = Array.isArray(disposable.material)
        ? disposable.material
        : [disposable.material];
      for (let i = 0; i < materials.length; i++) {
        const mat = materials[i] as DisposableMaterial;
        if (mat.map) {
          mat.map.dispose();
        }
        mat.dispose();
      }
    }
  });
}
