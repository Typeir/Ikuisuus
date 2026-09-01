/**
 * @fileoverview NotesSection Unit Tests
 * @description Tests for the NotesSection component.
 *
 * @module tests/unit/src/modules/character-builder/presentation/notes/notesSection.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { NoteFields } from '@/modules/character-builder/presentation/notes/notesSection';
import { NotesSection } from '@/modules/character-builder/presentation/notes/notesSection';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const DEFAULT_VALUES: NoteFields = {
  wants: 'To find belonging',
  fears: 'Rejection by kin',
  virtues: 'Unwavering loyalty',
  flaws: 'Overconfident',
  bonds: 'My mentor guides me',
  notes: 'Owes a debt to the guild',
};

describe('NotesSection', () => {
  it('renders all six note labels', () => {
    render(<NotesSection values={DEFAULT_VALUES} onChange={vi.fn()} />);
    for (const label of [
      'wants',
      'fears',
      'virtues',
      'flaws',
      'bonds',
      'notes',
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('renders textareas in edit mode', () => {
    render(<NotesSection values={DEFAULT_VALUES} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('To find belonging')).toBeTruthy();
  });

  it('calls onChange when a textarea is edited', async () => {
    const onChange = vi.fn();
    render(<NotesSection values={DEFAULT_VALUES} onChange={onChange} />);
    const textarea = screen.getByDisplayValue('To find belonging');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Pirate turned sage');
    expect(onChange).toHaveBeenCalled();
  });

  it('renders static paragraphs in readOnly mode', () => {
    render(
      <NotesSection values={DEFAULT_VALUES} onChange={vi.fn()} readOnly />,
    );
    expect(screen.getByText('To find belonging')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('shows — for empty fields in readOnly mode', () => {
    const empty: NoteFields = {
      wants: '',
      fears: '',
      virtues: '',
      flaws: '',
      bonds: '',
      notes: '',
    };
    render(<NotesSection values={empty} onChange={vi.fn()} readOnly />);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(6);
  });
});
