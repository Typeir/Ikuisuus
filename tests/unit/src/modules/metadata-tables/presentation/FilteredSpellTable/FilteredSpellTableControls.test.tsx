import { FilteredSpellTableControls } from '@/modules/metadata-tables/presentation/FilteredSpellTable/FilteredSpellTableControls';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('FilteredSpellTableControls', () => {
  it('renders all filter labels', () => {
    const state = {
      concentrationFilter: '' as const,
    };
    const setters = {
      setConcentrationFilter: vi.fn(),
    };

    render(
      <FilteredSpellTableControls
        state={state}
        setters={setters}
        concentrationOptions={[]}
        tFilters={(key) => key}
      />,
    );

    expect(screen.getByText('concentration')).toBeInTheDocument();
    expect(screen.queryByText('damoclesOnly')).toBeNull();
  });
});
