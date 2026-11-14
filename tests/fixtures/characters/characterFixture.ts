/**
 * @fileoverview Character fixture format for agent test prompts, plus a loader that validates it.
 *
 * @module tests/fixtures/characters/characterFixture
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import type {
  BuilderFlagCode,
  BuilderPayload,
} from '@/modules/character-builder/application/builderCore/types';

/**
 * Expected outcomes; every field optional and empty until the owner fills it.
 *
 * @interface CharacterExpectations
 * @property {{ include?: BuilderFlagCode[]; exclude?: BuilderFlagCode[] }} [flags] - Flag codes that must or must not appear
 * @property {Record<string, unknown>} [state] - Partial state matched with `toMatchObject`
 * @property {Record<string, unknown>} [character] - Partial character matched with `toMatchObject`
 * @property {string[]} [notes] - Exact build notes expected from the API
 */
export interface CharacterExpectations {
  flags?: { include?: BuilderFlagCode[]; exclude?: BuilderFlagCode[] };
  state?: Record<string, unknown>;
  character?: Record<string, unknown>;
  notes?: string[];
}

/**
 * One character fixture file.
 *
 * @interface CharacterFixture
 * @property {string} id - Kebab id; matches the file name without `.character.json`
 * @property {string} descriptor - Free-text character description supplied by the owner
 * @property {BuilderPayload | null} payload - Structured payload an agent derives from the descriptor; null until then
 * @property {CharacterExpectations} expected - Expected outcomes; `{}` until the owner fills them
 * @property {string} file - Absolute path, added by the loader
 */
export interface CharacterFixture {
  id: string;
  descriptor: string;
  payload: BuilderPayload | null;
  expected: CharacterExpectations;
  file: string;
}

/** Directory holding `*.character.json` fixtures. */
export const CHARACTER_FIXTURE_DIR = path.resolve(__dirname);

/** Fixture file suffix. */
export const CHARACTER_FIXTURE_SUFFIX = '.character.json';

/**
 * Validates one parsed fixture.
 *
 * @function validateFixture
 * @param {unknown} raw - Parsed JSON
 * @param {string} file - Source path for messages
 * @returns {CharacterFixture} Valid fixture
 * @throws {Error} When a required field is missing or mistyped
 */
export function validateFixture(raw: unknown, file: string): CharacterFixture {
  const fail = (why: string): never => {
    throw new Error(`${path.basename(file)}: ${why}`);
  };
  if (typeof raw !== 'object' || raw === null) fail('must be a JSON object');
  const value = raw as Record<string, unknown>;
  const expectedId = path.basename(file).replace(CHARACTER_FIXTURE_SUFFIX, '');
  if (value.id !== expectedId) fail(`id must equal "${expectedId}"`);
  if (typeof value.descriptor !== 'string') fail('descriptor must be a string');
  if (value.payload !== null && typeof value.payload !== 'object') {
    fail('payload must be an object or null');
  }
  if (typeof value.expected !== 'object' || value.expected === null) {
    fail('expected must be an object ({} when empty)');
  }
  return {
    id: value.id as string,
    descriptor: value.descriptor as string,
    payload: (value.payload as BuilderPayload | null) ?? null,
    expected: value.expected as CharacterExpectations,
    file,
  };
}

/**
 * Loads every `*.character.json` fixture; files starting with `_` are templates and skipped.
 *
 * @function loadCharacterFixtures
 * @param {string} [dir] - Directory (default {@link CHARACTER_FIXTURE_DIR})
 * @returns {CharacterFixture[]} Fixtures sorted by id
 */
export function loadCharacterFixtures(dir: string = CHARACTER_FIXTURE_DIR): CharacterFixture[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(CHARACTER_FIXTURE_SUFFIX) && !name.startsWith('_'))
    .sort()
    .map((name) => {
      const file = path.join(dir, name);
      return validateFixture(JSON.parse(readFileSync(file, 'utf8')), file);
    });
}
