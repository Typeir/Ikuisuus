/**
 * @fileoverview CharacterSheetHeader Tests
 * @description Smoke tests for the sticky character-sheet header — name/edit
 * toggle, edit/save/cancel buttons.
 *
 * @module tests/unit/src/modules/character-builder/presentation/Header/characterSheetHeader.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CharacterSheetHeader } from '@/modules/character-builder/presentation/Header/characterSheetHeader';
import { cleanup, screen } from '@testing-library/react';
import { renderWithActiveSheet } from '@tests/setup/renderWithActiveSheet';
import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal(
  'fetch',
  vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify([]), { status: 200 })),
  ),
);

describe('CharacterSheetHeader', () => {
  it('renders the character name in view mode', () => {
    renderWithActiveSheet(<CharacterSheetHeader />, {
      character: { name: 'Aria Dawnweaver' },
    });
    expect(
      screen.getByRole('heading', { name: /Aria Dawnweaver/i }),
    ).toBeTruthy();
  });

  it('renders edit/save/cancel actions appropriately', () => {
    renderWithActiveSheet(<CharacterSheetHeader />);
    expect(
      screen.getByRole('button', { name: 'ariaEditCharacter' }),
    ).toBeTruthy();

    cleanup();

    renderWithActiveSheet(<CharacterSheetHeader />, { editing: true });
    expect(screen.getByRole('button', { name: 'save' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'cancel' })).toBeTruthy();
  });

  it('marks the BP counter over budget only when spent exceeds the budget', () => {
    const boon = {
      id: 'b',
      sourceFile: 'x.mdx',
      heading: 'B',
      category: 'boon' as const,
      bpCost: 3,
    };
    renderWithActiveSheet(<CharacterSheetHeader />, {
      character: { boonBudget: 2, selectedBoons: [boon] },
    });
    expect(
      screen.getByTestId('builder-bp-counter').hasAttribute('data-over'),
    ).toBe(true);

    cleanup();

    renderWithActiveSheet(<CharacterSheetHeader />, {
      character: { boonBudget: 3, selectedBoons: [boon] },
    });
    expect(
      screen.getByTestId('builder-bp-counter').hasAttribute('data-over'),
    ).toBe(false);
  });
});
