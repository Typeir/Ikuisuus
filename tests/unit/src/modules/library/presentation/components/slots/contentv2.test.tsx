/**
 * @fileoverview Unit tests that cut across the content-v2 card hosts.
 * @description The trinket kind of the item card, deed-costed blocks, and the
 * item slot layout. Each host's own behaviour lives in its own test file.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/contentv2.test
 * @version 0.2.0
 * @author Typeir
 * @since 2026-09-04
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { Action } from '@/modules/library/presentation/components/slots/Feature';
import { Trinket } from '@/modules/library/presentation/components/slots/Heirloom';
import { briefText, printed } from './cardQueries';

describe('Trinket', () => {
  it('names its category and prints what it carries', () => {
    render(
      <Trinket
        category='adventuring gear'
        cost='1 Minor Action'
        damage='—'
        range='touch'
        properties='Special (healing, consumable)'
        burden='3 burden'>
        <p>A stoppered vial.</p>
      </Trinket>,
    );
    expect(briefText('data-heirloom-brief')).toBe('Adventuring gear');
    expect(printed()).toEqual([
      'cost',
      'damage',
      'range',
      'properties',
      'burden',
    ]);
  });

  it('adds attunement to the brief when the trinket wants it', () => {
    render(<Trinket category='wondrous item' attunement='required' />);
    expect(briefText('data-heirloom-brief')).toBe(
      'Wondrous item, requiresAttunement',
    );
  });

  it('prints an armor class, reach and save DC', () => {
    render(
      <Trinket category='shield' armorClass='+2' reach='2 stride' saveDc='14' />,
    );
    expect(printed()).toEqual(['reach', 'armorClass', 'saveDc']);
  });

  it('reads attunement written with the phrase the card already prints', () => {
    render(<Trinket category='helm' attunement='requires attunement by a hunter' />);
    expect(briefText('data-heirloom-brief')).toBe(
      'Helm, requiresAttunement by a hunter',
    );
  });

  it('reads a bare attunement flag', () => {
    render(<Trinket category='helm' attunement />);
    expect(briefText('data-heirloom-brief')).toBe('Helm, requiresAttunement');
  });
});

describe('deed costs', () => {
  it('marks a deed-costed block apart from the action costs', () => {
    const { container } = render(
      <>
        <Action cost='2 Deeds'>
          <h4>Pungent Mist</h4>
        </Action>
        <Action cost='1 Major Action'>
          <h4>Multiattack</h4>
        </Action>
      </>,
    );
    const marks = Array.from(container.querySelectorAll('article')).map(
      (node) => node.getAttribute('data-mark'),
    );
    expect(marks).toEqual(['deed', 'major']);
  });

  it('reads the bare word: a legendary deed is a deed from a refreshing pool', () => {
    for (const cost of ['1 Deed', '2 Deeds', '3 Deeds', '1 Legendary Deed']) {
      const { container } = render(
        <Action cost={cost}>
          <h4>Probe</h4>
        </Action>,
      );
      expect(
        container.querySelector('article')?.getAttribute('data-mark'),
        cost,
      ).toBe('deed');
    }
  });

  it('leaves a cost that merely mentions a deed alone', () => {
    const { container } = render(
      <Action cost='1 Major Action'>
        <h4>Probe</h4>
      </Action>,
    );
    expect(container.querySelector('article')?.getAttribute('data-mark')).toBe(
      'major',
    );
  });
});
