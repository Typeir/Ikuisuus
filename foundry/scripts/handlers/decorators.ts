/**
 * @fileoverview Decorator factories for the Foundry feature handler system.
 * @description Provides `@parser()` and `@handler()` decorators that register
 * monster sheet parsers and per-feature handler methods via metadata stored on
 * the class prototype. The {@link ParserRegistry} reads this metadata at
 * discovery time to build the dispatch table.
 *
 * @module foundry/scripts/handlers/decorators
 * @version 1.0.0
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
 * Metadata key used to store the handler map on the class prototype.
 * Each entry maps a feature ID suffix to the method name that handles it.
 */
export const HANDLER_MAP_KEY = Symbol('handler:map');

/**
 * Shape of a single handler registration entry stored on the prototype.
 *
 * @property {string} featureId - The feature ID suffix (after the slug prefix)
 * @property {string} methodName - Name of the decorated method on the class
 */
export interface HandlerEntry {
  featureId: string;
  methodName: string;
}

/**
 * Class decorator factory that binds a parser class to a specific monster sheet slug.
 * The slug is stored as static metadata and used by the registry to route features
 * from a given monster to the correct parser instance.
 *
 * @param {string} sheetSlug - The monster sheet slug (e.g. "war-godess-yskeia")
 * @returns {ClassDecorator} Decorator that attaches the slug as metadata
 *
 * @example
 * ```typescript
 * @parser('war-godess-yskeia')
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
  };
}

/**
 * Method decorator factory that registers a class method as the handler for a
 * specific feature ID. The feature ID is the suffix portion after the sheet
 * slug prefix (e.g. `"faterender-railgun-recharge-6"` for the full ID
 * `"war-godess-yskeia/faterender-railgun-recharge-6"`).
 *
 * Handler methods receive the raw MDX body text of the feature and return
 * a partial Foundry item system object to merge into the generated item.
 *
 * @param {string} featureId - Feature ID suffix (everything after `slug/`)
 * @returns {MethodDecorator} Decorator that registers the method in the handler map
 *
 * @example
 * ```typescript
 * @handler('faterender-railgun-recharge-6')
 * handleFaterenderRailgun(body: string): FoundryItemOverrides {
 *   // Parse body text, return item overrides
 * }
 * ```
 */
export function handler(featureId: string): MethodDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) => {
    const existing: HandlerEntry[] =
      (target as Record<symbol, HandlerEntry[]>)[HANDLER_MAP_KEY] ?? [];
    const entry: HandlerEntry = {
      featureId,
      methodName: String(propertyKey),
    };
    Object.defineProperty(target, HANDLER_MAP_KEY, {
      value: [...existing, entry],
      enumerable: false,
      configurable: true,
      writable: false,
    });
  };
}
