/**
 * @fileoverview GradientTabs Component
 * @description Generic tabbed container with the spell-list visual style.
 * Verbatim DOM structure and CSS from SpellTable: bordered outer container,
 * scrollable tablist with bottom gradient overlay, card-tab buttons that merge
 * into the surface panel via a seam cover, and a surface content panel.
 *
 * @module lib/components/ui/gradientTabs/gradientTabs
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import type { ReactNode } from 'react';
import styles from './gradientTabs.module.scss';

/**
 * A single tab entry.
 *
 * @interface GradientTabItem
 * @property {string} value - Unique identifier for this tab
 * @property {ReactNode} label - Content rendered inside the tab button
 * @property {boolean} [disabled] - When true, the tab button is disabled
 */
export interface GradientTabItem {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

/**
 * Props for the GradientTabs component.
 *
 * @interface GradientTabsProps
 * @property {GradientTabItem[]} tabs - Ordered list of tab descriptors
 * @property {string} activeTab - Value of the currently selected tab
 * @property {(value: string) => void} onChange - Called when the user activates a tab
 * @property {Record<string, ReactNode>} [panels] - Map of tab value to panel content; use when all panels are declared upfront
 * @property {ReactNode} [children] - Panel content rendered directly; use when content is computed from activeTab externally
 */
export interface GradientTabsProps {
  tabs: GradientTabItem[];
  activeTab: string;
  onChange: (value: string) => void;
  panels?: Record<string, ReactNode>;
  children?: ReactNode;
}

/**
 * Tabbed container with the spell-list visual style. Renders a scrollable row
 * of card-tab buttons above a surface panel. DOM structure is a verbatim copy
 * of the SpellTable tab nav.
 *
 * @component
 * @param {GradientTabsProps} props - Component props
 * @returns {JSX.Element} Rendered tabbed container
 *
 * @example
 * <GradientTabs
 *   tabs={[{ value: 'feats', label: 'Feats' }, { value: 'skills', label: 'Skills' }]}
 *   activeTab={active}
 *   onChange={setActive}
 *   panels={{ feats: <FeatsContent />, skills: <SkillsContent /> }}
 * />
 */
export const GradientTabs: React.FC<GradientTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  panels,
  children,
}) => (
  <>
    <div className={styles.gradientContainer}>
      <div className={styles.tabNavWrapper}>
        <div className={styles.tabNav}>
          <div className={styles.tabList}>
            {tabs.map((tab) => (
              <div
                key={tab.value}
                className={`${styles.tab} ${activeTab === tab.value ? styles.active : ''}`}>
                <button
                  type='button'
                  disabled={tab.disabled}
                  onClick={() => onChange(tab.value)}>
                  {tab.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className={styles.tabContent}>
      {panels ? panels[activeTab] : children}
    </div>
  </>
);
