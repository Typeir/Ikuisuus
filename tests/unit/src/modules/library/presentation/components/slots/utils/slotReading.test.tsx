/**
 * @fileoverview Unit tests for the slot reading helpers.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/utils/slotReading.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-24
 */

import { SLOT_NAME_ATTRIBUTE } from '@/lib/md/desugarSlotAttributes';
import {
  Cost,
  Targets,
} from '@/modules/library/presentation/components/slots/utils/slotElements';
import {
  cleanChildren,
  collectSlotEntries,
  inlineValue,
  isSlotNode,
  readSlots,
  slotNameOf,
  splitSlotRuns,
} from '@/modules/library/presentation/components/slots/utils/slotReading';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('slotNameOf', () => {
  it('reads the slot name from a slot element', () => {
    expect(slotNameOf(<Cost>1 Major Action</Cost>)).toBe('cost');
    expect(isSlotNode(<Targets>one creature</Targets>)).toBe(true);
  });

  it('names nothing for text and plain elements', () => {
    expect(slotNameOf('text')).toBeNull();
    expect(slotNameOf(<p>prose</p>)).toBeNull();
    expect(isSlotNode(<em>prose</em>)).toBe(false);
  });

  it('trusts the stamped name over the display name', () => {
    const stamped = React.createElement('span', {
      [SLOT_NAME_ATTRIBUTE]: 'targets',
    });
    expect(slotNameOf(stamped)).toBe('targets');
  });
});

describe('cleanChildren', () => {
  it('drops whitespace-only strings and keeps the rest', () => {
    const kept = cleanChildren(['  ', 'text', <em key='e'>x</em>, '\n']);
    expect(kept).toHaveLength(2);
  });
});

describe('inlineValue', () => {
  it('trims a string and passes a node through', () => {
    expect(inlineValue('  18 ')).toBe('18');
    const node = <em>x</em>;
    expect(inlineValue(node)).toBe(node);
  });
});

describe('splitSlotRuns', () => {
  it('lifts a paragraph made only of accepted slots', () => {
    const nodes = cleanChildren([
      <p key='slots'>
        <Cost>1 Major Action</Cost>
        <Targets>one creature</Targets>
      </p>,
      <p key='body'>Body prose.</p>,
    ]);
    const { entries, kept } = splitSlotRuns(nodes, ['cost', 'targets']);
    expect(entries.map((entry) => [entry.name, entry.value])).toEqual([
      ['cost', '1 Major Action'],
      ['targets', 'one creature'],
    ]);
    expect(kept).toHaveLength(1);
  });

  it('keeps a paragraph that carries a slot the host does not accept', () => {
    const nodes = cleanChildren([
      <p key='p'>
        <Cost>1 Major Action</Cost>
        <Targets>one creature</Targets>
      </p>,
    ]);
    const { entries, kept } = splitSlotRuns(nodes, ['cost']);
    expect(entries).toEqual([]);
    expect(kept).toHaveLength(1);
  });

  it('takes a standalone slot element only when asked', () => {
    const nodes = cleanChildren([<Cost key='c'>1 Minor Action</Cost>]);
    expect(splitSlotRuns(nodes, ['cost']).entries).toEqual([]);
    expect(splitSlotRuns(nodes, ['cost'], true).entries).toEqual([
      { name: 'cost', value: '1 Minor Action' },
    ]);
  });
});

describe('collectSlotEntries', () => {
  it('orders props by schema and lets a prop win over the element form', () => {
    const entries = collectSlotEntries(
      ['cost', 'targets'],
      { targets: 'one creature', cost: '1 Major Action' },
      [
        { name: 'cost', value: 'ignored' },
        { name: 'recharge', value: 'dawn' },
      ],
    );
    expect(entries).toEqual([
      { name: 'cost', value: '1 Major Action' },
      { name: 'targets', value: 'one creature' },
      { name: 'recharge', value: 'dawn' },
    ]);
  });
});

describe('readSlots', () => {
  it('reads both spellings and returns the body', () => {
    const { values, kept } = readSlots(
      [
        <p key='s'>
          <Targets>one creature</Targets>
        </p>,
        <p key='b'>Body prose.</p>,
      ],
      ['cost', 'targets'],
      { cost: '1 Major Action' },
    );
    expect(values).toEqual({ cost: '1 Major Action', targets: 'one creature' });
    expect(kept).toHaveLength(1);
  });
});
