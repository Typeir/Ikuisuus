/**
 * @fileoverview Vocation progression checks against the server's view of a
 * client component.
 * @description On the server a `'use client'` component arrives as a client
 * reference, so an element's `type` carries no usable name. Anything that
 * recognises a child by component identity goes blind there, while the props
 * and the attributes the compiler stamps survive
 *
 * @module tests/unit/src/modules/library/slots/vocationProgressionServer.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-10
 */

import Feature from '@/modules/library/presentation/components/slots/feature/Feature';
import { Column } from '@/modules/library/presentation/components/slots/vocation/Progression';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { compileSource } from './harness';

/**
 * A component whose name cannot be read, the way a client reference arrives on
 * the server. It still renders the component it wraps.
 *
 * @param {React.ComponentType} component - Component to hide behind
 * @returns {React.ComponentType} Anonymous wrapper
 */
function anonymous(component: React.ComponentType<never>): React.ComponentType<never> {
  const Wrapper = (props: never) => React.createElement(component, props);
  Object.defineProperty(Wrapper, 'name', { value: '' });
  return Wrapper;
}

/** A vocation page, as berserker and scion are written. */
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

/**
 * Renders the page with the named components hidden behind an anonymous
 * wrapper.
 *
 * @param {Record<string, React.ComponentType<never>>} hidden - Components to hide
 * @returns {Promise<string>} The progression table
 */
async function tableWithHiddenIdentity(
  hidden: Record<string, React.ComponentType<never>>,
): Promise<string> {
  const content = await compileSource(VOCATION, { components: hidden });
  return progressionTable(renderToStaticMarkup(content));
}

describe('vocation progression on the server', () => {
  it('names the features and the declared columns without component identity', async () => {
    const table = await tableWithHiddenIdentity({
      Feature: anonymous(Feature),
      Column: anonymous(Column),
    });

    expect(table).toContain('Abandon');
    expect(table).toContain('Reckless Abandon');
    expect(table).toContain('Reckless Attack');
  });
});
