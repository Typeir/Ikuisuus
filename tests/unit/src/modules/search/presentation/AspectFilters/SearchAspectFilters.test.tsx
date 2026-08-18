/**
 * @fileoverview SearchAspectFilters Tests
 * @description Active filters as pressed pills, removal, clear-all and the
 * editor trigger.
 *
 * @module tests/unit/src/modules/search/presentation/AspectFilters/SearchAspectFilters
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { SearchAspectFilters } from '@/modules/search/presentation/AspectFilters/SearchAspectFilters';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(await importOriginal<typeof import('next-intl')>());
});
vi.mock('@/modules/mdx-editor/presentation/AspectEditor', () => ({
  AspectEditor: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div role='dialog' /> : null),
}));

describe('SearchAspectFilters', () => {
  it('should render active aspects as pressed pills and drop one on click', async () => {
    render(<SearchAspectFilters query='fire' active={['form:blade', 'damage:fire']} />);
    const blade = screen.getByRole('button', { name: 'form: blade' });
    expect(blade).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(blade);
    expect(pushMock).toHaveBeenLastCalledWith('/en/search?q=fire&aspect=damage%3Afire');
  });

  it('should clear every filter', async () => {
    render(<SearchAspectFilters query='' active={['form:blade']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(pushMock).toHaveBeenLastCalledWith('/en/search');
  });

  it('should open the aspect editor from the trigger', async () => {
    render(<SearchAspectFilters query='' active={[]} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Filter by aspects' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
