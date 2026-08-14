/**
 * @fileoverview Parser registry for Foundry feature handlers.
 * @description Discovers all `@parser`-decorated classes, builds a dispatch
 * table from their `@handler`-decorated methods, and provides a single
 * `dispatch()` entry point that routes a feature ID + body text to the
 * correct handler method.
 *
 * @module foundry/scripts/handlers/registry
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-14
 *
 * @see {@link ParserRegistry} for the main class
 * @see {@link dispatch} for the public dispatch function
 */

import {
  HANDLER_MAP_KEY,
  PARSER_SHEET_KEY,
  type HandlerEntry,
} from './decorators';
import type { FoundryItemOverrides, IFeatureParser } from './types';

/**
 * Internal dispatch record linking a parser instance to a handler method name.
 *
 * @property {IFeatureParser} parser - The instantiated parser class
 * @property {string} methodName - Method name to call on the parser
 */
interface DispatchEntry {
  parser: IFeatureParser;
  methodName: string;
}

/**
 * Registry that collects parser classes and provides feature-level dispatch.
 *
 * Parser classes are registered via {@link register} or the constructor's
 * `parsers` array; {@link dispatch} routes full feature IDs to handler methods.
 *
 * @property {Map<string, DispatchEntry>} handlers - Full feature ID → dispatch entry
 * @property {Map<string, IFeatureParser>} parsers - Sheet slug → parser instance
 */
export class ParserRegistry {
  /** Full feature ID → dispatch entry. */
  private handlers = new Map<string, DispatchEntry>();

  /** Sheet slug → parser instance. */
  private parsers = new Map<string, IFeatureParser>();

  /**
   * Creates a new registry, optionally pre-registering parser classes.
   *
   * @param {Function[]} [parserClasses] - Array of `@parser`-decorated classes to register
   */
  constructor(parserClasses?: (new () => IFeatureParser)[]) {
    if (parserClasses) {
      for (const cls of parserClasses) {
        this.register(cls);
      }
    }
  }

  /**
   * Registers a `@parser`-decorated class into the dispatch maps.
   *
   * @param {new () => IFeatureParser} ParserClass - The decorated parser class constructor
   * @throws {Error} If the class is missing the `@parser()` decorator
   */
  register(ParserClass: new () => IFeatureParser): void {
    const sheetSlug = (ParserClass as unknown as Record<symbol, string>)[
      PARSER_SHEET_KEY
    ];
    if (!sheetSlug) {
      throw new Error(
        `Class ${ParserClass.name} is missing the @parser() decorator`,
      );
    }

    const instance = new ParserClass();
    instance.sheetSlug = sheetSlug;
    this.parsers.set(sheetSlug, instance);

    const entries: HandlerEntry[] =
      (ParserClass as any as Record<symbol, HandlerEntry[]>)[HANDLER_MAP_KEY] ??
      [];

    for (const entry of entries) {
      const fullId = `${sheetSlug}/${entry.featureId}`;
      this.handlers.set(fullId, {
        parser: instance,
        methodName: entry.methodName,
      });
    }
  }

  /**
   * Dispatches a feature to its registered handler method.
   *
   * @param {string} featureId - Full feature ID (e.g. "war-goddess-yskeia/faterender-railgun-recharge-6")
   * @param {string} body - Raw MDX body text of the feature
   * @returns {FoundryItemOverrides | null} Item overrides from the handler, or null if no handler exists
   */
  dispatch(featureId: string, body: string): FoundryItemOverrides | null {
    const entry = this.handlers.get(featureId);
    if (!entry) return null;

    const method = (entry.parser as any as Record<string, Function>)[
      entry.methodName
    ];
    if (typeof method !== 'function') return null;

    return method.call(entry.parser, body) as FoundryItemOverrides;
  }

  /**
   * Checks whether a handler exists for the given feature ID.
   *
   * @param {string} featureId - Full feature ID to check
   * @returns {boolean} True if a handler is registered
   */
  has(featureId: string): boolean {
    return this.handlers.has(featureId);
  }

  /**
   * Returns all registered sheet slugs.
   *
   * @returns {string[]} Array of registered sheet slugs
   */
  get registeredSheets(): string[] {
    return [...this.parsers.keys()];
  }

  /**
   * Returns all registered feature IDs.
   *
   * @returns {string[]} Array of registered full feature IDs
   */
  get registeredFeatures(): string[] {
    return [...this.handlers.keys()];
  }
}
