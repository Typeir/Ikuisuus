/**
 * @fileoverview FilterSelect Parts Tests
 * @description Option filtering, option row rendering, and mobile modal copy.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  FilterMobileModal,
  filterOptionsByQuery,
  VirtualizedOption,
} from '@/lib/components/ui/filterSelect/filterSelectParts';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<typeof import('next-intl')>(),
  );
});

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

describe('filterOptionsByQuery', () => {
  it('returns all options for a blank query', () => {
    expect(filterOptionsByQuery(OPTIONS, '  ')).toEqual(OPTIONS);
  });

  it('matches case-insensitively and keeps the All option', () => {
    const withAll = [{ value: '', label: 'All' }, ...OPTIONS];
    expect(filterOptionsByQuery(withAll, 'alp')).toEqual([
      { value: '', label: 'All' },
      { value: 'a', label: 'Alpha' },
    ]);
  });
});

describe('VirtualizedOption', () => {
  it('renders label with leading and trailing slots', () => {
    render(
      <VirtualizedOption
        option={OPTIONS[0]}
        isSelected={false}
        isHighlighted={false}
        onClick={() => {}}
        onMouseEnter={() => {}}
        style={{}}
        leading={<span data-testid='lead' />}
        trailing={<span data-testid='trail' />}
      />,
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByTestId('lead')).toBeInTheDocument();
    expect(screen.getByTestId('trail')).toBeInTheDocument();
  });
});

describe('FilterMobileModal', () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    options: OPTIONS,
    value: '',
    onSelect: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    allLabel: 'All',
  };

  it('renders localized search placeholder and options', () => {
    render(<FilterMobileModal {...baseProps} />);

    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('shows the localized empty state for a fruitless search', () => {
    render(<FilterMobileModal {...baseProps} searchQuery='zzz' />);

    expect(screen.getByText('No matches found')).toBeInTheDocument();
  });

  it('omits the All row when hideAllOption is set and selects options', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <FilterMobileModal {...baseProps} onSelect={onSelect} hideAllOption />,
    );

    expect(screen.queryByText('All')).not.toBeInTheDocument();
    await user.click(screen.getByText('Beta'));
    expect(onSelect).toHaveBeenCalledWith('b');
  });
});
