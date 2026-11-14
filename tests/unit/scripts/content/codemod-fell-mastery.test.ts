/**
 * @fileoverview Tests for the Topple to Fell codemod.
 * @description Each rule rewrites its own site, and feature headings and plain English stay.
 *
 * @module tests/unit/scripts/content/codemod-fell-mastery.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-11-11
 */

import { describe, expect, it } from 'vitest';
import {
  SHARED_DATA,
  residualWords,
  run,
  transformLine,
} from '../../../../scripts/content/codemod-fell-mastery.mjs';

const MDX = 'src/content/en/probe.mdx';

describe('transformLine', () => {
  it.each([
    ['  - topple: Masteries', '  - fell: Masteries', 'keyword'],
    ['  mastery="Topple"', '  mastery="Fell"', 'prop'],
    ['| Bracing | Hafted | Pointed | Topple | Anchor |', '| Bracing | Hafted | Pointed | Fell | Anchor |', 'table-cell'],
    ['| Spear | Familiar | Topple, Anchor | Flaying |', '| Spear | Familiar | Fell, Anchor | Flaying |', 'table-cell'],
    ['| Topple | If you hit a creature |', '| Fell | If you hit a creature |', 'table-cell'],
    ['gain the Topple mastery: the target', 'gain the Fell mastery: the target', 'prose'],
    ['already has the **Topple** mastery', 'already has the **Fell** mastery', 'prose'],
    ['use the [_Topple_](/en/x/weapon-arts#masteries) mastery', 'use the [_Fell_](/en/x/weapon-arts#masteries) mastery', 'link'],
  ])('rewrites %s', (line, expected, rule) => {
    const result = transformLine(MDX, line);
    expect(result.line).toBe(expected);
    expect(result.hits).toContain(rule);
  });

  it('rewrites the shared-data list entry only in shared-data', () => {
    expect(transformLine(SHARED_DATA, '      "topple",').line).toBe('      "fell",');
    expect(transformLine(MDX, '      "topple",').hits).toEqual([]);
  });

  it.each([
    '### Topple',
    '#### Topple',
    'ruin or topple the entire object',
    'the tower toppled',
  ])('leaves %s', (line) => {
    expect(transformLine(MDX, line)).toEqual({ line, hits: [] });
  });
});

describe('residualWords', () => {
  it('finds inflected forms', () => {
    expect(residualWords('it topples, toppled, toppling')).toEqual(['topples', 'toppled', 'toppling']);
  });
});

describe('run', () => {
  it('keeps line endings and lists untouched forms', () => {
    const text = '### Topple\r\n\r\nYour strikes gain the Topple mastery.\r\n';
    const result = run([MDX], () => text);
    expect(result.edits[0].after).toBe('### Topple\r\n\r\nYour strikes gain the Fell mastery.\r\n');
    expect(result.sites).toEqual([{ path: MDX, line: 3, rule: 'prose' }]);
    expect(result.residual.map((hit) => hit.line)).toEqual([1]);
  });
});
