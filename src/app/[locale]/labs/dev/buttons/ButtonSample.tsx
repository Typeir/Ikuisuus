/**
 * @fileoverview Renders one canonical button variant with representative content.
 * @description Icon-only variants get an icon and `tabActive` composes with `tab`.
 * Unknown names fall back to a text label so a newly added class still renders.
 *
 * @component ButtonSample
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @module app/[locale]/labs/dev/buttons/ButtonSample
 */

import { ChevronDown, Settings, X } from 'lucide-react';

const ICON_SIZE = 16;

/**
 * Props for ButtonSample.
 *
 * @interface ButtonSampleProps
 * @property {string} name - Variant name as authored in the stylesheet, or `bare`.
 * @property {Record<string, string>} btn - Imported `buttons.module.scss` class map.
 */
interface ButtonSampleProps {
  name: string;
  btn: Record<string, string>;
}

/**
 * Renders a single sample button for the given variant.
 *
 * @component
 * @param {ButtonSampleProps} props - Component props.
 * @param {string} props.name - Variant name, or `bare` for the unclassed primary.
 * @param {Record<string, string>} props.btn - Class map from `buttons.module.scss`.
 * @returns {React.ReactElement} The sample button.
 */
export function ButtonSample({
  name,
  btn,
}: ButtonSampleProps): React.ReactElement {
  switch (name) {
    case 'bare':
      return <button type='button'>Save</button>;
    case 'row':
      return (
        <button type='button' className={btn.row}>
          Full-width row
        </button>
      );
    case 'tertiary':
      return (
        <button type='button' className={btn.tertiary} aria-label='Settings'>
          <Settings size={ICON_SIZE} aria-hidden='true' />
        </button>
      );
    case 'iconRound':
      return (
        <button type='button' className={btn.iconRound} aria-label='Close'>
          <X size={ICON_SIZE} aria-hidden='true' />
        </button>
      );
    case 'iconBordered':
      return (
        <button
          type='button'
          className={btn.iconBordered}
          aria-label='Settings'>
          <Settings size={ICON_SIZE} aria-hidden='true' />
        </button>
      );
    case 'tab':
      return (
        <button type='button' className={btn.tab}>
          Tab
        </button>
      );
    case 'tabActive':
      return (
        <button type='button' className={`${btn.tab} ${btn.tabActive}`}>
          Active tab
        </button>
      );
    case 'fieldTrigger':
      return (
        <button type='button' className={btn.fieldTrigger}>
          Choose an option
          <ChevronDown size={ICON_SIZE} aria-hidden='true' />
        </button>
      );
    default:
      return (
        <button type='button' className={btn[name]}>
          {name}
        </button>
      );
  }
}
