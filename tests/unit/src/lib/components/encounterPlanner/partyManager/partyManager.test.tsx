/**
 * @fileoverview Unit tests for Party Manager Component
 * @description Tests modal rendering, party list, create/edit/delete flows,
 * and import callback behavior.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @testing-library/react
 * @requires @/lib/components/encounterPlanner/partyManager
 */

import {
    PartyManager,
    type PartyManagerProps,
} from '@/lib/components/encounterPlanner/partyManager';
import type { SavedParty } from '@/lib/types/party';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

const mockParty: SavedParty = {
  id: 'party-1',
  name: 'Adventurers',
  members: [
    { id: 'm1', name: 'Alaric' },
    { id: 'm2', name: 'Brenna' },
  ],
};

vi.mock('@/lib/utils/partyStorage', () => ({
  getSavedParties: vi.fn(() => [mockParty]),
  saveParty: vi.fn(),
  deleteParty: vi.fn(),
  getPartyById: vi.fn(),
}));

vi.mock('@/lib/utils/encounterStorage', () => ({
  generateId: vi.fn(() => 'generated-id'),
}));

describe('PartyManager', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockOnImport: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnImport = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Renders PartyManager with default props and optional overrides.
   *
   * @param {Partial<PartyManagerProps>} overrides - Optional props to override
   */
  function renderManager(overrides: Partial<PartyManagerProps> = {}) {
    return render(
      <PartyManager
        isOpen={true}
        onClose={mockOnClose}
        onImport={mockOnImport}
        {...overrides}
      />,
    );
  }

  it('should not render content when isOpen is false', () => {
    renderManager({ isOpen: false });
    expect(screen.queryByText('manageParties')).not.toBeInTheDocument();
  });

  it('should render party list when open', () => {
    renderManager();
    expect(screen.getByText('Adventurers')).toBeInTheDocument();
  });

  it('should display member count', () => {
    renderManager();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should show import button when onImport is provided', () => {
    renderManager();
    expect(screen.getByText('importParty')).toBeInTheDocument();
  });

  it('should not show import button when onImport is not provided', () => {
    renderManager({ onImport: undefined });
    expect(screen.queryByText('importParty')).not.toBeInTheDocument();
  });

  it('should show create party button', () => {
    renderManager();
    expect(screen.getByText('createParty')).toBeInTheDocument();
  });

  it('should call onImport and onClose when importing', async () => {
    const user = userEvent.setup();
    renderManager();
    await user.click(screen.getByText('importParty'));
    expect(mockOnImport).toHaveBeenCalledWith(mockParty);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should switch to editor view when clicking create', async () => {
    const user = userEvent.setup();
    renderManager();
    await user.click(screen.getByText('createParty'));
    expect(screen.getByText('saveParty')).toBeInTheDocument();
    expect(screen.getByText('backToList')).toBeInTheDocument();
  });

  it('should switch to editor view when clicking edit', async () => {
    const user = userEvent.setup();
    renderManager();
    await user.click(screen.getByText('editParty'));
    expect(screen.getByText('saveParty')).toBeInTheDocument();
  });
});
