/**
 * @fileoverview Tests for ProficiencyTrack component
 * @module tests/unit/src/modules/character-builder/presentation/components/ProficiencyTrack.test.tsx
 */

import { ProficiencyTrack } from '@/modules/character-builder/presentation/components/ProficiencyTrack';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('ProficiencyTrack', () => {
  it('should render pip buttons', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ProficiencyTrack
        currentProficiency='none'
        onChange={onChange}
        itemName='test-skill'
      />,
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(4);
  });

  it('should toggle to none when clicking current level', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <ProficiencyTrack
        currentProficiency='proficient'
        onChange={onChange}
        itemName='test-skill'
      />,
    );
    const buttons = container.querySelectorAll('button');
    await user.click(buttons[1]);
    expect(onChange).toHaveBeenCalledWith('none');
  });

  it('should set level when clicking different level', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <ProficiencyTrack
        currentProficiency='none'
        onChange={onChange}
        itemName='test-skill'
      />,
    );
    const buttons = container.querySelectorAll('button');
    await user.click(buttons[0]);
    expect(onChange).toHaveBeenCalledWith('familiarity');
  });

  it('should not allow clicks when readOnly', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <ProficiencyTrack
        currentProficiency='none'
        onChange={onChange}
        readOnly={true}
        itemName='test-skill'
      />,
    );
    const buttons = container.querySelectorAll('button');
    await user.click(buttons[0]);
    expect(onChange).not.toHaveBeenCalled();
  });
});
