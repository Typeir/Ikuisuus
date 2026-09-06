/**
 * @fileoverview Tests for the trinket converter.
 * @description The category line and the bold stat lines become the
 * `<Trinket>` tag; a stat the schema does not name stays in the body.
 *
 * @module tests/unit/scripts/content/migrate-trinket.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { describe, expect, it } from 'vitest';
import { migrateTrinket } from '../../../../scripts/content/migrate-trinket.mjs';

const TRINKET = `---
source: Ikuisuus
contentType: trinkets
---

# Bola
Adventuring Gear

A set of weighted cords designed to entangle.
As a Major Action, you can throw the bola.

**Damage**: —
**Properties**: Thrown, Special (restrain, trip)
**Range**: 30/60
**Weight**: [= 1 burden =].
`;

describe('migrateTrinket', () => {
  it('moves category and stat lines into the tag', () => {
    const result = migrateTrinket(TRINKET);
    expect(result.notes).toEqual([]);
    expect(result.text).toBe(`---
source: Ikuisuus
contentType: trinkets
---

# Bola

<Trinket
  category="Adventuring Gear"
  damage="—"
  range="30/60"
  properties="Thrown, Special (restrain, trip)"
  burden="[= 1 burden =]">

A set of weighted cords designed to entangle.
As a Major Action, you can throw the bola.

</Trinket>
`);
  });

  it('reads a category after a blank line and keeps Damage Type as prose', () => {
    const text = TRINKET.replace('# Bola\nAdventuring Gear\n', '# Basic Poison\n\nAdventuring Gear\n').replace(
      '**Damage**: —',
      '**Damage**: [% 1d4 %]\n**Damage Type**: Poison',
    );
    const result = migrateTrinket(text);
    expect(result.text).toContain('# Basic Poison\n\n<Trinket\n  category="Adventuring Gear"\n  damage="[% 1d4 %]"');
    expect(result.text).toContain('throw the bola.\n\n**Damage Type**: Poison\n\n</Trinket>');
    expect(result.notes).toEqual(['stat line kept as prose: **Damage Type**: Poison']);
  });

  it('keeps a second stat line of the same name as prose', () => {
    const result = migrateTrinket(TRINKET + '**Range**: 60/120  \n');
    expect(result.text).toContain('range="30/60"');
    expect(result.text).toContain('**Range**: 60/120');
    expect(result.notes).toEqual(['second Range line kept as prose']);
  });

  it.each([
    ['already on the slot form', TRINKET.replace('Adventuring Gear', '<Trinket category="Adventuring Gear">')],
    ['no stat lines', '---\n---\n\n# Plain\n\nProse only.\n'],
  ])('skips with "%s"', (reason, text) => {
    const result = migrateTrinket(text);
    expect(result.changed).toBe(false);
    expect(result.skipped).toBe(reason);
  });
});
