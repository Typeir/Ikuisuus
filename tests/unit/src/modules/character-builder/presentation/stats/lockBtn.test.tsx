/**
 * @fileoverview LockBtn Unit Tests
 * @description Smoke tests for the lock toggle button.
 *
 * @module tests/unit/character-builder/presentation/stats/lockBtn
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { LockBtn } from '@/modules/character-builder/presentation/stats/lockBtn';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('LockBtn', () => {
  it('renders a lock button with locked state', () => {
    render(<LockBtn isUnlocked={() => false} toggle={vi.fn()} k='hp' />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders unlocked button when isUnlocked returns true', () => {
    render(<LockBtn isUnlocked={() => true} toggle={vi.fn()} k='ac' />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls toggle with key on click', async () => {
    const toggle = vi.fn();
    const user = userEvent.setup();
    render(<LockBtn isUnlocked={() => false} toggle={toggle} k='initiative' />);
    await user.click(screen.getByRole('button'));
    expect(toggle).toHaveBeenCalledWith('initiative');
  });
});
