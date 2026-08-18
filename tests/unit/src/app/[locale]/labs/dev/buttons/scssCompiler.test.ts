/**
 * @fileoverview Unit tests for compiled-CSS parsing helpers.
 * @description Covers rule extraction from compiled output and the merge that turns
 * several rules for one class into a single base declaration block.
 *
 * @module tests/unit/src/app/[locale]/labs/dev/buttons/scssCompiler.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/app/[locale]/labs/dev/buttons/scssCompiler
 */

import {
  baseDeclarations,
  extractRules,
} from '@/app/[locale]/labs/dev/buttons/scssCompiler';
import { describe, expect, it } from 'vitest';

const CSS = [
  '/* a comment { not a rule } */',
  '.row { padding: 0.5rem; cursor: pointer; }',
  '.row:hover { background: red; }',
  '.panel .trigger { border: none; }',
  '@media (min-width: 40rem) { .row { padding: 1rem; } }',
].join('\n');

describe('extractRules', () => {
  it('returns one entry per rule', () => {
    expect(extractRules(CSS).map((r) => r.selector)).toContain('.row');
  });

  it('parses declarations into property and value pairs', () => {
    const row = extractRules(CSS).find((r) => r.selector === '.row');
    expect(row?.decls).toMatchObject({
      padding: '0.5rem',
      cursor: 'pointer',
    });
  });

  it('drops comments rather than parsing them as rules', () => {
    expect(
      extractRules(CSS).some((r) => r.selector.includes('a comment')),
    ).toBe(false);
  });

  it('keeps descendant selectors', () => {
    expect(extractRules(CSS).map((r) => r.selector)).toContain(
      '.panel .trigger',
    );
  });

  it('ignores a rule with no declarations', () => {
    expect(extractRules('.empty { }')).toEqual([]);
  });
});

describe('baseDeclarations', () => {
  const rules = extractRules(CSS);

  it('merges every exact-selector rule for the class', () => {
    expect(baseDeclarations(rules, 'row').cursor).toBe('pointer');
  });

  it('prefers exact selectors over descendant ones', () => {
    expect(baseDeclarations(rules, 'row').border).toBeUndefined();
  });

  it('falls back to a descendant selector when there is no exact rule', () => {
    expect(baseDeclarations(rules, 'trigger')).toEqual({ border: 'none' });
  });

  it('returns an empty block for an unknown class', () => {
    expect(baseDeclarations(rules, 'nope')).toEqual({});
  });
});
