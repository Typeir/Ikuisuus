/**
 * @fileoverview Tests for ProficiencyTrack component
 * @module tests/unit/src/modules/character-builder/presentation/components/ProficiencyTrack.test.tsx
 */

import { ProficiencyTrack } from '@/modules/character-builder/presentation/components/ProficiencyTrack';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('ProficiencyTrack', () => {
  it('should render pip buttons', () => {
    const onChange = vi.fn();
    render(
      <ProficiencyTrack
        currentProficiency='none'
        onChange={onChange}
        itemName='test-skill'
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
  });

  it('should toggle to none when clicking current level', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <ProficiencyTrack
        currentProficiency='proficient'
        onChange={onChange}
        itemName='test-skill'
      />,
    );
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[2]);
    expect(onChange).toHaveBeenCalledWith('none');
  });

  it('should set level when clicking different level', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ProficiencyTrack
        currentProficiency='none'
        onChange={onChange}
        itemName='test-skill'
      />,
    );
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(onChange).toHaveBeenCalledWith('familiarity');
  });

  it('should not allow clicks when readOnly', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ProficiencyTrack
        currentProficiency='none'
        onChange={onChange}
        readOnly={true}
        itemName='test-skill'
      />,
    );
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(onChange).not.toHaveBeenCalled();
  });
});
