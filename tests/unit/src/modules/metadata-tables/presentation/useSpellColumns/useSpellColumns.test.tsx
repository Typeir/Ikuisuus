import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSpellColumns } from '@/modules/metadata-tables/presentation/useSpellColumns/useSpellColumns';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('useSpellColumns', () => {
  it('returns expected column keys', () => {
    const { result } = renderHook(() => useSpellColumns());

    expect(result.current.map((column) => column.key)).toEqual([
      'title',
      'castingTime',
      'range',
      'duration',
      'components',
    ]);
  });
});
