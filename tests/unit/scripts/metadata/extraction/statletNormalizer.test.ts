/**
 * @fileoverview Statlet Normalizer Tests
 * @description The three statlet dialects (bulleted labels, bare bold
 * paragraphs, headed colon-labels) all normalize to `## Section` +
 * `- **Name.** body` without changing the line count.
 *
 * @module tests/unit/scripts/metadata/extraction/statletNormalizer
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 */

import { normalizeStatlet } from '@scripts/metadata/extraction/statletNormalizer';
import { describe, expect, it } from 'vitest';

const run = (src: string[]): string[] => {
  const lines = [...src];
  normalizeStatlet(lines, 0, lines.length);
  return lines;
};

describe('normalizeStatlet', () => {
  it('should preserve line count in every dialect', () => {
    for (const src of [ALBEDO, PLATO, YSKEIA]) {
      expect(run(src)).toHaveLength(src.length);
    }
  });

  it('should blank the title heading and open Traits over the blank line before the first feature (albedo)', () => {
    const out = run(ALBEDO);
    expect(out[0]).toBe('');
    expect(out[8]).toBe('## Actions');
    expect(out[9]).toBe('- **Claw.** _Melee Weapon Attack:_ +11 to hit');
    expect(out[10]).toBe('- **Deathburst.** When reduced to 0 HP');
  });

  it('should keep stat lines untouched', () => {
    const out = run(ALBEDO);
    expect(out[6]).toBe('- **Resistances**: Chemical, Dark;');
    expect(out[7]).toBe('- **Senses**: Blindsight [= 6 stride =]');
  });

  it('should bullet bare bold paragraphs and open an implicit Traits section (plato)', () => {
    const out = run(PLATO);
    expect(out[5]).toBe('## Traits');
    expect(out[6]).toBe("- **Guardian's Instinct.**");
    expect(out[8]).toBe('- **Construct Nature.**');
  });

  it('should lift H4/H5 section headings to H2 and accept colon labels under them (yskeia)', () => {
    const out = run(YSKEIA);
    expect(out[0]).toBe('');
    expect(out[8]).toBe('## Traits');
    expect(out[10]).toBe(
      '- **Infallible.** The Primeval Plating cannot be targeted.',
    );
  });

  it('should ignore colon labels before any section opens', () => {
    const out = run(['#### Pipe', '', '- **Size**: Huge', '- **Material**: Iron']);
    expect(out.slice(2)).toEqual(['- **Size**: Huge', '- **Material**: Iron']);
  });

  it('should leave indented bold continuation lines alone (damage lines under an attack)', () => {
    const out = run([
      '### Girt',
      '',
      '- **Vile Star.**  ',
      '  _Ranged Weapon Attack:_ +10 to hit;',
      '  **26 ([% 2d12 +17 psychic %])**.  ',
    ]);
    expect(out[4]).toBe('  **26 ([% 2d12 +17 psychic %])**.  ');
  });
});

const ALBEDO = [
  '### **Petal**',
  '',
  '_Small Aberration_',
  '',
  '| **Armor Class** | **Hit Points** | **Speed** |',
  '| 15 | 40 | 8 |',
  '- **Resistances**: Chemical, Dark;',
  '- **Senses**: Blindsight [= 6 stride =]',
  '',
  '- **Actions — Claw.** _Melee Weapon Attack:_ +11 to hit',
  '- **Deathburst.** When reduced to 0 HP',
];

const PLATO = [
  '### Wax-Bound Homunculi',
  '',
  '| **Armor Class** | **Hit Points** | **Speed** |',
  '| 15 | 72 | 8 |',
  '- **Senses**: Darkvision',
  '',
  "**Guardian's Instinct.**  ",
  'Allies gain +1 AC.',
  '**Construct Nature.**  ',
  'Does not eat.',
];

const YSKEIA = [
  '#### Primeval Plating',
  '',
  '| **Armor Class** | **Hit Points** | **Damage Threshold** |',
  '| 30 | 100 | 25 |',
  '',
  '- **Size**: Medium object',
  '- **Resistances**: All damage except **Force**',
  '',
  '##### Traits',
  '',
  '**Infallible**: The Primeval Plating cannot be targeted.',
];
