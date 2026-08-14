/**
 * @fileoverview Barrel export for the Foundry feature handler system.
 * @description Re-exports decorators, types, the parser registry, and all
 * registered parser classes.
 *
 * @module foundry/scripts/handlers
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-14
 */

export { YskeiaParser } from '../parsers/yskeiaParser';
export {
    handler,
    HANDLER_MAP_KEY,
    parser,
    PARSER_SHEET_KEY
} from './decorators';
export type { HandlerEntry } from './decorators';
export { ParserRegistry } from './registry';
export type { FoundryItemOverrides, IFeatureParser } from './types';

