/**
 * @fileoverview Ability Card Component
 * @description Card rendering ability mechanics + description as MDX.
 * Source lookup via (?) icon opens PagePreview draggable modal.
 *
 * @module lib/components/characterSheet/tabs/abilities/AbilityCard
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip';
import type { CharacterAbility } from '@/lib/types/character';
import type { PreviewKind } from '@/modules/character-builder/presentation/PagePreview/pagePreviewProvider';
import { usePagePreview } from '@/modules/character-builder/presentation/PagePreview/pagePreviewProvider';
import { compileRuntimeSync } from '@/modules/library/infrastructure/compile/compileRuntime';
import { mdxComponents } from '@/modules/library/presentation';
import {
  typeColorVar,
  type SearchContentType,
} from '@/modules/search/domain';
import { TypeSigil } from '@/modules/search/presentation/atoms/TypeSigil';
import { HelpCircle, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useMemo } from 'react';
import btn from '@/styles/buttons.module.scss';
import styles from './abilities.module.scss';

const KIND_MAP: Record<string, PreviewKind> = {
  spells: 'spells',
  heirlooms: 'heirlooms',
  trinkets: 'trinkets',
  feats: 'feats',
};

/** I18n keys for ability type labels. */
const ABILITY_TYPE_I18N: Record<string, string> = {
  Spell: 'abilityTypeSpell',
  Feature: 'abilityTypeFeature',
  Feat: 'abilityTypeFeat',
  Heirloom: 'abilityTypeHeirloom',
  Trinket: 'abilityTypeTrinket',
  Other: 'abilityTypeOther',
};

/**
 * Ability type → search content type, for the shared TypeSigil / type-color
 * visual language. `Feature` and `Other` have no search taxonomy entry, so
 * they borrow the closest sigil (specialization star / world scroll).
 */
const ABILITY_SIGIL_TYPE: Record<string, SearchContentType> = {
  Spell: 'spells',
  Feature: 'specializations',
  Feat: 'feats',
  Heirloom: 'heirlooms',
  Trinket: 'trinkets',
  Other: 'world',
};

export interface AbilityCardProps {
  ability: CharacterAbility;
  editing?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

function renderMdxBlock(source: string): ReactNode {
  if (!source.trim()) return null;
  try {
    return compileRuntimeSync({ source, components: mdxComponents }).content;
  } catch {
    return <p>{source}</p>;
  }
}

export const AbilityCard: React.FC<AbilityCardProps> = ({
  ability,
  editing = false,
  onEdit,
  onDelete,
}) => {
  const t = useTranslations('characterSheet');
  const preview = usePagePreview();

  const hasSource = Boolean(ability.importedFrom && ability.source);
  const previewKind = hasSource
    ? (KIND_MAP[ability.importedFrom!] ?? null)
    : null;
  const isOpen =
    hasSource && previewKind
      ? preview.isOpen(previewKind, ability.source!)
      : false;

  const handleSourceLookup = useCallback(() => {
    if (!hasSource || !previewKind) return;
    if (isOpen) preview.close(previewKind, ability.source!);
    else
      preview.open({
        kind: previewKind,
        slug: ability.source!,
        title: ability.name,
      });
  }, [ability, hasSource, previewKind, isOpen, preview]);

  /** Rendered MDX from mechanics + description. */
  const renderedBody = useMemo(() => {
    const src = [ability.mechanics, ability.description]
      .filter(Boolean)
      .join('\n\n');
    return renderMdxBlock(src);
  }, [ability.mechanics, ability.description]);

  const typeLabel = t(ABILITY_TYPE_I18N[ability.type] ?? 'abilityTypeOther');
  const sigilType = ABILITY_SIGIL_TYPE[ability.type] ?? 'world';
  const bodyId = `ability-body-${ability.id}`;

  return (
    <div
      className={styles.abilityCard}
      role='article'
      aria-label={ability.name}
      style={
        { '--sigil-color': typeColorVar(sigilType) } as React.CSSProperties
      }>
      <div className={styles.cardHeader}>
        <TypeSigil type={sigilType} className={styles.cardSigil} />
        <span className={styles.cardHeading}>
          <span className={styles.cardTypeLabel}>{typeLabel}</span>
          <span className={styles.cardName}>{ability.name}</span>
        </span>
        {hasSource && (
          <Tooltip
            content={
              isOpen
                ? (t('abilitySourceClose') ?? 'Close preview')
                : (t('abilitySourceOpen') ?? 'Open source preview')
            }
            placement='top'
            showDelay={250}
            showClickIcon={false}>
            <button
              type='button'
              className={`${btn.icon} ${styles.sourceBtn} ${isOpen ? styles.sourceBtnActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSourceLookup();
              }}
              aria-label={t('abilitySourceAria', { name: ability.name })}>
              <HelpCircle size={14} />
            </button>
          </Tooltip>
        )}
      </div>
      {editing && (
        <div className={styles.cardActions}>
          {onEdit && (
            <button
              type='button'
              className={btn.icon}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label={t('abilityEditAria', { name: ability.name })}>
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type='button'
              className={btn.iconDanger}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label={t('abilityDeleteAria', { name: ability.name })}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
      <div className={styles.cardBody} id={bodyId}>
        {renderedBody ? (
          <div className={styles.mdxContent}>{renderedBody}</div>
        ) : (
          <p className={styles.emptyBody}>{'\u2014'}</p>
        )}
      </div>
    </div>
  );
};
