/**
 * @fileoverview Tests for the DataTable primitive.
 *
 * @module tests/unit/src/lib/components/ui/dataTable/dataTable.test
 * @version 0.2.0
 * @author Typeir
 * @since 2026-09-06
 */

import { DataTable } from '@/lib/components/ui/dataTable';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

/**
 * Cell texts of every body row.
 *
 * @returns {string[][]} Rows of cell texts
 */
const body = (): string[][] =>
  Array.from(document.querySelectorAll('tbody tr')).map((tr) =>
    Array.from(tr.querySelectorAll('td, th')).map((cell) => cell.textContent ?? ''),
  );

describe('DataTable', () => {
  it('prints headers and cells in order inside a scroll wrapper, with no look of its own', () => {
    render(
      <DataTable
        columns={[
          { key: 'a', header: 'Alpha' },
          { key: 'b', header: <em>Beta</em> },
        ]}
        rows={[
          { key: '1', cells: ['one', 'two'] },
          { key: '2', cells: [<strong key='s'>three</strong>, 'four'] },
        ]}
        caption='Sample'
        dataAttributes={{ kind: 'sample', rowCount: '2', '': 'dropped' }}
      />,
    );
    const table = document.querySelector('table')!;
    expect(table.getAttribute('data-kind')).toBe('sample');
    expect(table.getAttribute('data-row-count')).toBe('2');
    expect(table.getAttribute('data-')).toBeNull();
    expect(table.getAttribute('class')).toBeNull();
    expect(table.parentElement!.className).toContain('wrapper');
    expect(Array.from(table.querySelectorAll('th')).map((th) => th.textContent)).toEqual(['Alpha', 'Beta']);
    expect(Array.from(table.querySelectorAll('th')).every((th) => th.getAttribute('scope') === 'col')).toBe(true);
    expect(body()).toEqual([
      ['one', 'two'],
      ['three', 'four'],
    ]);
    expect(screen.getByText('Sample').tagName).toBe('CAPTION');
  });

  it('merges classes rather than replacing them, and keeps fixed alongside a class', () => {
    render(
      <DataTable columns={[{ key: 'a', header: 'A' }]} rows={[]} className='mine' wrapperClassName='wrap' fixed />,
    );
    const table = document.querySelector('table')!;
    expect(table.className).toContain('mine');
    expect(table.className).toContain('fixed');
    expect(table.parentElement!.className).toContain('wrap');
    expect(table.parentElement!.className).toContain('wrapper');
  });

  it('names the table by aria attributes and id, and renders no caption for an empty one', () => {
    render(
      <DataTable
        columns={[{ key: 'a', header: 'A' }]}
        rows={[]}
        id='skills'
        ariaLabel='Skills'
        ariaLabelledBy='skills-heading'
        caption=''
      />,
    );
    const table = document.querySelector('table')!;
    expect(table.id).toBe('skills');
    expect(table.getAttribute('aria-label')).toBe('Skills');
    expect(table.getAttribute('aria-labelledby')).toBe('skills-heading');
    expect(document.querySelector('caption')).toBeNull();
  });

  it('makes a clickable header a button that the keyboard can reach, and reports the sort', () => {
    const onHeaderClick = vi.fn();
    render(
      <DataTable
        columns={[
          { key: 'a', header: 'Name', onHeaderClick, sort: 'ascending', className: 'sortable' },
          { key: 'b', header: '', ariaLabel: 'Actions' },
        ]}
        rows={[]}
      />,
    );
    const [first, second] = Array.from(document.querySelectorAll('th'));
    const button = first.querySelector('button')!;
    expect(button.getAttribute('type')).toBe('button');
    expect(button.textContent).toBe('Name');
    expect(first.getAttribute('aria-sort')).toBe('ascending');
    expect(first.className).toBe('sortable');
    fireEvent.click(button);
    expect(onHeaderClick).toHaveBeenCalledTimes(1);
    expect(second.getAttribute('aria-label')).toBe('Actions');
    expect(second.querySelector('button')).toBeNull();
  });

  it('pads a short row to the column count and renders cell specs with their attributes', () => {
    render(
      <DataTable
        columns={[
          { key: 'a', header: 'A' },
          { key: 'b', header: 'B' },
          { key: 'c', header: 'C' },
        ]}
        rows={[
          { key: '1', cells: ['only'] },
          {
            key: '2',
            cells: [
              { content: 'Row head', header: true, className: 'head' },
              { content: 'wide', colSpan: 2, dataAttributes: { slot: 'x' } },
            ],
          },
        ]}
        footer={[{ key: 'f', cells: [{ content: 'Total', colSpan: 3 }] }]}
      />,
    );
    expect(body()).toEqual([
      ['only', '', ''],
      ['Row head', 'wide'],
    ]);
    const head = document.querySelector('tbody tr:nth-child(2) th')!;
    expect(head.getAttribute('scope')).toBe('row');
    expect(head.className).toBe('head');
    const wide = document.querySelector('tbody tr:nth-child(2) td')!;
    expect(wide.getAttribute('colspan')).toBe('2');
    expect(wide.getAttribute('data-slot')).toBe('x');
    expect(document.querySelector('tfoot td')!.getAttribute('colspan')).toBe('3');
    expect(document.querySelector('tfoot td')!.textContent).toBe('Total');
  });

  it('renders no footer element without footer rows', () => {
    render(<DataTable columns={[{ key: 'a', header: 'A' }]} rows={[{ key: '1', cells: ['x'] }]} footer={[]} />);
    expect(document.querySelector('tfoot')).toBeNull();
  });
});
