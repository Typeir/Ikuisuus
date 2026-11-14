/**
 * @fileoverview Request parsing and response helpers shared by the dev builder routes.
 *
 * @module modules/character-builder/infrastructure/devApi/devApiHttp
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import 'server-only';

import { isSupportedLocale } from '@/lib/constants/locales';
import { isDevBuilderApiEnabled } from '@/lib/debug/devBuilderGate';
import { logger } from '@/lib/logging/logger';
import type { CharacterSheet } from '@/lib/types/character';
import { computeBuilderFlags } from '@/modules/character-builder/application/builderCore/builderFlags';
import { computeBuilderState } from '@/modules/character-builder/application/builderCore/builderState';
import type {
  BuilderSnapshot,
  CarryOptions,
} from '@/modules/character-builder/application/builderCore/types';
import { isCharacterEntity } from '@/modules/character-builder/domain/character/characterEntity';
import {
  migrateCharacter,
  type LegacyCharacter,
} from '@/modules/character-builder/lib/utils/characterMigration';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Dev:Builder' });

/**
 * Error raised for a malformed request; maps to HTTP 400.
 *
 * @class BadRequestError
 */
export class BadRequestError extends Error {}

/**
 * Returns a 404 response when the dev builder API is off; null when on.
 *
 * @function gateResponse
 * @returns {NextResponse | null} 404 response, or null
 */
export function gateResponse(): NextResponse | null {
  if (isDevBuilderApiEnabled()) return null;
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

/**
 * Reads a JSON object body.
 *
 * @async
 * @function readBody
 * @param {Request} req - Request
 * @returns {Promise<Record<string, unknown>>} Parsed body
 * @throws {BadRequestError} When the body is not a JSON object
 */
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const body: unknown = await req.json().catch(() => null);
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestError('Body must be a JSON object');
  }
  return body as Record<string, unknown>;
}

/**
 * Reads and checks the `locale` field.
 *
 * @function readLocale
 * @param {Record<string, unknown>} body - Request body
 * @returns {string} Locale (default `en`)
 * @throws {BadRequestError} When the locale is unsupported
 */
export function readLocale(body: Record<string, unknown>): string {
  const locale = typeof body.locale === 'string' ? body.locale : 'en';
  if (!isSupportedLocale(locale)) {
    throw new BadRequestError(`Unsupported locale: ${locale}`);
  }
  return locale;
}

/**
 * Reads the `character` field and migrates it like the roster does on load.
 *
 * @function readCharacter
 * @param {Record<string, unknown>} body - Request body
 * @returns {CharacterSheet} Migrated character
 * @throws {BadRequestError} When `character` is missing or not an entity
 */
export function readCharacter(body: Record<string, unknown>): CharacterSheet {
  if (!isCharacterEntity(body.character)) {
    throw new BadRequestError('Missing or invalid field: character');
  }
  return migrateCharacter(body.character as unknown as LegacyCharacter);
}

/**
 * Reads the optional `carry` field.
 *
 * @function readCarry
 * @param {Record<string, unknown>} body - Request body
 * @returns {CarryOptions | undefined} Carry inputs, or undefined
 */
export function readCarry(body: Record<string, unknown>): CarryOptions | undefined {
  const carry = body.carry;
  return typeof carry === 'object' && carry !== null ? (carry as CarryOptions) : undefined;
}

/**
 * Reads the optional `threshold` field.
 *
 * @function readThreshold
 * @param {Record<string, unknown>} body - Request body
 * @returns {number | undefined} Ambiguity gap in [0, 1], or undefined
 */
export function readThreshold(body: Record<string, unknown>): number | undefined {
  const value = body.threshold;
  return typeof value === 'number' && value >= 0 && value <= 1 ? value : undefined;
}

/**
 * Builds the character, state, and flags snapshot.
 *
 * @function snapshotOf
 * @param {CharacterSheet} character - Character
 * @param {CarryOptions} [carry] - Carry inputs
 * @returns {BuilderSnapshot} Snapshot
 */
export function snapshotOf(
  character: CharacterSheet,
  carry?: CarryOptions,
): BuilderSnapshot {
  return {
    character,
    state: computeBuilderState(character, carry),
    flags: computeBuilderFlags(character, carry),
  };
}

/**
 * Runs a route body with the gate and maps errors to 400 or 500.
 *
 * @async
 * @function handle
 * @param {string} action - Action name for logs
 * @param {() => Promise<unknown>} run - Route body returning the JSON payload
 * @returns {Promise<NextResponse>} JSON response
 */
export async function handle(
  action: string,
  run: () => Promise<unknown>,
): Promise<NextResponse> {
  const gated = gateResponse();
  if (gated) return gated;
  try {
    return NextResponse.json(await run(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    log.error(`Dev builder ${action} failed`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: `Failed to ${action}` }, { status: 500 });
  }
}
