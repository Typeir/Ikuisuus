/**
 * @fileoverview ToolMenuItem domain type for the tools-menu module.
 * @description Defines the canonical shape of a single item in the tools navigation menu.
 *
 * @module src/modules/tools-menu/domain/toolMenuItem.types
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * A single item displayed in the DM tools navigation menu.
 *
 * @interface ToolMenuItem
 * @property {string} id - Unique identifier for the menu item, used as React key and in `onSelect` callbacks.
 * @property {string} label - Translated display text shown in the menu list.
 * @property {string} href - Fully-resolved navigation URL (locale-prefixed), e.g. `/en/utils/encounter-planner`.
 */
export interface ToolMenuItem {
  id: string;
  label: string;
  href: string;
}
