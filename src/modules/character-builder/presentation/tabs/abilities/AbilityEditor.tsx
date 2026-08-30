/**
 * @fileoverview Ability Editor Component
 * @description Modal form for creating or editing a character ability.
 * Fields: Name (text), Type (select), Mechanics (textarea + live MDX preview),
 * Description (textarea + live MDX preview). Renders previews via
 * `compileRuntimeSync` + enriched component registry.
 *
 * @module lib/components/characterSheet/tabs/abilities/AbilityEditor
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { FilterSelect } from '@/lib/components/ui/filterSelect';
import type { AbilityType, CharacterAbility } from '@/lib/types/character';
import { generateId } from '@/modules/encounter-planner/domain/shared/utils';
import { compileRuntimeSync } from '@/modules/library/infrastructure/compile/compileRuntime';
import { mdxComponents } from '@/modules/library/presentation';
import { IconButton } from '@/lib/components/ui/iconButton';
import { useTranslations } from 'next-intl';
import {
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import btn from '@/styles/buttons.module.scss';
import styles from './abilities.module.scss';

/**
 * Form state managed by the editor.
 *
 * @interface AbilityFormState
 * @property {string} name - Ability name
 * @property {AbilityType} type - Type discriminant
 * @property {string} mechanics - Raw MDX mechanics block
 * @property {string} description - Raw MDX description
 */
interface AbilityFormState {
  name: string;
  type: AbilityType;
  mechanics: string;
  description: string;
}

/**
 * The six ability type options for the select dropdown.
 *
 * @constant {readonly AbilityType[]} ABILITY_TYPES
 */
const ABILITY_TYPES: readonly AbilityType[] = [
  'Spell',
  'Feature',
  'Feat',
  'Heirloom',
  'Trinket',
  'Other',
] as const;

/**
 * Props for `<AbilityEditor>`.
 *
 * @interface AbilityEditorProps
 * @property {CharacterAbility | null} [existing] - Existing ability to edit, or null for create
 * @property {(ability: CharacterAbility) => void} onSave - Called with the new/updated ability
 * @property {() => void} onCancel - Called when editing is cancelled
 */
export interface AbilityEditorProps {
  existing?: CharacterAbility | null;
  onSave: (ability: CharacterAbility) => void;
  onCancel: () => void;
}

/**
 * Renders raw MDX source for live preview. Silently falls back on compile error.
 *
 * @param {string} source - Raw MDX
 * @returns {ReactNode} Compiled output or null
 */
function renderPreview(source: string, errorLabel: string): ReactNode {
  if (!source.trim()) return null;
  try {
    return compileRuntimeSync({ source, components: mdxComponents }).content;
  } catch {
    return <span className={styles.previewError}>{errorLabel}</span>;
  }
}

/**
 * Modal form for creating or editing an ability.
 *
 * @component
 * @param {AbilityEditorProps} props - Component props
 * @param {CharacterAbility | null} [props.existing] - Existing ability to edit, or null for create
 * @param {(ability: CharacterAbility) => void} props.onSave - Called with the new/updated ability
 * @param {() => void} props.onCancel - Called when editing is cancelled
 * @returns {JSX.Element} Rendered editor modal
 */
export const AbilityEditor: React.FC<AbilityEditorProps> = ({
  existing,
  onSave,
  onCancel,
}) => {
  const t = useTranslations('characterSheet');
  const tCommon = useTranslations('common');
  const isEditing = Boolean(existing);

  const [form, setForm] = useState<AbilityFormState>(() => ({
    name: existing?.name ?? '',
    type: existing?.type ?? 'Other',
    mechanics: existing?.mechanics ?? '',
    description: existing?.description ?? '',
  }));

  const [previewMechanics, setPreviewMechanics] = useState(false);
  const [previewDescription, setPreviewDescription] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        type: existing.type,
        mechanics: existing.mechanics,
        description: existing.description,
      });
    }
  }, [existing]);

  const handleSave = useCallback(() => {
    if (!form.name.trim()) return;
    const ability: CharacterAbility = {
      id: existing?.id ?? generateId(),
      name: form.name.trim(),
      type: form.type,
      mechanics: form.mechanics,
      description: form.description,
      source: existing?.source,
      importedFrom: existing?.importedFrom,
    };
    onSave(ability);
  }, [form, existing, onSave]);

  const mechanicsPreview = useMemo(
    () =>
      previewMechanics
        ? renderPreview(form.mechanics, t('abilityPreviewError'))
        : null,
    [form.mechanics, previewMechanics, t],
  );
  const descriptionPreview = useMemo(
    () =>
      previewDescription
        ? renderPreview(form.description, t('abilityPreviewError'))
        : null,
    [form.description, previewDescription, t],
  );

  const titleLabel = isEditing ? t('abilityEdit') : t('abilityAdd');

  return (
    <div
      className={styles.editorOverlay}
      role='dialog'
      aria-modal='true'
      aria-label={titleLabel}>
      <div className={styles.editorPanel}>
        <h3 className={styles.editorTitle}>{titleLabel}</h3>

        {/* Name */}
        <label className={styles.fieldLabel} htmlFor='ability-editor-name'>
          {tCommon('name')}
        </label>
        <input
          id='ability-editor-name'
          className={styles.fieldInput}
          type='text'
          value={form.name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          autoFocus
        />

        {/* Type */}
        <span className={styles.fieldLabel}>{t('abilityType')}</span>
        <FilterSelect
          id='ability-editor-type'
          value={form.type}
          options={ABILITY_TYPES.map((at) => ({
            value: at,
            label: t(`abilityType${at}`),
          }))}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, type: value as AbilityType }))
          }
          size='sm'
          ariaLabel={t('abilityType')}
        />

        {/* Mechanics */}
        <label className={styles.fieldLabel} htmlFor='ability-editor-mechanics'>
          {t('abilityMechanics')}
        </label>
        <textarea
          id='ability-editor-mechanics'
          className={styles.fieldTextarea}
          value={form.mechanics}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, mechanics: e.target.value }))
          }
          rows={6}
        />
        <IconButton
          kind={previewMechanics ? 'previewOff' : 'preview'}
          onClick={() => setPreviewMechanics((p) => !p)}>
          {t('abilityPreview')}
        </IconButton>
        {mechanicsPreview && (
          <div className={styles.previewBox}>{mechanicsPreview}</div>
        )}

        {/* Description */}
        <label
          className={styles.fieldLabel}
          htmlFor='ability-editor-description'>
          {t('abilityDescription')}
        </label>
        <textarea
          id='ability-editor-description'
          className={styles.fieldTextarea}
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={4}
        />
        <IconButton
          kind={previewDescription ? 'previewOff' : 'preview'}
          onClick={() => setPreviewDescription((p) => !p)}>
          {t('abilityPreview')}
        </IconButton>
        {descriptionPreview && (
          <div className={styles.previewBox}>{descriptionPreview}</div>
        )}

        {/* Actions */}
        <div className={styles.editorActions}>
          <button
            type='button'
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!form.name.trim()}>
            {isEditing ? tCommon('save') : t('abilityAdd')}
          </button>
          <button type='button' className={btn.neutral} onClick={onCancel}>
            {tCommon('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
