/**
 * @fileoverview Aspect Vocabulary Resolver
 * @description Flattens the closed aspect vocabulary in shared-data into
 * `{ group, values }` rows for pickers. Groups declaring `valuesFrom` are
 * expanded from the referenced game/item lists (or other aspect groups);
 * `open` groups and `meta:*` groups are omitted since they are not authorable.
 *
 * @module lib/metadata/aspectVocabulary
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

/**
 * One authorable aspect group.
 *
 * @property {string} group - Group key (`damage`, `myth`)
 * @property {string[]} values - Closed value list, in shared-data order
 * @property {string[] | '*'} scope - Content kinds the group applies to
 * @property {boolean} [authored] - Judgment facet: true when the vocabulary is
 *   ratified for authoring, false when the group exists but is not yet
 *   authored (pickers show it disabled); absent for machine-derived groups
 */
export interface AspectVocabularyGroup {
  group: string;
  values: string[];
  scope: string[] | '*';
  authored?: boolean;
}

/**
 * Display order for pickers: form leads, myth second, machine groups in
 * shared-data order, theme last.
 */
const FIRST = ['form', 'myth'];
const LAST = ['theme'];

/**
 * Loose shape of the shared-data blocks the resolver reads.
 */
interface SharedDataLike {
  aspects?: Record<
    string,
    {
      values?: string[];
      valuesFrom?: string[];
      open?: boolean;
      scope?: string[] | '*';
      authored?: boolean;
    }
  >;
  gameData?: Record<string, unknown>;
  itemData?: Record<string, unknown>;
}

/**
 * Names of a list referenced by `valuesFrom`, as lower-cased strings.
 * Accepts arrays of strings or arrays of `{ name }` objects.
 *
 * @param {unknown} list - Referenced list
 * @returns {string[]} Value names
 */
function namesOf(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) =>
      typeof entry === 'string'
        ? entry
        : entry && typeof entry === 'object' && 'name' in entry
          ? String((entry as { name: unknown }).name)
          : '',
    )
    .filter(Boolean)
    .map((name) => name.toLowerCase().replace(/\s+/g, '-'));
}

/**
 * Resolves the authorable aspect vocabulary.
 *
 * @param {SharedDataLike} shared - Loaded shared-data
 * @returns {AspectVocabularyGroup[]} Groups with values, empty groups dropped
 */
export function resolveAspectVocabulary(
  shared: SharedDataLike,
): AspectVocabularyGroup[] {
  const aspects = shared.aspects ?? {};
  const resolved = new Map<string, string[]>();

  const valuesOf = (group: string, seen = new Set<string>()): string[] => {
    if (resolved.has(group)) return resolved.get(group)!;
    if (seen.has(group)) return [];
    seen.add(group);
    const def = aspects[group];
    if (!def) return [];
    const out: string[] = [...(def.values ?? [])];
    for (const ref of def.valuesFrom ?? []) {
      const [root, key] = ref.split('.');
      if (key && (root === 'gameData' || root === 'itemData')) {
        out.push(...namesOf(shared[root]?.[key]));
      } else {
        out.push(...valuesOf(ref, seen));
      }
    }
    const unique = Array.from(new Set(out.map((v) => v.toLowerCase())));
    resolved.set(group, unique);
    return unique;
  };

  const rows = Object.entries(aspects)
    .filter(([group, def]) => !group.startsWith('meta:') && !def.open)
    .map(([group, def]) => ({
      group,
      values: valuesOf(group),
      scope: def.scope ?? '*',
      ...(def.authored === undefined ? {} : { authored: def.authored }),
    }))
    .filter((row) => row.values.length > 0);

  const rank = (group: string): number => {
    const first = FIRST.indexOf(group);
    if (first !== -1) return first;
    const last = LAST.indexOf(group);
    if (last !== -1) return 1_000 + last;
    return 100;
  };
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => rank(a.row.group) - rank(b.row.group) || a.index - b.index)
    .map(({ row }) => row);
}
