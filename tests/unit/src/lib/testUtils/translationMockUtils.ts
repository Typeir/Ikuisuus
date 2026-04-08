import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type TranslationTree = Record<string, unknown>;

const isRecord = (value: unknown): value is TranslationTree =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getNestedValue = (
  tree: TranslationTree,
  path: string,
): string | undefined => {
  const value = path.split('.').reduce<unknown>((current, part) => {
    if (!isRecord(current)) {
      return undefined;
    }
    return current[part];
  }, tree);

  return typeof value === 'string' ? value : undefined;
};

const interpolate = (
  template: string,
  values?: Record<string, unknown>,
): string =>
  template.replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = values?.[token];
    return value === undefined || value === null ? `{${token}}` : String(value);
  });

export const loadMessageFile = (relativePath: string): TranslationTree =>
  JSON.parse(
    readFileSync(join(process.cwd(), relativePath), 'utf8'),
  ) as TranslationTree;

export const createUseTranslationsMock =
  (messages: TranslationTree) =>
  (namespace?: string) =>
  (key: string, values?: Record<string, unknown>) => {
    const fullPath = namespace ? `${namespace}.${key}` : key;
    const resolved =
      getNestedValue(messages, fullPath) ?? getNestedValue(messages, key);

    return resolved ? interpolate(resolved, values) : key;
  };
