/**
 * @fileoverview Tests for the creature spell list.
 * @description One row per declared slug, in order, filled from the spell
 * rows the hook returns, with the page's own columns after the metadata ones.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/SpellList.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-07
 */

import { Column, Row } from '@/modules/library/presentation/components/slots/Progression';
import SpellList from '@/modules/library/presentation/components/slots/SpellList';
import { useSpellSources } from '@/modules/metadata-tables/application/hooks/useSpellSources';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('../../../../../../../setup/intlMock');
  const library = (await import('../../../../../../../../messages/en/library.json')).default;
  return createRealMessageIntlMock(await importOriginal<Record<string, unknown>>(), { library });
});

vi.mock('@/modules/metadata-tables/application/hooks/useSpellSources', () => ({
  useSpellSources: vi.fn(() => ({
    spellData: [
      { slug: 'omen', title: 'Omen', level: 0, castingTimeRaw: '1 Major Action', range: 'Self', duration: 'Instantaneous' },
      {
        slug: 'ray-of-sickness',
        title: 'Ray of Sickness',
        level: 1,
        castingTimeRaw: '1 Major Action',
        range: '[= 12 stride =]',
        duration: 'Instantaneous',
      },
    ],
    loading: false,
    refetching: false,
    error: null,
  })),
}));

/**
 * Cells of one body row.
 *
 * @param {number} index - Row index from 0
 * @returns {string[]} Cell texts
 */
const row = (index: number): string[] =>
  Array.from(document.querySelectorAll('tbody tr')[index].querySelectorAll('td')).map((td) => td.textContent ?? '');

describe('SpellList', () => {
  it('lists the slugs in order with metadata columns, then the declared columns', () => {
    render(
      <SpellList spells='omen, ray-of-sickness, unknown-bolt'>
        <Column label='Cost' values='At Will, 1' />
        <Column label='Note'>
          <Row at='ray-of-sickness'>sickens</Row>
        </Column>
      </SpellList>,
    );
    expect(Array.from(document.querySelectorAll('th')).map((th) => th.textContent)).toEqual([
      'Spell',
      'Level',
      'Casting Time',
      'Range',
      'Duration',
      'Cost',
      'Note',
    ]);
    expect(row(0)).toEqual(['Omen', 'Cantrip', '1 Major Action', 'Self', 'Instantaneous', 'At Will', '—']);
    expect(row(1)).toEqual(['Ray of Sickness', '1', '1 Major Action', '[= 12 stride =]', 'Instantaneous', '1', 'sickens']);
    expect(row(2)).toEqual(['Unknown Bolt', '—', '—', '—', '—', '—', '—']);
    expect(document.querySelector('tbody a')).toHaveAttribute('href', '/en/library/spells/omen');
    expect(document.querySelector('table')).toHaveAttribute('data-spell-list', '3');
    expect(vi.mocked(useSpellSources)).toHaveBeenLastCalledWith(['/api/spells'], 'en', [
      'omen',
      'ray-of-sickness',
      'unknown-bolt',
    ]);
  });

  it('places rows without a key by position and renders nothing without spells', () => {
    const { container, unmount } = render(
      <SpellList spells='omen, ray-of-sickness'>
        <Column label='Uses'>
          <Row>3</Row>
        </Column>
      </SpellList>,
    );
    expect(row(0)[5]).toBe('3');
    expect(row(1)[5]).toBe('—');
    unmount();
    const empty = render(<SpellList />);
    expect(empty.container).toBeEmptyDOMElement();
    expect(container).not.toBeNull();
  });
});
