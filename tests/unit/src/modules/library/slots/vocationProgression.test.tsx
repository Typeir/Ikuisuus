/**
 * @fileoverview Vocation progression table checks.
 * @description The Features column is built from the Feature blocks the page
 * carries, so the table and the cards beneath it must agree
 *
 * @module tests/unit/src/modules/library/slots/vocationProgression.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-10
 */

import { describe, expect, it } from 'vitest';
import { renderSource } from './harness';

/**
 * A vocation page in the shape berserker and scion are written in: the traits
 * table, a declared progression, then the feature cards.
 */
const VOCATION = `<Vocation hitDie="d12">

## Core Berserker Traits

| Trait               | Description |
| ------------------- | ----------- |
| **Primary Ability** | Strength    |

---

## Berserker Vocation Features

<Progression feats="4" specialization="6">

  <Column label="Abandon" values="12, 14, 18, 20, 22, 24" />

</Progression>

---

<Feature collapsible level="1">

## Reckless Abandon

You hold a reserve of ruinous want.

</Feature>

<Feature collapsible level="2">

## Reckless Attack

You can throw caution aside.

</Feature>

<Feature collapsible level="5">

## Extra Attack

You attack twice.

</Feature>

</Vocation>
`;

/**
 * The progression table out of a rendered page.
 *
 * @param {string} html - Static markup
 * @returns {string} The table, or an empty string when none rendered
 */
function progressionTable(html: string): string {
  return html.match(/<table[^>]*data-progression[\s\S]*?<\/table>/)?.[0] ?? '';
}

describe('vocation progression features', () => {
  it('names every feature card at the level the card declares', async () => {
    const html = await renderSource(VOCATION);
    const table = progressionTable(html);

    expect(table, 'no progression table rendered').not.toBe('');
    expect(table).toContain('Reckless Abandon');
    expect(table).toContain('Reckless Attack');
    expect(table).toContain('Extra Attack');
  });

  it('keeps each feature on its own row', async () => {
    const table = progressionTable(await renderSource(VOCATION));

    const rows = table.split('<tr');
    const rowOf = (name: string): string =>
      rows.find((row) => row.includes(name)) ?? '';

    expect(rowOf('Reckless Abandon')).toContain('>1<');
    expect(rowOf('Reckless Attack')).toContain('>2<');
    expect(rowOf('Extra Attack')).toContain('>5<');
  });

  it('prints the declared columns beside the features', async () => {
    const table = progressionTable(await renderSource(VOCATION));

    expect(table).toContain('Abandon');
    expect(table).toContain('12');
  });
});
