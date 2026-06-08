import { FilteredSpellTableControls } from '@/modules/metadata-tables/presentation/FilteredSpellTable/FilteredSpellTableControls';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('FilteredSpellTableControls', () => {
  it('renders all filter labels', () => {
    const state = {
      damoclesOnly: false,
      schoolFilter: '',
      concentrationFilter: '' as const,
    };
    const setters = {
      setDamoclesOnly: vi.fn(),
      setSchoolFilter: vi.fn(),
      setConcentrationFilter: vi.fn(),
    };

    render(
      <FilteredSpellTableControls
        state={state}
        setters={setters}
        schoolOptions={[]}
        concentrationOptions={[]}
        tFilters={(key) => key}
      />,
    );

    expect(screen.getByText('damoclesOnly')).toBeInTheDocument();
    expect(screen.getByText('school')).toBeInTheDocument();
    expect(screen.getByText('concentration')).toBeInTheDocument();
  });
});
