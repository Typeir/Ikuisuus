/**
 * @fileoverview Minimal checkbox test - just verify it renders and is clickable
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Simple Checkbox Test', () => {
  it('should render a native checkbox', () => {
    render(
      <input
        type="checkbox"
        aria-label="test-checkbox"
        defaultChecked={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect((checkbox as HTMLInputElement).checked).toBe(false);
  });

  it('checkbox should show checked when clicked', async () => {
    render(
      <input
        type="checkbox"
        aria-label="test-checkbox"
        defaultChecked={false}
      />
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    
    // Initially unchecked
    expect(checkbox.checked).toBe(false);
    
    // Simulate click
    checkbox.click();
    
    // Should now be checked
    expect(checkbox.checked).toBe(true);
  });
});
