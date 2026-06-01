/**
 * @fileoverview Shared navigation tree types for library walk utilities.
 * @module modules/library/infrastructure/navigation/types
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

/**
 * Tree node returned by navigation walk functions.
 *
 * @interface WalkNode
 * @property {string} name - Human-readable display name.
 * @property {string} path - URL-friendly path segment.
 * @property {WalkNode[]} [children] - Child nodes for directory entries.
 * @property {boolean} [isStub] - Indicates lazy-loadable placeholder node.
 * @property {number} [childCount] - Descendant count for stub nodes.
 * @property {string} [mainPath] - Path to directory main document when present.
 */
export interface WalkNode {
  name: string;
  path: string;
  children?: WalkNode[];
  isStub?: boolean;
  childCount?: number;
  mainPath?: string;
}
