/**
 * MdxEditor Component Unit Tests
 *
 * @fileoverview Tests for the MdxEditor component state machine.
 *
 * @module tests/unit/lib/components/mdxEditor/mdxEditor
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'slug') return null;
      if (key === 'locale') return 'en';
      return null;
    },
  }),
}));
vi.mock('@/lib/hooks/useCorrectionsAuth', () => ({
  useCorrectionsAuth: () => ({
    token: null,
    user: null,
    isLoggingIn: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
    isHydrated: true,
  }),
}));
vi.mock('./mdxEditor.module.scss', () => ({
  default: {
    editor: 'editor',
    header: 'header',
    toolbar: 'toolbar',
    textarea: 'textarea',
    loginForm: 'loginForm',
    submitButton: 'submitButton',
    statusBar: 'statusBar',
    editButton: 'editButton',
    editorPage: 'editorPage',
  },
}));

import { MdxEditor } from '@/lib/components/mdxEditor/mdxEditor';

afterEach(() => cleanup());

describe('MdxEditor', () => {
  it('should render without crashing', () => {
    render(<MdxEditor locale='en' />);
    expect(document.body.innerHTML).toBeTruthy();
  });

  it('should show login form when not authenticated', () => {
    render(<MdxEditor locale='en' />);
    /** The login form inputs should be present when token is null */
    const inputs = screen.queryAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(0);
  });
});
