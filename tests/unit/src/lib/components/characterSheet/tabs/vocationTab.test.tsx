/**
 * @fileoverview VocationTab Tests
 * @description Smoke tests for the vocation tab — empty state and iframe path.
 *
 * @module tests/unit/lib/components/characterSheet/tabs/vocationTab
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { VocationTab } from '@/lib/components/characterSheet/tabs/vocationTab';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('VocationTab', () => {
  it('renders empty state when no vocation is selected', () => {
    render(<VocationTab data={createEmptyCharacter()} />);
    expect(screen.getByText('selectVocation')).toBeTruthy();
  });

  it('renders iframe pointing at the vocation page when only vocation is set', () => {
    const data = {
      ...createEmptyCharacter(),
      vocationSlug: 'oathbreaker',
      vocationTitle: 'Oathbreaker',
    };
    render(<VocationTab data={data} locale='en' />);
    const iframe = screen.getByTitle('Oathbreaker') as HTMLIFrameElement;
    expect(iframe.src).toContain(
      '/en/library/character-creation/vocations/oathbreaker',
    );
  });
});
