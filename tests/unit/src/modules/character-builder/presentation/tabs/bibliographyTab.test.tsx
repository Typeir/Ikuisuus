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
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { screen } from '@testing-library/react';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { describe, expect, it } from 'vitest';

describe('BibliographyTab', () => {
  it('renders the notes textarea', () => {
    const data = {
      ...createEmptyCharacter(),
      bibliographyNotes: 'Test notes.',
    };
    renderWithActiveSheet(
      <BibliographyTab data={data} editing={false} onChange={() => {}} />,
    );
    expect(screen.getByText('Test notes.')).toBeTruthy();
  });

  it('textarea is readonly when not editing', () => {
    const data = createEmptyCharacter();
    renderWithActiveSheet(
      <BibliographyTab data={data} editing={false} onChange={() => {}} />,
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });
});
