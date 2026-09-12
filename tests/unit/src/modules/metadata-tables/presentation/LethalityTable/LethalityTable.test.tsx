/**
 * @fileoverview Unit tests for the Lethality table.
 * @description Covers loading, error and rendered states over a mocked
 * useMetadataTableData hook.
 *
 * @module tests/unit/src/modules/metadata-tables/presentation/LethalityTable/LethalityTable.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-12
 */

import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createUseTranslationsMock,
  loadMessageFile,
} from '../../../../lib/testUtils/translationMockUtils';

const mockHook = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: createUseTranslationsMock({
    common: loadMessageFile('messages/en/common.json'),
    tables: loadMessageFile('messages/en/tables.json'),
  }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock(
  '@/modules/metadata-tables/application/hooks/useMetadataTableData',
  () => ({
    useMetadataTableData: (...args: unknown[]) => mockHook(...args),
  }),
);

vi.mock('@/lib/components/mdx/metadataTables/metadataTableSkeleton', () => ({
  MetadataTableSkeleton: () => <div data-testid='skeleton'>Loading…</div>,
}));

import LethalityTable from '@/modules/metadata-tables/presentation/LethalityTable/LethalityTable';

describe('LethalityTable', () => {
  beforeEach(() => {
    mockHook.mockReset();
  });

  it('shows the skeleton while the bestiary loads', () => {
    mockHook.mockReturnValue({ data: [], loading: true, error: null });
    render(<LethalityTable />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('reports a failure to load', () => {
    mockHook.mockReturnValue({ data: [], loading: false, error: 'nope' });
    render(<LethalityTable />);
    expect(screen.getByRole('alert')).toHaveTextContent('nope');
  });

  it('writes every rung even when the bestiary is empty', () => {
    mockHook.mockReturnValue({ data: [], loading: false, error: null });
    render(<LethalityTable />);
    expect(screen.getByRole('rowheader', { name: '17' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '1/4' })).toBeInTheDocument();
  });

  it('prices a rung and counts what sits on it', () => {
    mockHook.mockReturnValue({
      data: [{ cr: '17' }, { cr: '17' }],
      loading: false,
      error: null,
    });
    render(<LethalityTable />);

    const row = screen.getByRole('rowheader', { name: '17' }).closest('tr');
    expect(row).not.toBeNull();
    const cells = within(row as HTMLElement).getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('18,000');
    expect(cells[1]).toHaveTextContent('+6');
    expect(cells[2]).toHaveTextContent('2');
  });

  it('dashes a rung the bestiary writes nothing on', () => {
    mockHook.mockReturnValue({
      data: [{ cr: '17' }],
      loading: false,
      error: null,
    });
    render(<LethalityTable />);

    const row = screen.getByRole('rowheader', { name: '21' }).closest('tr');
    const cells = within(row as HTMLElement).getAllByRole('cell');
    expect(cells[2]).toHaveTextContent('—');
  });

  it('reads the bestiary for the route locale', () => {
    mockHook.mockReturnValue({ data: [], loading: false, error: null });
    render(<LethalityTable />);
    expect(mockHook).toHaveBeenCalledWith(
      expect.any(Function),
      'en',
      'monsters',
    );
  });
});
