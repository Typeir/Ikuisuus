/**
 * @fileoverview Unit Tests — EditorAuthSection
 * @description Validates login form rendering, authenticated user display,
 * interaction callbacks, and error state display.
 *
 * @module tests/unit/src/modules/mdx-editor/presentation/EditorAuthSection/EditorAuthSection.test
 */

import { EditorAuthSection } from '@/modules/mdx-editor/presentation/EditorAuthSection/EditorAuthSection';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/mdx-editor/presentation/MdxEditor/MdxEditor.module.scss', () => ({
  default: {
    fieldGroup: 'fieldGroup',
    authStatus: 'authStatus',
    authUser: 'authUser',
    logoutButton: 'logoutButton',
    loginForm: 'loginForm',
    fieldLabel: 'fieldLabel',
    fieldRow: 'fieldRow',
    loginInput: 'loginInput',
    submitButton: 'submitButton',
    statusError: 'statusError',
    dismissButton: 'dismissButton',
  },
}));

afterEach(() => cleanup());

/** Default translation stub */
const t = (key: string, values?: Record<string, string>) =>
  values ? `${key}(${JSON.stringify(values)})` : key;

describe('EditorAuthSection (unauthenticated)', () => {
  it('renders the login form when user is null', () => {
    render(
      <EditorAuthSection
        user={null}
        isLoggingIn={false}
        authError={null}
        doLogin={vi.fn()}
        logout={vi.fn()}
        clearAuthError={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByRole('button', { name: 'loginButton' })).toBeDefined();
  });

  it('shows username and password inputs', () => {
    render(
      <EditorAuthSection
        user={null}
        isLoggingIn={false}
        authError={null}
        doLogin={vi.fn()}
        logout={vi.fn()}
        clearAuthError={vi.fn()}
        t={t}
      />,
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('calls doLogin with username and password on button click', async () => {
    const doLogin = vi.fn();
    const user = userEvent.setup();

    render(
      <EditorAuthSection
        user={null}
        isLoggingIn={false}
        authError={null}
        doLogin={doLogin}
        logout={vi.fn()}
        clearAuthError={vi.fn()}
        t={t}
      />,
    );

    const usernameInput = screen.getByPlaceholderText('usernamePlaceholder');
    const passwordInput = screen.getByPlaceholderText('passwordPlaceholder');
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'secret');
    await user.click(screen.getByRole('button', { name: 'loginButton' }));

    expect(doLogin).toHaveBeenCalledWith('admin', 'secret');
  });

  it('disables the login button when isLoggingIn is true', () => {
    render(
      <EditorAuthSection
        user={null}
        isLoggingIn={true}
        authError={null}
        doLogin={vi.fn()}
        logout={vi.fn()}
        clearAuthError={vi.fn()}
        t={t}
      />,
    );

    const btn = screen.getByRole('button', { name: 'loggingIn' });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('displays auth error when authError is provided', () => {
    render(
      <EditorAuthSection
        user={null}
        isLoggingIn={false}
        authError='Invalid credentials'
        doLogin={vi.fn()}
        logout={vi.fn()}
        clearAuthError={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByText('Invalid credentials')).toBeDefined();
  });

  it('calls clearAuthError when dismiss button is clicked', async () => {
    const clearAuthError = vi.fn();
    const user = userEvent.setup();

    render(
      <EditorAuthSection
        user={null}
        isLoggingIn={false}
        authError='Some error'
        doLogin={vi.fn()}
        logout={vi.fn()}
        clearAuthError={clearAuthError}
        t={t}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(clearAuthError).toHaveBeenCalled();
  });
});

describe('EditorAuthSection (authenticated)', () => {
  it('shows the authenticated user display when user is provided', () => {
    render(
      <EditorAuthSection
        user={{ username: 'alice', role: 'admin' }}
        isLoggingIn={false}
        authError={null}
        doLogin={vi.fn()}
        logout={vi.fn()}
        clearAuthError={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByRole('button', { name: 'logout' })).toBeDefined();
  });

  it('calls logout when logout button is clicked', async () => {
    const logout = vi.fn();
    const user = userEvent.setup();

    render(
      <EditorAuthSection
        user={{ username: 'alice', role: 'admin' }}
        isLoggingIn={false}
        authError={null}
        doLogin={vi.fn()}
        logout={logout}
        clearAuthError={vi.fn()}
        t={t}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'logout' }));

    expect(logout).toHaveBeenCalled();
  });

  it('does not render login form when user is authenticated', () => {
    render(
      <EditorAuthSection
        user={{ username: 'bob', role: 'editor' }}
        isLoggingIn={false}
        authError={null}
        doLogin={vi.fn()}
        logout={vi.fn()}
        clearAuthError={vi.fn()}
        t={t}
      />,
    );

    expect(screen.queryByPlaceholderText('usernamePlaceholder')).toBeNull();
  });
});
