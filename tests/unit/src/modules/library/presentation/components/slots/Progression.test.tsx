/**
 * @fileoverview Tests for the progression table component.
 *
 * @module tests/unit/src/modules/library/presentation/components/slots/Progression.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

import Feature from '@/modules/library/presentation/components/slots/Feature';
import Progression, { Column, Row } from '@/modules/library/presentation/components/slots/Progression';
import Vocation from '@/modules/library/presentation/components/slots/Vocation';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('../../../../../../../setup/intlMock');
  const library = (await import('../../../../../../../../messages/en/library.json')).default;
  return createRealMessageIntlMock(await importOriginal<Record<string, unknown>>(), { library });
});

/**
 * Cells of one body row.
 *
 * @param {number} level - Row level
 * @returns {string[]} Cell texts
 */
const row = (level: number): string[] =>
  Array.from(document.querySelectorAll('[data-progression] tbody tr')[level - 1].querySelectorAll('td')).map(
    (td) => td.textContent ?? '',
  );

/**
 * Header texts of the progression table.
 *
 * @returns {string[]} Header cell texts
 */
const headers = (): string[] =>
  Array.from(document.querySelectorAll('[data-progression] th')).map((th) => th.textContent ?? '');

describe('Progression', () => {
  it('builds the table from the card headings, the attributes and the columns', () => {
    render(
      <Vocation hitDie='d8 per Rogue level'>
        <Feature level='1'>
          <h2>Expertise</h2>
        </Feature>
        <Feature level='1'>
          <h2>Sneak Attack</h2>
        </Feature>
        <Feature level='3'>
          <h2>Steady Aim</h2>
        </Feature>
        <Progression casting='third' feats='4, 8' specialization='Specialization: 9'>
          <p>
            <Column label='Features'>
              <p>
                <Row at='6' unique>
                  Expertise
                </Row>
              </p>
            </Column>
          </p>
          <Column label='Sneak Attack'>
            <p>
              <Row at='1'>
                <em>1d6</em>
              </Row>
              <Row at='3'>2d6</Row>
            </p>
          </Column>
          <Column label='Abandon' values='12, 14' />
        </Progression>
      </Vocation>,
    );
    expect(document.querySelector('table[data-progression="third"]')).not.toBeNull();
    expect(headers()).toEqual(['Level', 'Tier Bonus', 'Features', 'Sneak Attack', 'Abandon', '1st', '2nd', '3rd', '4th']);
    expect(document.querySelectorAll('[data-progression] tbody tr')).toHaveLength(20);
    expect(row(1)).toEqual(['1', '+1', 'Expertise, Sneak Attack', '1d6', '12', '—', '—', '—', '—']);
    expect(row(2)).toEqual(['2', '+1', '—', '1d6', '14', '—', '—', '—', '—']);
    expect(row(3)).toEqual(['3', '+1', 'Steady Aim', '2d6', '14', '2', '—', '—', '—']);
    expect(row(4)[2]).toBe('Feat');
    expect(row(6)[2]).toBe('Expertise');
    expect(row(7)[2]).toBe('—');
    expect(row(9)[2]).toBe('Specialization Feature');
    expect(row(20)).toEqual(['20', '+7', '—', '2d6', '14', '4', '3', '3', '1']);
    expect(document.querySelector('[data-progression] tbody tr td em')?.textContent).toBe('1d6');
  });

  it('runs to the level asked for and prints nothing for an unknown casting kind', () => {
    render(
      <Progression levels='3' casting='psionic'>
        <Column label='Dice' values='1, 2' />
      </Progression>,
    );
    expect(document.querySelector('table[data-progression="none"]')).not.toBeNull();
    expect(headers()).toEqual(['Level', 'Tier Bonus', 'Features', 'Dice']);
    expect(document.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(row(3)).toEqual(['3', '+1', '—', '2']);
  });

  it('renders the column and row markers as nothing on their own', () => {
    render(
      <div data-probe>
        <Column label='x' />
        <Row at='1'>v</Row>
      </div>,
    );
    expect(document.querySelector('[data-probe]')?.innerHTML).toBe('');
  });
});
