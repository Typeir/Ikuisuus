/**
 * @fileoverview Where the compiler puts a sheet's sections when sheets nest.
 * @description The creature swapper is a sheet whose pages each hold a sheet
 * of their own.
 *
 * @module tests/unit/src/modules/library/slots/slots.nested.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-09
 */

import { describe, expect, it } from 'vitest';
import { renderSource } from './harness';

const SOURCE = `---
source: Ikuisuus
contentType: monsters
sectionize: true
---

# Two Creatures

<Sheet foot level="1">

# Creature One

<Monster size="Medium" type="Construct">

---

<Sheet>

## Traits

<Trait>

#### Sturdy

It stands.

</Trait>

## Features

<Feature>

#### Shove

It shoves.

</Feature>

</Sheet>

</Monster>

# Creature Two

<Monster size="Small" type="Construct">

<Sheet>

## Traits

<Trait>

#### Quick

It moves.

</Trait>

</Sheet>

</Monster>

</Sheet>
`;

describe('a sheet whose pages hold sheets', () => {
  it('names every creature on the swapper bar', async () => {
    const html = await renderSource(SOURCE);
    expect(html).toMatch(/Creature One/);
    expect(html).toMatch(/Creature Two/);
  });

  it('gives every creature an inner bar of its own', async () => {
    const html = await renderSource(SOURCE);
    const bars = html.match(/aria-label="Sections"/g) ?? [];
    /* The outer sheet, and one inside each creature. */
    expect(bars).toHaveLength(3);
  });

  it('writes every creature out', async () => {
    const html = await renderSource(SOURCE);
    const pages = html.match(/data-sheet-page/g) ?? [];
    expect(pages.length).toBeGreaterThan(2);
    expect(html).toMatch(/Creature Two/);
  });

  it('hides none of them', async () => {
    const html = await renderSource(SOURCE);
    expect(html).not.toMatch(/hidden="until-found"/);
  });
});
