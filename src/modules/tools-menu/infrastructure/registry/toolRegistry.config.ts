/**
 * @fileoverview Static tool registry configuration for the tools-menu module.
 * @description Defines the canonical list of DM tools available in the sidebar menu.
 * This is the single source of truth for tool entries — adding or removing a tool
 * means editing this file only; the shell and component consume it via `useToolRegistry()`.
 *
 * @module src/modules/tools-menu/infrastructure/registry/toolRegistry.config
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * A raw registry entry before i18n resolution and locale interpolation.
 *
 * @interface ToolRegistryEntry
 * @property {string} id - Unique stable identifier matching the tool slug.
 * @property {string} labelKey - Dot-notation key within the `layout` i18n namespace, e.g. `tools.encounterCreator`.
 * @property {(locale: string) => string} hrefBuilder - Pure function that constructs the locale-prefixed href.
 */
export interface ToolRegistryEntry {
  id: string;
  labelKey: string;
  hrefBuilder: (locale: string) => string;
}

/**
 * The canonical list of DM tools exposed in the sidebar tools menu.
 * Order determines display order in the dropdown.
 *
 * @constant TOOL_REGISTRY
 * @type {readonly ToolRegistryEntry[]}
 */
export const TOOL_REGISTRY: readonly ToolRegistryEntry[] = [
  {
    id: 'encounter-creator',
    labelKey: 'tools.encounterCreator',
    hrefBuilder: (l) => `/${l}/utils/encounter-planner`,
  },
  {
    id: 'world-sim',
    labelKey: 'tools.worldSim',
    hrefBuilder: (l) => `/${l}/utils/world-sim`,
  },
  {
    id: 'character-builder',
    labelKey: 'tools.characterBuilder',
    hrefBuilder: (l) => `/${l}/utils/characters`,
  },
  {
    id: 'mdx-editor',
    labelKey: 'tools.mdxEditor',
    hrefBuilder: (l) => `/${l}/utils/mdx-editor`,
  },
] as const;
