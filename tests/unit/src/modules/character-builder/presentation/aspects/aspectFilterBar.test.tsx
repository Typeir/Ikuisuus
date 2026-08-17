/**
 * @fileoverview AspectFilterBar Tests
 * @description Pressable pills, toggle/clear callbacks and overflow collapse.
 *
 * @module tests/unit/src/modules/character-builder/presentation/aspects/aspectFilterBar
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  AspectFilterBar,
  useAspectFilter,
} from '@/modules/character-builder/presentation/aspects/aspectFilterBar';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<typeof import('next-intl')>(),
  );
});

describe('AspectFilterBar', () => {
  it('should render nothing when the items carry no aspects', () => {
    const { container } = render(
      <AspectFilterBar
        tagLists={[undefined, []]}
        selected={new Set()}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render a pressable pill per aspect and report toggles', async () => {
    const onToggle = vi.fn();
    render(
      <AspectFilterBar
        tagLists={[['damage:fire'], ['tempo:reactive', 'damage:fire']]}
        selected={new Set(['damage:fire'])}
        onToggle={onToggle}
        onClear={vi.fn()}
      />,
    );
    const fire = screen.getByRole('button', { name: 'damage: fire' });
    expect(fire).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(
      screen.getByRole('button', { name: 'tempo: reactive' }),
    );
    expect(onToggle).toHaveBeenCalledWith('tempo:reactive');
  });

  it('should offer clear only with a selection', () => {
    const onClear = vi.fn();
    const { rerender } = render(
      <AspectFilterBar
        tagLists={[['damage:fire']]}
        selected={new Set()}
        onToggle={vi.fn()}
        onClear={onClear}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    rerender(
      <AspectFilterBar
        tagLists={[['damage:fire']]}
        selected={new Set(['damage:fire'])}
        onToggle={vi.fn()}
        onClear={onClear}
      />,
    );
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('should collapse past twelve aspects and expand on demand', async () => {
    const tags = Array.from({ length: 15 }, (_, i) => `condition:c${i}`);
    render(
      <AspectFilterBar
        tagLists={[tags]}
        selected={new Set()}
        onToggle={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('button', { name: /^condition:/ })).toHaveLength(
      12,
    );
    await userEvent.click(screen.getByRole('button', { name: '+3 more' }));
    expect(screen.getAllByRole('button', { name: /^condition:/ })).toHaveLength(
      15,
    );
  });
});

describe('useAspectFilter', () => {
  it('should toggle and clear', () => {
    const { result } = renderHook(() => useAspectFilter());
    act(() => result.current.toggle('damage:fire'));
    expect([...result.current.selected]).toEqual(['damage:fire']);
    act(() => result.current.toggle('damage:fire'));
    expect(result.current.selected.size).toBe(0);
    act(() => result.current.toggle('a:b'));
    act(() => result.current.clear());
    expect(result.current.selected.size).toBe(0);
  });
});
