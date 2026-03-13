/**
 * @fileoverview HMAC Capability Token Utilities
 * @description Signed capability tokens for the Corrections module.
 * Tokens are HMAC-SHA256–signed JSON payloads carrying expiry, scope, and
 * an optional human-readable label for audit trails. No user accounts or
 * sessions are involved — possession of a valid token is sufficient.
 *
 * Token format: `<base64url(payload)>.<base64url(signature)>`
 *
 * @module lib/utils/auth/hmacToken
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 *
 * @requires crypto Node.js built-in
 */

import crypto from 'crypto';

/**
 * Decoded payload carried inside a capability token.
 *
 * @property {number} [exp] - Optional expiry as a Unix timestamp (seconds). Omit for non-expiring tokens.
 * @property {string} scope - Permission scope, e.g. `"content:write"`
 * @property {string} [label] - Optional human-readable label for audit logging
 */
export interface TokenPayload {
  /** Optional expiry as a Unix timestamp (seconds). Omit for non-expiring tokens. */
  exp?: number;
  /** Permission scope, e.g. `"content:write"` */
  scope: string;
  /** Optional human-readable label for audit logging */
  label?: string;
}

/**
 * Result of a token verification attempt.
 *
 * @property {boolean} valid - Whether the token is valid
 * @property {TokenPayload} [payload] - Decoded payload when valid
 * @property {string} [error] - Error reason when invalid
 */
export interface TokenVerifyResult {
  /** Whether the token is valid */
  valid: boolean;
  /** Decoded payload when valid */
  payload?: TokenPayload;
  /** Error reason when invalid */
  error?: string;
}

/**
 * Computes the HMAC-SHA256 signature for a base64url-encoded payload.
 *
 * @param {string} payloadB64 - Base64url-encoded payload string
 * @param {string} secret - Signing secret
 * @returns {string} Base64url-encoded HMAC digest
 */
const computeSignature = (payloadB64: string, secret: string): string =>
  crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

/**
 * Creates a signed capability token.
 *
 * @param {TokenPayload} payload - Token payload with required `exp` and `scope`
 * @param {string} secret - HMAC signing secret (must match `CORRECTIONS_SECRET`)
 * @returns {string} Signed token string `<payload>.<signature>`
 *
 * @example
 * ```ts
 * const token = createToken(
 *   { exp: Math.floor(Date.now() / 1000) + 3600, scope: 'content:write', label: 'editor-a' },
 *   process.env.CORRECTIONS_SECRET!
 * );
 * ```
 */
export const createToken = (payload: TokenPayload, secret: string): string => {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = computeSignature(payloadB64, secret);
  return `${payloadB64}.${signature}`;
};

/**
 * Verifies a capability token's signature and expiry.
 *
 * @param {string} token - Raw token string from the `Authorization` header
 * @param {string} secret - HMAC signing secret
 * @returns {TokenVerifyResult} Verification result with decoded payload or error
 *
 * @example
 * ```ts
 * const result = verifyToken(bearerToken, process.env.CORRECTIONS_SECRET!);
 * if (!result.valid) return NextResponse.json({ error: result.error }, { status: 401 });
 * ```
 */
export const verifyToken = (
  token: string,
  secret: string,
): TokenVerifyResult => {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed token' };
  }

  const [payloadB64, signature] = parts;
  const expected = computeSignature(payloadB64, secret);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return { valid: false, error: 'Invalid signature' };
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  } catch {
    return { valid: false, error: 'Malformed payload' };
  }

  if (typeof payload.scope !== 'string') {
    return { valid: false, error: 'Missing required field: scope' };
  }

  if (
    typeof payload.exp === 'number' &&
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    return { valid: false, error: 'Token expired' };
  }

  return { valid: true, payload };
};

/**
 * Extracts a short, non-sensitive identifier from a token for audit logging.
 * Returns the label if present, otherwise the first 8 characters of a SHA-256
 * hash of the full token.
 *
 * @param {string} token - Raw token string
 * @param {TokenPayload} [payload] - Already-decoded payload (avoids re-parsing)
 * @returns {string} Audit-safe identifier (never the raw token)
 */
export const tokenAuditId = (token: string, payload?: TokenPayload): string => {
  if (payload?.label) {
    return payload.label;
  }
  return crypto.createHash('sha256').update(token).digest('hex').slice(0, 8);
};
