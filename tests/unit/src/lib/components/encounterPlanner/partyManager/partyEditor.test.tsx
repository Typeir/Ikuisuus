/**
 * @fileoverview Unit tests for Party Editor Component
 * @description Tests name editing, table-based member add/remove, and save/back actions.
 *
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @testing-library/react
 * @requires @/lib/components/encounterPlanner/partyManager/partyEditor
 */

import { PartyEditor } from '@/lib/components/encounterPlanner/partyManager/partyEditor';
import type { SavedParty } from '@/lib/types/party';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils/encounterStorage', () => ({
  generateId: vi.fn(() => 'new-member-id'),
}));

describe('PartyEditor', () => {
  const baseParty: SavedParty = {
    id: 'party-1',
    name: 'Adventurers',
    members: [{ id: 'm1', name: 'Alaric' }],
  };

  let mockOnSave: ReturnType<typeof vi.fn>;
  let mockOnBack: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSave = vi.fn();
    mockOnBack = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render party name input with initial value', () => {
    render(
      <PartyEditor party={baseParty} onSave={mockOnSave} onBack={mockOnBack} />,
    );
    const nameInput = screen.getByPlaceholderText('partyName');
    expect(nameInput).toHaveValue('Adventurers');
  });

  it('should render existing members as table rows', () => {
    render(
      <PartyEditor party={baseParty} onSave={mockOnSave} onBack={mockOnBack} />,
    );
    expect(screen.getByDisplayValue('Alaric')).toBeInTheDocument();
  });

  it('should add a member when clicking add new character button', async () => {
    const user = userEvent.setup();
    render(
      <PartyEditor party={baseParty} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    await user.click(screen.getByText('addNewCharacter'));
    const inputs = screen.getAllByLabelText('memberName');
    expect(inputs).toHaveLength(2);
    expect(inputs[1]).toHaveValue('newCharacter');
  });

  it('should edit a member name inline', async () => {
    const user = userEvent.setup();
    render(
      <PartyEditor party={baseParty} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    const nameInput = screen.getByDisplayValue('Alaric');
    await user.clear(nameInput);
    await user.type(nameInput, 'Brenna');
    expect(nameInput).toHaveValue('Brenna');
  });

  it('should remove a member when clicking delete button', async () => {
    const user = userEvent.setup();
    render(
      <PartyEditor party={baseParty} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    const removeButton = screen.getByLabelText('removeMember Alaric');
    await user.click(removeButton);
    expect(screen.queryByDisplayValue('Alaric')).not.toBeInTheDocument();
  });

  it('should render import character button as disabled', () => {
    render(
      <PartyEditor party={baseParty} onSave={mockOnSave} onBack={mockOnBack} />,
    );
    const importButton = screen.getByText('importCharacter');
    expect(importButton).toBeDisabled();
  });

  it('should call onSave with updated party data', async () => {
    const user = userEvent.setup();
    render(
      <PartyEditor party={baseParty} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    await user.click(screen.getByText('saveParty'));
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Adventurers' }),
    );
  });

  it('should call onBack when clicking back button', async () => {
    const user = userEvent.setup();
    render(
      <PartyEditor party={baseParty} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    await user.click(screen.getByText('backToList'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('should not save when party name is empty', async () => {
    const user = userEvent.setup();
    const emptyNameParty = { ...baseParty, name: '' };
    render(
      <PartyEditor
        party={emptyNameParty}
        onSave={mockOnSave}
        onBack={mockOnBack}
      />,
    );

    await user.click(screen.getByText('saveParty'));
    expect(mockOnSave).not.toHaveBeenCalled();
  });
});
