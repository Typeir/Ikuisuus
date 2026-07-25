/**
 * @fileoverview GrantedProficiencies tests
 * @description Verifies the strip live-derives and groups feature/feat grants,
 * and renders nothing when there are none.
 *
 * @module tests/unit/src/modules/character-builder/presentation/stats/grantedProficiencies
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import { GrantedProficiencies } from '@/modules/character-builder/presentation/stats/grantedProficiencies';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<Record<string, unknown>>(),
  );
});

describe('GrantedProficiencies', () => {
  it('renders grants grouped by category', () => {
    const character = {
      vocations: [
        {
          level: 3,
          vocationFeatures: [
            { grants: ['armor:heavy', 'saving_throw:strength'], level: 1 },
          ],
          specializationFeatures: [],
        },
      ],
      selectedFeats: [
        {
          grants: [
            'skill:persuasion:expertise',
            'weapon:martial',
            'trade:smithing:proficient',
          ],
        },
      ],
    } as unknown as CharacterSheet;

    const { container } = render(<GrantedProficiencies data={character} />);
    expect(container.textContent).toContain('Persuasion (expertise)');
    expect(container.textContent).toContain('Heavy');
    expect(container.textContent).toContain('Martial');
    expect(container.textContent).toContain('Smithing (proficient)');
    expect(container.textContent).toContain('STR');
  });

  it('renders nothing when there are no grants', () => {
    const empty = {
      vocations: [],
      selectedFeats: [],
    } as unknown as CharacterSheet;
    const { container } = render(<GrantedProficiencies data={empty} />);
    expect(container.firstChild).toBeNull();
  });
});
