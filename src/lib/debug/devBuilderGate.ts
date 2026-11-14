/**
 * @fileoverview Env gate for the dev builder HTTP API.
 *
 * @module lib/debug/devBuilderGate
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

/**
 * True when the dev builder HTTP API serves; requires `IK_DEV_BUILDER=1` outside production.
 *
 * @function isDevBuilderApiEnabled
 * @returns {boolean} Gate state; always false when `NODE_ENV` is `production`
 */
export function isDevBuilderApiEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' && process.env.IK_DEV_BUILDER === '1'
  );
}
