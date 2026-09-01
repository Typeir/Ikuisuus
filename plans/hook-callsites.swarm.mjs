/**
 * @fileoverview Hook call-site sweep: one member per file, replacing inline
 * mounted-guard and outside-click implementations with the canonical hooks in
 * src/lib/hooks. Roster derives from
 * .ignore/reports/duplication-inventory.md cluster 4.
 *
 *   paw swarm run plans/hook-callsites.swarm.mjs --live
 */

const CANON = [
  'You are editing one TypeScript React file, and its paired unit test when it',
  'needs it, in place with your tools.',
  '',
  'Canonical hooks (already exist, do not modify them):',
  "  import { useMounted } from '@/lib/hooks/useMounted';",
  '  useMounted(): boolean - false during SSR/hydration, true after first',
  '  client effect.',
  "  import { useOutsideClick } from '@/lib/hooks/useOutsideClick';",
  '  useOutsideClick(targets, onOutside, active?): void - targets is one',
  '  RefObject<HTMLElement | null> or an array of them; listens on document',
  '  pointerdown; active defaults to true.',
  '',
  '# Mounted guard replacement',
  'Where the file declares an inline mounted flag -',
  '  const [mounted, setMounted] = useState(false);',
  '  useEffect(() => setMounted(true), []);',
  '(any local naming or formatting of that exact pattern) - delete it and use',
  'const mounted = useMounted(); keeping the local variable name the rest of',
  'the file reads. Drop useState/useEffect from the react import only when',
  'nothing else in the file uses them.',
  '',
  '# Outside-click replacement',
  'Where the file wires its own document mousedown/pointerdown listener that',
  'calls a close handler when the press lands outside an element, replace the',
  'whole effect with useOutsideClick(ref, close, active), preserving the same',
  'gating the effect had (for example: only attached while open). Multiple',
  'inside-elements become an array. Moving mousedown to pointerdown is the',
  'intended standardization, not a regression.',
  '',
  '# Rules',
  '* Change nothing else about the file.',
  '* JSDoc on exports only; never add inline comments inside function bodies.',
  '* Paired test lives under tests/unit/ mirroring the source path (.test.ts',
  '  or .test.tsx). Update it only if it asserts the replaced internals, e.g.',
  '  fireEvent.mouseDown for outside-click becomes fireEvent.pointerDown. Keep',
  '  every test case and its intent. Tests must stay act()-clean.',
  '* This repo runs PAW quality gates on edits; fix any violation a gate',
  '  reports on this file before finishing.',
  '',
  'Edit files in place with str_replace edits. Do not print files back.',
  'When done, reply with one short line naming what you changed.',
].join('\n');

const ROSTER = [
  { file: 'src/lib/hooks/useUnitSystem.ts', tail: 'Replace the inline mounted guard (around line 50) with useMounted().' },
  { file: 'src/app/[locale]/utils/useThemeChangedEvent.ts', tail: 'Replace the inline mounted guard (around line 25) with useMounted().' },
  { file: 'src/lib/components/themeToggle/ThemeToggleButton.tsx', tail: 'Replace the inline mounted guard (around line 54) with useMounted().' },
  { file: 'src/lib/components/ui/tooltip/tooltip.tsx', tail: 'Replace the inline mounted guard (around line 103) with useMounted().' },
  { file: 'src/lib/components/ui/pushNotification/pushNotification.tsx', tail: 'Replace the inline mounted guard (around line 275) with useMounted().' },
  { file: 'src/lib/components/ui/detachableTooltip/DetachableTooltip.tsx', tail: 'Replace the inline mounted guard (around line 112) with useMounted().' },
  { file: 'src/modules/navigation-sidebar/presentation/components/SidebarShell.tsx', tail: 'Replace the inline mounted guard (around line 273) with useMounted().' },
  { file: 'src/modules/search/presentation/SearchBar/AspectSuggestions.tsx', tail: 'Replace the inline mounted guard (around line 70) with useMounted().' },
  { file: 'src/modules/library/presentation/components/Aspects/Aspects.tsx', tail: 'Replace the inline mounted guard (around line 59) with useMounted().' },
  {
    file: 'src/modules/encounter-planner/presentation/comboboxes/genericCombobox.tsx',
    tail: [
      'Two replacements in this file: the inline mounted guard (around line',
      '127) becomes useMounted(), and the inline outside-click effect (around',
      'line 183) becomes useOutsideClick with the same refs and gating.',
    ].join('\n'),
  },
  { file: 'src/lib/components/ui/filterSelect/filterSelect.tsx', tail: 'Replace the inline outside-click effect (around line 185) with useOutsideClick, preserving its gating.' },
  { file: 'src/modules/character-builder/presentation/atoms/dropdownPanel.tsx', tail: 'Replace the inline outside-click effect (around line 106) with useOutsideClick, preserving its gating. Leave the Escape handling in this file untouched.' },
  { file: 'src/modules/character-builder/presentation/SelectedCharacter/selectedCharacterBadge.tsx', tail: 'Replace the inline outside-click effect (around line 91) with useOutsideClick, preserving its gating.' },
  { file: 'src/modules/mdx-editor/presentation/FileTreeSelect/FileTreeSelect.tsx', tail: 'Replace the inline outside-click effect (around line 109) with useOutsideClick, preserving its gating. Leave the Escape handling untouched.' },
  { file: 'src/modules/mdx-editor/presentation/ContentPicker/ContentPicker.tsx', tail: 'Replace the inline outside-click effect (around line 81) with useOutsideClick, preserving its gating. Leave the Escape handling untouched.' },
  { file: 'src/modules/tools-menu/presentation/ToolsMenu/ToolsMenu.tsx', tail: 'Replace the inline outside-click effect (around line 119, already pointerdown) with useOutsideClick, preserving its gating. Leave the Escape handling untouched.' },
];

export default {
  name: 'hook-callsites-ikuisuus',
  role: 'edit.apply',
  args: { roster: ROSTER },
  members: (a) => a.roster.length,
  availableTools: ['read', 'edit'],
  brief: (a, m) =>
    [
      CANON,
      '',
      '# This file',
      `Open ${a.roster[m].file} and read it fully.`,
      a.roster[m].tail,
    ].join('\n'),
  expectFiles: (a, m) => a.roster[m].file,
  key: (a, m) => a.roster[m].file,
};
