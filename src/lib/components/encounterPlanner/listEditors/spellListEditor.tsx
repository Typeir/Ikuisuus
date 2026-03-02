/**
 * @fileoverview Spell List Editor Component
 * @description Reusable component for managing spell lists with metadata-backed combobox.
 * Fetches spell links on demand and renders spells with wiki links.
 * Used in both CreatureRow (design mode) and PlayModeCombatantRow (play mode).
 *
 * @module spellListEditor
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side state, effects, and callbacks
 * @requires @/lib/types/encounterPlanner SpellRef type
 * @requires ../comboboxes/spellCombobox Spell selection dropdown
 * @requires ../creatureRow.module.scss Shared component styles
 *
 * @example
 * ```tsx
 * <SpellListEditor
 *   spells={creature.spells}
 *   onChange={(spells) => updateCreature({ spells })}
 *   locale="en"
 * />
 * ```
 */

'use client';

import { logger } from '@/lib/logging/logger';
import type { SpellRef } from '@/lib/types/encounterPlanner';
import { useCallback, useEffect, useState } from 'react';
import { SpellCombobox } from '../comboboxes';
import { X } from 'lucide-react';
import styles from '../creatureRow.module.scss';

const log = logger.child({ module: 'SpellListEditor' });

/**
 * @interface SpellListEditorProps
 * Configuration for SpellListEditor component
 * @property {SpellRef[]} spells - Current spell list
 * @property {(spells: SpellRef[]) => void} onChange - Callback when spell list changes
 * @property {string} locale - Current locale for API requests
 * @property {boolean} [readOnly=false] - Whether editing is disabled
 * @property {string} [removeChipAriaLabel] - Accessibility label for remove button
 */
interface SpellListEditorProps {
  spells: SpellRef[];
  onChange: (spells: SpellRef[]) => void;
  locale: string;
  readOnly?: boolean;
  removeChipAriaLabel?: string;
}

/**
 * Spell list editor with combobox and link fetching.
 * Displays spell chips with wiki links, fetches links on demand from API.
 *
 * @component
 * @param {SpellListEditorProps} props - Component props
 * @param {SpellRef[]} props.spells - Current spell references
 * @param {(spells: SpellRef[]) => void} props.onChange - Callback when spell list changes
 * @param {string} props.locale - Current locale for API requests
 * @param {boolean} [props.readOnly] - Whether the editor is read-only
 * @param {string} [props.removeChipAriaLabel] - Aria label for remove chip buttons
 * @returns {JSX.Element} Rendered spell list with add/remove controls
 *
 * @example
 * ```tsx
 * <SpellListEditor
 *   spells={[{ slug: 'fireball' }]}
 *   onChange={setSpells}
 *   locale="en"
 *   readOnly={false}
 * />
 * ```
 */
export const SpellListEditor: React.FC<SpellListEditorProps> = ({
  spells,
  onChange,
  locale,
  readOnly = false,
  removeChipAriaLabel = 'Remove spell',
}) => {
  const [spellLinks, setSpellLinks] = useState<Record<string, string>>({});
  const slugsKey = spells.map((s) => s.slug).join(',');

  /** Fetch spell wiki links for all spells in list */
  useEffect(() => {
    let cancelled = false;

    const loadSpellLinks = async () => {
      const slugs = spells.map((s) => s.slug);
      if (slugs.length === 0) return;

      setSpellLinks((prev) => {
        const missingSlugs = slugs.filter((slug) => !prev[slug]);
        if (missingSlugs.length === 0) return prev;

        (async () => {
          const fetched: Record<string, string> = {};

          for (const slug of missingSlugs) {
            try {
              const response = await fetch(`/api/spells/${slug}?locale=${locale}`);
              if (!response.ok) continue;

              const data = await response.json();
              if (!data?.link) continue;

              fetched[slug] = /^https?:\/\//i.test(data.link)
                ? data.link
                : `/${locale}${data.link.startsWith('/') ? '' : '/'}${data.link}`;
            } catch (error) {
              log.error('Failed to load spell link', {
                slug,
                locale,
                error: error instanceof Error ? error.message : String(error)
              });
            }
          }

          if (cancelled) return;

          if (Object.keys(fetched).length > 0) {
            setSpellLinks((current) => ({ ...current, ...fetched }));
          }
        })();

        return prev;
      });
    };

    loadSpellLinks();

    return () => {
      cancelled = true;
    };
  }, [slugsKey, locale, spells]);

  const handleAddSpell = useCallback(
    (spell: SpellRef) => {
      const spellAlreadyExists = spells.some((s) => s.slug === spell.slug);
      if (spellAlreadyExists) return;
      onChange([...spells, spell]);
    },
    [spells, onChange]
  );

  const handleRemoveSpell = useCallback(
    (slug: string) => {
      onChange(spells.filter((s) => s.slug !== slug));
    },
    [spells, onChange]
  );

  return (
    <>
      <div className={styles.chips}>
        {spells.map((spell) => {
          const spellLink = spellLinks[spell.slug];
          return (
            <div key={spell.slug} className={styles.chip}>
              {spellLink ? (
                <a
                  href={spellLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.affixLink}>
                  {spell.slug}
                </a>
              ) : (
                <span>{spell.slug}</span>
              )}
              {!readOnly && (
                <button
                  onClick={() => handleRemoveSpell(spell.slug)}
                  className={styles.removeChip}
                  aria-label={removeChipAriaLabel}>
                  <X size={12} aria-hidden='true' />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {!readOnly && (
        <div className={styles.spellComboboxWrapper}>
          <SpellCombobox locale={locale} onSelect={handleAddSpell} />
        </div>
      )}
    </>
  );
};
