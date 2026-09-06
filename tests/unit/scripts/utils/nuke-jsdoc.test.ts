/**
 * @fileoverview Tests for the JSDoc first-sentence nuker.
 *
 * @module tests/unit/scripts/utils/nuke-jsdoc.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { describe, expect, it } from 'vitest';
import {
  firstSentence,
  firstSentenceEnd,
  nukeSource,
  truncateJsdoc,
} from '../../../../scripts/utils/nuke-jsdoc.mjs';

const MONSTER = `/**
 * Header slots of a monster. The six ability scores are written as scores
 * alone; the card derives each modifier, so no sheet hand-maintains a number
 * arithmetic already knows. \`tierBonus\` derives from \`challenge\` on the same
 * principle and is written only where a sheet overrides it. \`saveDc\` is the
 * one fixed DC a sheet's effects share, and it is a number: a DC that is a
 * formula belongs in the prose of the block that uses it.
 */`;

describe('firstSentenceEnd', () => {
  it('cuts at the first terminator followed by whitespace or end', () => {
    expect(firstSentence('Foo bar. Baz qux.')).toBe('Foo bar.');
    expect(firstSentence('Foo bar?\nBaz.')).toBe('Foo bar?');
    expect(firstSentence('Foo bar!')).toBe('Foo bar!');
    expect(firstSentenceEnd('No terminator here')).toBe(-1);
  });

  it('ignores dots inside words, numbers and versions', () => {
    expect(firstSentence('Reads window.ik.ws at 1.5 seconds. Then more.')).toBe(
      'Reads window.ik.ws at 1.5 seconds.',
    );
    expect(firstSentence('Next.js 15 app. More.')).toBe('Next.js 15 app.');
  });

  it('skips backtick spans, fenced code and brace groups', () => {
    expect(firstSentence('Reads `a. b` then stops. More.')).toBe('Reads `a. b` then stops.');
    expect(firstSentence('See {@link Foo.bar} first. More.')).toBe('See {@link Foo.bar} first.');
    expect(firstSentence('```\nfoo. bar\n```\nDone. More.')).toBe('```\nfoo. bar\n```\nDone.');
    expect(firstSentence('{Record<string, { a: number }>} A map. More.')).toBe(
      '{Record<string, { a: number }>} A map.',
    );
    expect(firstSentenceEnd('Unclosed `span. More.')).toBe(-1);
  });

  it('keeps list markers, abbreviations and ellipses', () => {
    expect(firstSentenceEnd('Priority:\n1. Minor Action\n2. action\n- bullet')).toBe(-1);
    expect(firstSentence('Uses e.g. foo. Then bar.')).toBe('Uses e.g. foo.');
    expect(firstSentence('Loads foo... then bar. More.')).toBe('Loads foo...');
  });

  it('includes a closing quote or paren after the terminator', () => {
    expect(firstSentence('Prints "Done." Then more.')).toBe('Prints "Done."');
    expect(firstSentence('Clamps (to [0, 1].) Then more.')).toBe('Clamps (to [0, 1].)');
  });
});

describe('truncateJsdoc', () => {
  it('cuts a description to its first sentence', () => {
    expect(truncateJsdoc(MONSTER)).toBe(`/**
 * Header slots of a monster.
 */`);
  });

  it('cuts every tag and keeps the blank line before the tags', () => {
    const block = `/**
 * Cells of a markdown table row. Trims each one.
 *
 * @param {string} line - Table row. Leading pipe optional.
 * @param {number} [limit] - Max cells
 * @returns {string[]} Trimmed cells. Empty for a blank row.
 */`;
    expect(truncateJsdoc(block)).toBe(`/**
 * Cells of a markdown table row.
 *
 * @param {string} line - Table row.
 * @param {number} [limit] - Max cells
 * @returns {string[]} Trimmed cells.
 */`);
  });

  it('leaves @example whole, including decorators and lists inside it', () => {
    const block = `/**
 * Registers an entity. Called once.
 *
 * @example
 * \`\`\`ts
 * @Entity({ name: 'x' })
 * class X {}
 * \`\`\`
 * 1. First. Second.
 * @param {string} name - Name. Unique.
 */`;
    expect(truncateJsdoc(block)).toBe(`/**
 * Registers an entity.
 *
 * @example
 * \`\`\`ts
 * @Entity({ name: 'x' })
 * class X {}
 * \`\`\`
 * 1. First. Second.
 * @param {string} name - Name.
 */`);
  });

  it('keeps a @description list and a one-sentence block untouched', () => {
    const list = `/**
 * Parses casting time.
 *
 * @description Priority, first match wins:
 * 1. Minor Action
 * 2. action
 */`;
    expect(truncateJsdoc(list)).toBe(list);
    const heading = `/**
 * @fileoverview Tests for the helpers.
 * @description Tag printing, each pinned by the shapes the corpus writes.
 *
 * @module tests/unit/x.test
 * @version 0.1.0
 * @since 2026-09-05
 */`;
    expect(truncateJsdoc(heading)).toBe(heading);
  });

  it('drops blank lines inside a cut description', () => {
    const block = `/**
 * First. Second.
 *
 * Third paragraph.
 *
 * @returns {number} N
 */`;
    expect(truncateJsdoc(block)).toBe(`/**
 * First.
 *
 * @returns {number} N
 */`);
  });

  it('handles single-line, inline-head and inline-closing shapes', () => {
    expect(truncateJsdoc('/** Foo. Bar. */')).toBe('/** Foo. */');
    expect(truncateJsdoc('/** @type {Foo} */')).toBe('/** @type {Foo} */');
    expect(truncateJsdoc('/**/')).toBe('/**/');
    expect(truncateJsdoc('/** Foo. Bar\n * baz. */')).toBe('/** Foo. */');
    expect(truncateJsdoc('/**\n   * Foo. Bar. */')).toBe('/**\n   * Foo. */');
  });

  it('keeps indentation and CRLF line endings', () => {
    const block = '/**\r\n     * Foo. Bar.\r\n     * @param {string} a - A. B.\r\n     */';
    expect(truncateJsdoc(block)).toBe(
      '/**\r\n     * Foo.\r\n     * @param {string} a - A.\r\n     */',
    );
  });

  it('returns a block it cannot parse unchanged', () => {
    const odd = '/**\nFoo. Bar.\n*/';
    expect(truncateJsdoc(odd)).toBe(odd);
  });
});

describe('nukeSource', () => {
  it('cuts every JSDoc block in a file and counts them', () => {
    const source = `${MONSTER}
export const A = 1;

/** One. Two. */
export const B = 2;

/** Only one sentence. */
export const C = 3;
`;
    const result = nukeSource(source, 'x.ts');
    expect(result.count).toBe(2);
    expect(result.changed).toBe(true);
    expect(result.text).toBe(`/**
 * Header slots of a monster.
 */
export const A = 1;

/** One. */
export const B = 2;

/** Only one sentence. */
export const C = 3;
`);
  });

  it('leaves plain comments, strings, templates, regexes and JSX text alone', () => {
    const source = `// Line comment. Stays. /** not a doc. Nope. */
/* Block. Stays. */
const s = '/** in string. Stays. */';
const t = \`
/**
 * Fixture. Stays whole.
 */
\${1}
/** Second fixture. Stays. */
\`;
const r = /\\/\\*\\*. x. \\*\\//;
const j = <div>/** jsx text. Stays. */</div>;
/** Real. Cut. */
export const x = { s, t, r, j };
`;
    const result = nukeSource(source, 'x.tsx');
    expect(result.count).toBe(1);
    expect(result.text).toBe(source.replace('/** Real. Cut. */', '/** Real. */'));
  });

  it('reports an untouched file', () => {
    const source = '/** Fine. */\nexport const a = 1;\n';
    expect(nukeSource(source, 'a.mjs')).toEqual({ text: source, changed: false, count: 0 });
  });
});
