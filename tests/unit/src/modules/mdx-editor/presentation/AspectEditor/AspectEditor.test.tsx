/**
 * @fileoverview Unit Tests — AspectEditor
 * @description Staging from the vocabulary, unstaging, commit on Apply only.
 *
 * @module tests/unit/src/modules/mdx-editor/presentation/AspectEditor/AspectEditor
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<typeof import('next-intl')>(),
  );
});

vi.mock(
  '@/modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient',
  () => ({
    fetchAspectVocabulary: vi.fn().mockResolvedValue([
      { group: 'damage', values: ['fire', 'frost'], scope: '*' },
      { group: 'form', values: ['blade'], scope: ['spells'] },
      { group: 'theme', values: ['death'], scope: '*', authored: false },
    ]),
  }),
);

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return { ...actual, createPortal: (node: React.ReactNode) => node };
});

import { AspectEditor } from '@/modules/mdx-editor/presentation/AspectEditor/AspectEditor';

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

const setup = (initial: string[] = []) => {
  const onApply = vi.fn();
  const onClose = vi.fn();
  render(
    <AspectEditor isOpen initial={initial} onApply={onApply} onClose={onClose} />,
  );
  return { onApply, onClose };
};

describe('AspectEditor', () => {
  it('should render vocabulary groups with pills and the initial staged set', async () => {
    setup(['damage:fire']);
    await screen.findByText('damage:');
    expect(screen.getByText('form:')).toBeDefined();
    const staged = screen.getByLabelText('Authored aspects');
    expect(staged.querySelector('button[aria-label="damage: fire"]')).not.toBeNull();
  });

  it('should stage on vocabulary click and unstage on staged click, applying only on Apply', async () => {
    const { onApply, onClose } = setup();
    const user = userEvent.setup();
    await screen.findByText('form:');

    const vocab = screen.getByLabelText('Vocabulary');
    await user.click(vocab.querySelector('button[aria-label="form: blade"]')!);
    await user.click(vocab.querySelector('button[aria-label="damage: frost"]')!);
    expect(onApply).not.toHaveBeenCalled();

    const staged = screen.getByLabelText('Authored aspects');
    expect(staged.querySelectorAll('button[aria-label]')).toHaveLength(2);
    await user.click(staged.querySelector('button[aria-label="damage: frost"]')!);
    expect(staged.querySelectorAll('button[aria-label]')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith(['form:blade']);
    expect(onClose).toHaveBeenCalled();
  });

  it('should close without applying', async () => {
    const { onApply, onClose } = setup(['damage:fire']);
    const user = userEvent.setup();
    await screen.findByText('form:');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('should show the empty hint with nothing staged', async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByText(/pick from the vocabulary/)).toBeDefined(),
    );
  });

  it('should render not-authored groups disabled and not stage from them', async () => {
    const { onApply } = setup();
    const user = userEvent.setup();
    await screen.findByText(/theme:/);
    const pill = screen.getByLabelText('Vocabulary').querySelector(
      'button[aria-label="theme: death"]',
    ) as HTMLButtonElement;
    expect(pill.disabled).toBe(true);
    expect(screen.getByText('(not yet authored)')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith([]);
  });
});
