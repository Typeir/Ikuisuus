/**
 * @fileoverview Type definitions for sidebar navigation
 * @module modules/navigation-sidebar/domain/types
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import type SidebarActivePathStore from '@/modules/navigation-sidebar/infrastructure/store/sidebarActivePath';

/**
 * Sidebar navigation item
 *
 * @interface Item
 * @property {string} name - Display name of the item
 * @property {string} path - Routing path for the item
 * @property {Item[]} [children] - Optional nested child items
 * @property {boolean} [isStub] - True when children exist but have not yet been loaded
 * @property {number} [childCount] - Total descendant count for height pre-calculation
 * @property {string} [mainPath] - Kebab path to main.mdx if the directory contains one
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
 * Layout-computed sidebar item with height metadata
 *
 * @interface LayoutItem
 * @extends Item
 * @property {number} expandedHeight - Calculated height when expanded (px)
 * @property {(LayoutItem[] | Item[])} [children] - Nested items with heights
 */
export type LayoutItem = Item & {
  expandedHeight: number;
  children?: LayoutItem[] | Item[];
};

/**
 * Props for the Sidebar component
 *
 * @interface SidebarProps
 * @property {Item[]} items - The root navigation items
 * @property {() => void} [onNavigate] - Callback when a link is clicked
 * @property {boolean} [collapseSiblings=false] - If true, opening one item collapses siblings
 */
export interface SidebarProps {
  items: Item[];
  onNavigate?: () => void;
  collapseSiblings?: boolean;
}

/**
 * Props for SidebarItem component
 *
 * @interface SidebarItemProps
 * @property {LayoutItem} item - The item to render
 * @property {() => void} [onNavigate] - Navigation callback
 * @property {boolean} collapseSiblings - Whether to collapse other items when opening
 * @property {InstanceType<typeof SidebarActivePathStore>} pathStore - Active path store instance
 */
export interface SidebarItemProps {
  item: LayoutItem;
  onNavigate?: () => void;
  collapseSiblings: boolean;
  pathStore: InstanceType<typeof SidebarActivePathStore>;
}
