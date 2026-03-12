/**
 * @fileoverview Editor Auth Section
 * @description Login form and authenticated user status display for the MDX editor.
 *
 * @module lib/components/mdxEditor/editorAuthSection
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import { useState } from 'react';
import styles from './mdxEditor.module.scss';

/**
 * @property {Object | null} user - Authenticated user object
 * @property {string} user.username - Display name
 * @property {string} user.role - User role
 * @property {boolean} isLoggingIn - Whether login is in progress
 * @property {string | null} authError - Authentication error message
 * @property {(u: string, p: string) => void} doLogin - Login handler
 * @property {() => void} logout - Logout handler
 * @property {() => void} clearAuthError - Clear auth error
 * @property {(key: string) => string} t - Translation function
 */
interface EditorAuthSectionProps {
  /** Authenticated user or null */
  user: { username: string; role: string } | null;
  /** Whether login is in progress */
  isLoggingIn: boolean;
  /** Authentication error message */
  authError: string | null;
  /** Login handler */
  doLogin: (username: string, password: string) => void;
  /** Logout handler */
  logout: () => void;
  /** Clear auth error */
  clearAuthError: () => void;
  /** Translation function */
  t: (key: string, values?: Record<string, string>) => string;
}

/**
 * Auth section for the MDX editor.
 * Shows either a login form or the current user's status with a logout button.
 *
 * @component
 * @param {EditorAuthSectionProps} props - Component properties
 * @returns {JSX.Element} Auth section
 */
export function EditorAuthSection({
  user,
  isLoggingIn,
  authError,
  doLogin,
  logout,
  clearAuthError,
  t,
}: EditorAuthSectionProps): JSX.Element {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  if (user) {
    return (
      <div className={styles.fieldGroup}>
        <div className={styles.authStatus}>
          <span className={styles.authUser}>
            {t('loggedInAs', {
              username: user.username,
              role: user.role,
            })}
          </span>
          <button
            type='button'
            className={styles.logoutButton}
            onClick={logout}>
            {t('logout')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fieldGroup}>
      <div className={styles.loginForm}>
        <label className={styles.fieldLabel}>{t('loginLabel')}</label>
        <div className={styles.fieldRow}>
          <input
            type='text'
            className={styles.loginInput}
            placeholder={t('usernamePlaceholder')}
            value={loginUsername}
            onChange={(e) => setLoginUsername(e.target.value)}
            autoComplete='username'
          />
          <input
            type='password'
            className={styles.loginInput}
            placeholder={t('passwordPlaceholder')}
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            autoComplete='current-password'
            onKeyDown={(e) => {
              if (e.key === 'Enter' && loginUsername && loginPassword) {
                doLogin(loginUsername, loginPassword);
              }
            }}
          />
          <button
            type='button'
            className={styles.submitButton}
            disabled={isLoggingIn || !loginUsername || !loginPassword}
            onClick={() => doLogin(loginUsername, loginPassword)}>
            {isLoggingIn ? t('loggingIn') : t('loginButton')}
          </button>
        </div>
        {authError && (
          <span className={styles.statusError}>
            {authError}{' '}
            <button
              type='button'
              className={styles.dismissButton}
              onClick={clearAuthError}>
              ✕
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
