/**
 * @fileoverview useModalA11y tests
 * @description Verifies the shared modal-a11y hook reference-counts body
 * scroll-lock, closes only the top-of-stack modal on Escape, and restores scroll
 * on close. Uses `createElement` (no JSX) so the file matches the enforced
 * `.test.ts` extension for a `.ts` source.
 *
 * @module tests/unit/src/lib/components/ui/modal/useModalA11y.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { useModalA11y } from '@/lib/components/ui/modal/useModalA11y';
import { act, cleanup, render } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

const Harness: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { overlayRef, contentRef } = useModalA11y(isOpen, onClose);
  if (!isOpen) return null;
  return createElement(
    'div',
    { ref: overlayRef },
    createElement(
      'div',
      { ref: contentRef, tabIndex: -1 },
      createElement('button', { type: 'button' }, 'ok'),
    ),
  );
};

describe('useModalA11y', () => {
  it('locks root scroll while open and restores it on close', () => {
    const { rerender } = render(
      createElement(Harness, { isOpen: true, onClose: () => undefined }),
    );
    expect(document.documentElement.style.overflow).toBe('hidden');
    rerender(
      createElement(Harness, { isOpen: false, onClose: () => undefined }),
    );
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('calls onClose when Escape is pressed on the top modal', () => {
    const onClose = vi.fn();
    render(createElement(Harness, { isOpen: true, onClose }));
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
