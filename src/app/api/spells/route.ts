/**
 * @fileoverview Spells API Route - Spell metadata JSON endpoint for SpellTable
 * @description Next.js API route that serves spell metadata via the content adapter
 * layer. Supports locale-aware content via ?locale query parameter. Returns array of
 * spell objects with level, school, casting time, components, and concentration
 * requirements. Used by SpellTableWrapper for client-side data fetching.
 *
 * Accepts an optional `filters` array of `FilterExpression` objects. Filter
 * fields are checked against a per-route allow-list as a security boundary
 * against arbitrary entity-field probing from untrusted POST bodies.
 *
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires next/server
 * @requires @/lib/db/content
 *
 * @example
 * ```typescript
 * // Damocles-only filter
 * await fetch('/api/spells', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     locale: 'en',
 *     filters: [{ field: 'source', operator: 'neq', value: 'basic' }],
 *   }),
 * });
 * ```
 * @module src/app/api/spells/route
 */
import {
  applyFiltersInMemory,
  isFilterExpressionArray,
  type FilterExpression,
} from '@/lib/db/content/filters';
import { spellRepository } from '@/lib/db/content/repositories/spellRepository';
import type { SpellMetadata } from '@/lib/db/content/schemas/spellMetadata';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Spells:List' });

/**
 * Allow-list of filter fields exposed by this route. Any incoming filter
 * targeting a field outside this set is rejected with 400 to prevent
 * arbitrary entity-field probing.
 *
 * @type {ReadonlySet<string>}
 */
const ALLOWED_FILTER_FIELDS: ReadonlySet<string> = new Set([
  'source',
  'school',
  'concentration',
  'level',
]);

/**
 * Validates that every filter expression targets an allow-listed field.
 *
 * @param {FilterExpression[]} filters - Parsed filter expressions.
 * @returns {string | null} Disallowed field name on rejection, otherwise `null`.
 */
const findDisallowedField = (filters: FilterExpression[]): string | null => {
  for (const expr of filters) {
    if (!ALLOWED_FILTER_FIELDS.has(expr.field)) {
      return expr.field;
    }
  }
  return null;
};

/**
 * Removes duplicate spells by slug, preserving first-seen order. Used when
 * merging results from multiple vocation spell lists.
 *
 * @param {SpellMetadata[]} spells - Spells that may include cross-list duplicates
 * @returns {SpellMetadata[]} Spells unique by slug
 */
const dedupeBySlug = (spells: SpellMetadata[]): SpellMetadata[] => {
  const bySlug = new Map<string, SpellMetadata>();
  for (const spell of spells) {
    if (!bySlug.has(spell.slug)) bySlug.set(spell.slug, spell);
  }
  return [...bySlug.values()];
};

/**
 * POST /api/spells
 *
 * Returns array of spell metadata from the active content repository.
 * Accepts optional locale, spells slug array, listSource, and filters.
 *
 * Branching precedence:
 *   1. `listSources` (or single `listSource`) → merged `listBySource` per source,
 *      deduped by slug, then in-memory filter pass.
 *   2. `spells` slugs → `listBySlugs(locale, spells)` then in-memory filter pass.
 *   3. Otherwise → `list(locale, filters)` (filters pushed to repository).
 *
 * @param {Request} req - Next.js request object
 * @returns {Promise<NextResponse>} JSON array of spell objects
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const locale = body.locale || 'en';
  const spellSlugs: string[] | undefined = body.spells;
  const listSource: string | undefined = body.listSource;
  const listSources: string[] | undefined = Array.isArray(body.listSources)
    ? body.listSources.filter((s: unknown): s is string => typeof s === 'string')
    : undefined;

  let filters: FilterExpression[] | undefined;
  if (body.filters !== undefined) {
    if (!isFilterExpressionArray(body.filters)) {
      return NextResponse.json(
        { error: 'Invalid filters payload' },
        { status: 400 },
      );
    }
    const disallowed = findDisallowedField(body.filters);
    if (disallowed !== null) {
      return NextResponse.json(
        { error: `Filter field not allowed: ${disallowed}` },
        { status: 400 },
      );
    }
    filters = body.filters;
  }

  const sources =
    listSources && listSources.length > 0
      ? listSources
      : listSource
        ? [listSource]
        : undefined;

  try {
    let spells;
    if (sources) {
      const perSource = await Promise.all(
        sources.map((s) => spellRepository.listBySource(locale, s)),
      );
      const merged = dedupeBySlug(perSource.flat());
      spells = filters ? applyFiltersInMemory(merged, filters) : merged;
    } else if (spellSlugs && spellSlugs.length > 0) {
      const slugSpells = await spellRepository.listBySlugs(locale, spellSlugs);
      spells = filters ? applyFiltersInMemory(slugSpells, filters) : slugSpells;
    } else {
      spells = await spellRepository.list(locale, filters);
    }
    return NextResponse.json(spells);
  } catch (error) {
    log.error('Error loading spell metadata', {
      error: error instanceof Error ? error.message : String(error),
      locale,
      spellCount: spellSlugs?.length,
      filterCount: filters?.length ?? 0,
    });
    return NextResponse.json(
      { error: 'Failed to load spells' },
      { status: 500 },
    );
  }
}
