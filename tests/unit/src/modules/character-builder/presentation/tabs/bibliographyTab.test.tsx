/**
 * @fileoverview BibliographyTab Tests
 * @description Smoke tests for the bibliography tab.
 *
 * @module tests/unit/lib/components/characterSheet/tabs/bibliographyTab
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { BibliographyTab } from '@/modules/character-builder/presentation/tabs/bibliographyTab';
import { screen } from '@testing-library/react';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { describe, expect, it } from 'vitest';

describe('BibliographyTab', () => {
  it('renders the notes textarea', () => {
    renderWithActiveSheet(<BibliographyTab />, {
      character: { bibliographyNotes: 'Test notes.' },
    });
    expect(screen.getByText('Test notes.')).toBeTruthy();
  });

  it('textarea is readonly when not editing', () => {
    renderWithActiveSheet(<BibliographyTab />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });
});
