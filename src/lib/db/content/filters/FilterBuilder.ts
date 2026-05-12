/**
 * @fileoverview Filter Builder - JSON-serializable filter DSL
 * @description Provides a serializable filter expression language and a
 * builder that converts expressions into a MikroORM-compatible query object.
 * Used by repository adapters and API routes to push frontend filter state
 * down to the database (or in-memory equivalent for the fs adapter).
 *
 * Supports operators `eq`, `neq`, `in`, `nin`. Multiple expressions targeting
 * the same field are merged into a single operator object so callers can
 * compose mixed predicates (e.g. `$ne` plus `$in`) without losing either.
 *
 * @module lib/db/content/filters/FilterBuilder
 * @version 1.0.0
 * @author Typeir
 * @since 7.2.0
 *
 * @example
 * ```ts
 * const filters: FilterExpression[] = [
 *   { field: 'source', operator: 'neq', value: 'basic' },
 *   { field: 'school', operator: 'eq', value: 'Evocation' },
 * ];
 * buildFilterQuery(filters);
 * // => { source: { $ne: 'basic' }, school: 'Evocation' }
 * ```
 */

/**
 * Supported filter operators.
 *
 * @typedef {('eq'|'neq'|'in'|'nin')} FilterOperator
 */
export type FilterOperator = 'eq' | 'neq' | 'in' | 'nin';

/**
 * A single JSON-serializable filter expression.
 *
 * @interface FilterExpression
 * @property {string} field - Entity field name to filter on.
 * @property {FilterOperator} operator - Comparison operator.
 * @property {unknown} value - Comparison value. Must be an array for `in` / `nin`.
 */
export interface FilterExpression {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Type guard for `FilterExpression`. Validates shape, operator, and the
 * array constraint for `in` / `nin`.
 *
 * @param {unknown} candidate - Untrusted value to test.
 * @returns {candidate is FilterExpression} True when the candidate is a valid expression.
 */
export const isFilterExpression = (
  candidate: unknown,
): candidate is FilterExpression => {
  if (!candidate || typeof candidate !== 'object') return false;
  const expr = candidate as Record<string, unknown>;
  if (typeof expr.field !== 'string' || expr.field.length === 0) return false;
  if (typeof expr.operator !== 'string') return false;
  const op = expr.operator as FilterOperator;
  if (op !== 'eq' && op !== 'neq' && op !== 'in' && op !== 'nin') return false;
  if ((op === 'in' || op === 'nin') && !Array.isArray(expr.value)) return false;
  return true;
};

/**
 * Type guard for `FilterExpression[]`.
 *
 * @param {unknown} candidate - Untrusted value to test.
 * @returns {candidate is FilterExpression[]} True when every entry is a valid expression.
 */
export const isFilterExpressionArray = (
  candidate: unknown,
): candidate is FilterExpression[] => {
  return Array.isArray(candidate) && candidate.every(isFilterExpression);
};

/**
 * Maps a single expression to its MikroORM operator object representation.
 *
 * @param {FilterExpression} expr - Source expression.
 * @returns {unknown} Either a bare value (for `eq`) or `{ $op: value }`.
 * @throws {Error} On unsupported operator.
 */
const toOperatorClause = (expr: FilterExpression): unknown => {
  switch (expr.operator) {
    case 'eq':
      return expr.value;
    case 'neq':
      return { $ne: expr.value };
    case 'in':
      return { $in: expr.value };
    case 'nin':
      return { $nin: expr.value };
    default: {
      const op: string = (expr as { operator: string }).operator;
      throw new Error(`Unsupported filter operator: ${op}`);
    }
  }
};

/**
 * Builds a MikroORM-compatible filter query object from a list of expressions.
 *
 * Multiple expressions on the same field are merged into a single operator
 * object. A bare-value `eq` followed by another operator on the same field
 * is promoted to `{ $eq: value, $op: value }` so neither clause is lost.
 *
 * @param {FilterExpression[]} filters - Expressions to compose.
 * @returns {Record<string, unknown>} Plain object suitable for `em.find`.
 * @throws {Error} When an expression uses an unsupported operator.
 */
export const buildFilterQuery = (
  filters: FilterExpression[],
): Record<string, unknown> => {
  const query: Record<string, unknown> = {};
  for (const expr of filters) {
    const clause = toOperatorClause(expr);
    const existing = query[expr.field];
    if (existing === undefined) {
      query[expr.field] = clause;
      continue;
    }
    const existingObj =
      typeof existing === 'object' &&
      existing !== null &&
      !Array.isArray(existing)
        ? (existing as Record<string, unknown>)
        : { $eq: existing };
    const clauseObj =
      typeof clause === 'object' && clause !== null && !Array.isArray(clause)
        ? (clause as Record<string, unknown>)
        : { $eq: clause };
    query[expr.field] = { ...existingObj, ...clauseObj };
  }
  return query;
};

/**
 * Applies a filter expression list against an in-memory record set.
 * Used by filesystem-backed repositories to keep behavioral parity with the
 * pg adapter when `METADATA_BACKEND=fs`.
 *
 * Records whose fields are missing are excluded from `eq` / `in` matches and
 * included by `neq` / `nin` matches (mirroring SQL `IS NULL` semantics with
 * non-strict equality).
 *
 * @template T
 * @param {T[]} records - Records to filter.
 * @param {FilterExpression[]} filters - Expressions to apply (AND-composed).
 * @returns {T[]} Records that satisfy every expression.
 */
export const applyFiltersInMemory = <T>(
  records: T[],
  filters: FilterExpression[],
): T[] => {
  if (filters.length === 0) return records;
  return records.filter((record) =>
    filters.every((expr) => matchesExpression(record, expr)),
  );
};

/**
 * Tests a single record against a single expression.
 *
 * @template T
 * @param {T} record - Source record.
 * @param {FilterExpression} expr - Expression to evaluate.
 * @returns {boolean} True when the record satisfies the expression.
 */
const matchesExpression = <T>(record: T, expr: FilterExpression): boolean => {
  const fieldValue = (record as Record<string, unknown>)[expr.field];
  switch (expr.operator) {
    case 'eq':
      return fieldValue === expr.value;
    case 'neq':
      return fieldValue !== expr.value;
    case 'in':
      return Array.isArray(expr.value) && expr.value.includes(fieldValue);
    case 'nin':
      return Array.isArray(expr.value) && !expr.value.includes(fieldValue);
    default:
      return false;
  }
};
