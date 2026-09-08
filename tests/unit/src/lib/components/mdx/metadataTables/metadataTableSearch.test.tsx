/**
 * @fileoverview MetadataTableSearch Tests
 * @description Aspect autocomplete inside the table's search field, and the
 * pills a picked token leaves behind.
 *
 * @module tests/unit/src/lib/components/mdx/metadataTables/metadataTableSearch.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { MetadataTableSearch } from '@/lib/components/mdx/metadataTables/metadataTableSearch';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', async (importOriginal) => {
  const { createRealMessageIntlMock } = await import('@tests/setup/intlMock');
  return createRealMessageIntlMock(
    await importOriginal<typeof import('next-intl')>(),
  );
});

vi.mock(
  '@/modules/mdx-editor/infrastructure/api-clients/aspectVocabularyClient',
  () => ({
    fetchAspectVocabulary: vi.fn(async () => [
      { group: 'condition', values: ['bleeding', 'blinded'], scope: '*' },
    ]),
  }),
);

/**
 * Props for {@link Harness}.
 *
 * @interface HarnessProps
 * @property {string[]} [initial] - Aspects the table starts filtered by
 * @property {(aspects: string[]) => void} [onAspectsChange] - Spy for aspect changes
 */
interface HarnessProps {
  initial?: string[];
  onAspectsChange?: (aspects: string[]) => void;
}

/**
 * Stateful host standing in for MetadataTable.
 *
 * @param {HarnessProps} props - Component props
 * @returns {JSX.Element} The field under test, wired to local state
 */
function Harness({ initial = [], onAspectsChange }: HarnessProps) {
  const [value, setValue] = useState('');
  const [aspects, setAspects] = useState(initial);
  return (
    <MetadataTableSearch
      value={value}
      aspects={aspects}
      onChange={(nextValue, nextAspects) => {
        setValue(nextValue);
        setAspects(nextAspects);
        onAspectsChange?.(nextAspects);
      }}
      locale='en'
    />
  );
}

describe('MetadataTableSearch', () => {
  it('should suggest aspects for a typed group token', async () => {
    render(<Harness />);
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'condition:b' } });

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('should turn a picked suggestion into a filter pill and drop it from the text', async () => {
    const onAspectsChange = vi.fn();
    render(<Harness onAspectsChange={onAspectsChange} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'claw condition:b' } });
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));

    fireEvent.mouseDown(screen.getAllByRole('option')[0]);

    expect(onAspectsChange).toHaveBeenCalledWith(['condition:bleeding']);
    expect(input.value).toBe('claw');
    expect(screen.queryByRole('option')).toBeNull();
  });

  it('should remove one pill and clear them all', async () => {
    const onAspectsChange = vi.fn();
    render(
      <Harness
        initial={['condition:bleeding', 'condition:blinded']}
        onAspectsChange={onAspectsChange}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Remove the condition: bleeding filter',
      }),
    );
    expect(onAspectsChange).toHaveBeenLastCalledWith(['condition:blinded']);

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onAspectsChange).toHaveBeenLastCalledWith([]);
  });

  it('should offer no pill row without active aspects', () => {
    render(<Harness />);
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });
});
