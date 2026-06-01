/**
 * @fileoverview Type definitions for navigation-sidebar module.
 * @module modules/navigation-sidebar/domain/types
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import type SidebarActivePathStore from '@/lib/components/sidebar/store/sidebarActivePath';

/**
 * Navigation tree node (from walk, same structure as WalkNode from library).
 *
 * @interface Item
 * @property {string} name - Display name
 * @property {string} path - URL-friendly kebab-case path segment
 * @property {Item[]} [children] - Child nodes
 * @property {boolean} [isStub] - True when directory children not yet loaded
 * @property {number} [childCount] - Total descendant count (stub nodes only)
 * @property {string} [mainPath] - Kebab path to main.mdx if present
 */
export type Item = {
  name: string;
  path: string;
  children?: Item[];
  isStub?: boolean;
  childCount?: number;
  mainPath?: string;
};

/**
 * Layout-annotated item with computed expanded height.
 * Extension of Item with height metadata for rendering calculations.
 *
 * @interface LayoutItem
 * @extends Item
 * @property {number} expandedHeight - Pixel height when fully expanded
 * @property {(LayoutItem[] | Item[])} [children] - Nested items
 */
export type LayoutItem = Item & {
  expandedHeight: number;
  children?: LayoutItem[] | Item[];
};

/**
 * Props for Sidebar presentation component.
 *
 * @interface SidebarProps
 * @property {Item[]} items - Root navigation items
 * @property {() => void} [onNavigate] - Navigation link click callback
 * @property {boolean} [collapseSiblings=false] - Collapse sibling folders on open
 */
export interface SidebarProps {
  items: Item[];
  onNavigate?: () => void;
  collapseSiblings?: boolean;
}

/**
 * Props for SidebarItem recursive component.
 *
 * @interface SidebarItemProps
 * @property {LayoutItem} item - Item to render
 * @property {() => void} [onNavigate] - Navigation callback
 * @property {boolean} collapseSiblings - Sibling collapse flag
 * @property {InstanceType<typeof SidebarActivePathStore>} pathStore - Active path store
 */
export interface SidebarItemProps {
  item: LayoutItem;
  onNavigate?: () => void;
  collapseSiblings: boolean;
  pathStore: InstanceType<typeof SidebarActivePathStore>;
}

/**
 * Tree walk node (server-returned structure for shallow pagination).
 * Semantically equivalent to Item but returned directly from API.
 *
 * @interface WalkNode
 * @property {string} name - Human-readable display name
 * @property {string} path - URL-friendly path segment
 * @property {WalkNode[]} [children] - Child nodes
 * @property {boolean} [isStub] - Lazy-loadable placeholder flag
 * @property {number} [childCount] - Descendant count (stub nodes only)
 * @property {string} [mainPath] - Path to main.mdx (stub nodes only)
 */
export interface WalkNode {
  name: string;
  path: string;
  children?: WalkNode[];
  isStub?: boolean;
  childCount?: number;
  mainPath?: string;
}
