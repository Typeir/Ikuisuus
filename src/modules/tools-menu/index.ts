/**
 * @fileoverview Public API barrel for the tools-menu module.
 * @description Exports the ToolsMenu component, useToolRegistry hook, and ToolMenuItem type.
 * The raw TOOL_REGISTRY config is intentionally NOT exported — consumers must use the hook.
 *
 * @module src/modules/tools-menu
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

export { useToolRegistry } from './application/hooks/useToolRegistry';
export type { ToolMenuItem } from './domain/toolMenuItem.types';
export { ToolsMenu } from './presentation/ToolsMenu';

