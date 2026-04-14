/**
 * @fileoverview Decorator factories for the Foundry feature handler system.
 * @description Provides `@parser()` and `@handler()` decorators that register
 * monster sheet parsers and per-feature handler methods. Uses a module-level
 * accumulator pattern for cross-runtime compatibility (esbuild TC39 Stage 3
 * decorators and legacy TypeScript experimentalDecorators).
 *
 * Method decorators push entries to a pending queue; the class decorator
 * sweeps them onto the class constructor. The {@link ParserRegistry} reads
 * these stored entries at discovery time.
 *
 * @module foundry/scripts/handlers/decorators
 * @version 2.0.0
 * @author Typeir
 * @since 2026-04-14
 *
 * @see {@link parser} for class-level sheet binding
 * @see {@link handler} for method-level feature binding
 */

/**
 * Metadata key used to store the sheet slug on decorated parser classes.
 * The {@link parser} decorator writes to this key; the registry reads it.
 */
export const PARSER_SHEET_KEY = Symbol('parser:sheet');

/**
 * Metadata key used to store the handler map on the class constructor.
 * Each entry maps a feature ID suffix to the method name that handles it.
 */
export const HANDLER_MAP_KEY = Symbol('handler:map');

/**
 * Shape of a single handler registration entry.
 *
 * @property {string} featureId - The feature ID suffix (after the slug prefix)
 * @property {string} methodName - Name of the decorated method on the class
 */
export interface HandlerEntry {
  featureId: string;
  methodName: string;
}

/**
 * Module-level accumulator for handler entries. Method decorators push here;
 * the class decorator sweeps entries onto the constructor and resets.
 */
let pendingHandlers: HandlerEntry[] = [];

/**
 * Class decorator factory that binds a parser class to a specific monster sheet slug.
 * Also sweeps any pending handler entries onto the class constructor.
 *
 * @param {string} sheetSlug - The monster sheet slug (e.g. "war-goddess-yskeia")
 * @returns {ClassDecorator} Decorator that attaches the slug and handler map
 *
 * @example
 * ```typescript
 * @parser('war-goddess-yskeia')
 * class YskeiaParser { ... }
 * ```
 */
export function parser(sheetSlug: string): ClassDecorator {
  return (target: Function) => {
    Object.defineProperty(target, PARSER_SHEET_KEY, {
      value: sheetSlug,
      enumerable: false,
      configurable: false,
      writable: false,
    });

    Object.defineProperty(target, HANDLER_MAP_KEY, {
      value: [...pendingHandlers],
      enumerable: false,
      configurable: false,
      writable: false,
    });
    pendingHandlers = [];
  };
}

/**
 * Method decorator factory that registers a class method as the handler for a
 * specific feature ID. Compatible with both TC39 Stage 3 decorators (esbuild)
 * and legacy TypeScript experimentalDecorators.
 *
 * @param {string} featureId - Feature ID suffix (everything after `slug/`)
 * @returns {MethodDecorator} Decorator that queues the method in the handler accumulator
 *
 * @example
 * ```typescript
 * @handler('faterender-railgun-recharge-6')
 * handleFaterenderRailgun(body: string): FoundryItemOverrides {
 *   // return item overrides
 * }
 * ```
 */
export function handler(featureId: string): MethodDecorator {
  return (
    target: Object,
    contextOrKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) => {
    const methodName =
      typeof contextOrKey === 'object' && contextOrKey !== null
        ? String((contextOrKey as unknown as { name: string }).name)
        : String(contextOrKey);

    pendingHandlers.push({ featureId, methodName });
  };
}
