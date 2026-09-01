/**
 * @fileoverview DropdownPanel atom unit tests.
 * @description Tests open/close toggle, click-outside and Escape-key close, badge, and panel role.
 *
 * @module tests/unit/src/modules/character-builder/presentation/atoms/dropdownPanel.test
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { DropdownPanel } from '@/modules/character-builder/presentation/atoms/dropdownPanel';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('DropdownPanel', () => {
  it('renders a trigger button with the given aria-label', () => {
    render(
      <DropdownPanel triggerLabel='Open test panel'>
        <span>content</span>
      </DropdownPanel>,
    );
    expect(screen.getByRole('button', { name: /open test panel/i })).toBeTruthy();
  });

  it('panel is not visible before trigger click', () => {
    render(
      <DropdownPanel triggerLabel='Open' panelLabel='Test panel'>
        <span>panel content</span>
      </DropdownPanel>,
    );
    expect(screen.queryByText('panel content')).toBeNull();
  });

  it('opens panel and renders children on trigger click', () => {
    render(
      <DropdownPanel triggerLabel='Open' panelLabel='Test panel'>
        <span>panel content</span>
      </DropdownPanel>,
    );
    fireEvent.click(screen.getByRole('button', { name: /open/i }));
    expect(screen.getByText('panel content')).toBeTruthy();
  });

  it('toggle: second click closes the panel', () => {
    render(
      <DropdownPanel triggerLabel='Open' panelLabel='Test panel'>
        <span>panel content</span>
      </DropdownPanel>,
    );
    const trigger = screen.getByRole('button', { name: /open/i });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(screen.queryByText('panel content')).toBeNull();
  });

  it('closes on Escape key', () => {
    render(
      <DropdownPanel triggerLabel='Open' panelLabel='Test panel'>
        <span>panel content</span>
      </DropdownPanel>,
    );
    fireEvent.click(screen.getByRole('button', { name: /open/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('panel content')).toBeNull();
  });

  it('closes on mousedown outside both trigger and panel', () => {
    render(
      <DropdownPanel triggerLabel='Open' panelLabel='Test panel'>
        <span>panel content</span>
      </DropdownPanel>,
    );
    fireEvent.click(screen.getByRole('button', { name: /open/i }));
    expect(screen.getByText('panel content')).toBeTruthy();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('panel content')).toBeNull();
  });

  it('does not close when mousedown inside the panel', () => {
    render(
      <DropdownPanel triggerLabel='Open' panelLabel='Test panel'>
        <span>panel content</span>
      </DropdownPanel>,
    );
    fireEvent.click(screen.getByRole('button', { name: /open/i }));
    const content = screen.getByText('panel content');
    fireEvent.mouseDown(content);
    expect(screen.getByText('panel content')).toBeTruthy();
  });

  it('renders badge node before trigger when provided', () => {
    render(
      <DropdownPanel
        triggerLabel='Open'
        badge={<span data-testid='badge'>5</span>}>
        <span>content</span>
      </DropdownPanel>,
    );
    expect(screen.getByTestId('badge')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('applies panelRole to the panel container', () => {
    render(
      <DropdownPanel triggerLabel='Open' panelRole='list' panelLabel='My list'>
        <div role='listitem'>item</div>
      </DropdownPanel>,
    );
    fireEvent.click(screen.getByRole('button', { name: /open/i }));
    expect(screen.getByRole('list', { name: /my list/i })).toBeTruthy();
  });

  it('sets aria-expanded false when closed, true when open', () => {
    render(
      <DropdownPanel triggerLabel='Open'>
        <span>content</span>
      </DropdownPanel>,
    );
    const trigger = screen.getByRole('button', { name: /open/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
