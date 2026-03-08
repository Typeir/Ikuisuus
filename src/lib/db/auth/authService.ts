/**
 * @fileoverview Auth Service — User Management & Session Facade
 * @description Central service layer that sits between API routes and the storage
 * adapter. Handles password hashing, session token generation/verification,
 * and user CRUD. Adapter is swappable via `setUserAdapter()`.
 *
 * Session tokens are non-expiring HMAC digests: `sha256(CORRECTIONS_SECRET + userId)`.
 * They are validated by re-computing the digest, so no token storage is needed.
 *
 * @module lib/db/auth/authService
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { logger } from '@/lib/logging/logger';
import crypto from 'crypto';
import { edgeConfigUserAdapter } from './edgeConfigUserAdapter';
import type {
    CreateUserRequest,
    LoginRequest,
    LoginResponse,
    SessionPayload,
    StoredUser,
    ValidateResponse,
} from './schemas';
import type { UserAdapter } from './userAdapter';

const log = logger.child({ module: 'AuthService' });

/* ────────────────────────  Adapter wiring  ─────────────────────────── */

/** Active adapter — defaults to Edge Config, override via `setUserAdapter`. */
let adapter: UserAdapter = edgeConfigUserAdapter;

/**
 * Replaces the active user storage adapter.
 * Call this once at startup (e.g. in an instrumentation file) to switch backends.
 *
 * @param {UserAdapter} newAdapter - Adapter to use
 */
export const setUserAdapter = (newAdapter: UserAdapter): void => {
  adapter = newAdapter;
};

/**
 * Returns the active user storage adapter.
 *
 * @returns {UserAdapter} Current adapter
 */
export const getUserAdapter = (): UserAdapter => adapter;

/* ──────────────────────  Hashing helpers  ──────────────────────────── */

/**
 * Hashes a plain-text password with SHA-256.
 * Returns a 64-character hex string.
 *
 * @param {string} password - Plain-text password
 * @returns {string} SHA-256 hex digest
 */
export const hashPassword = (password: string): string =>
  crypto.createHash('sha256').update(password).digest('hex');

/**
 * Verifies a plain-text password against a stored hash.
 *
 * @param {string} password - Plain-text password
 * @param {string} storedHash - SHA-256 hex digest from the database
 * @returns {boolean} true if they match
 */
export const verifyPassword = (password: string, storedHash: string): boolean =>
  crypto.timingSafeEqual(
    Buffer.from(hashPassword(password)),
    Buffer.from(storedHash),
  );

/* ─────────────────────  Session token helpers  ────────────────────── */

/**
 * Derives a non-expiring session token for a user.
 * Token = `sha256(CORRECTIONS_SECRET + userId)`.
 *
 * @param {string} userId - Unique user ID
 * @returns {string} 64-char hex session token
 */
export const createSessionToken = (userId: string): string => {
  const secret = process.env.CORRECTIONS_SECRET;
  if (!secret) throw new Error('CORRECTIONS_SECRET is not configured');
  return crypto.createHash('sha256').update(`${secret}${userId}`).digest('hex');
};

/**
 * Validates a session token by brute-searching all users.
 * Since the token is a deterministic function of (secret, userId),
 * we recompute it for each user and compare.
 *
 * @param {string} token - Raw session token from the Authorization header
 * @returns {Promise<ValidateResponse>} Validation result with session payload
 */
export const validateSessionToken = async (
  token: string,
): Promise<ValidateResponse> => {
  const secret = process.env.CORRECTIONS_SECRET;
  if (!secret) {
    return { valid: false, error: 'Server not configured' };
  }

  const users = await adapter.listAll();
  for (const user of users) {
    const expected = createSessionToken(user.id);
    if (
      token.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
    ) {
      return {
        valid: true,
        session: {
          userId: user.id,
          username: user.username,
          role: user.role,
        },
      };
    }
  }

  return { valid: false, error: 'Invalid session token' };
};

/* ──────────────────────────  Login  ────────────────────────────────── */

/**
 * Authenticates a user by username + password.
 *
 * @param {LoginRequest} credentials - Login credentials
 * @returns {Promise<LoginResponse | { error: string }>} Login response or error
 */
export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse | { error: string }> => {
  const user = await adapter.findByUsername(credentials.username);
  if (!user) {
    log.message('Login failed — user not found', {
      level: 'warn',
      username: credentials.username,
    });
    return { error: 'Invalid username or password' };
  }

  if (!verifyPassword(credentials.password, user.passwordHash)) {
    log.message('Login failed — wrong password', {
      level: 'warn',
      username: credentials.username,
    });
    return { error: 'Invalid username or password' };
  }

  /** Update last login timestamp */
  await adapter
    .update(user.id, { lastLoginAt: new Date().toISOString() })
    .catch((err) => {
      log.debug('Failed to update lastLoginAt', {
        error: err instanceof Error ? err.message : String(err),
      });
    });

  const token = createSessionToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  };
};

/* ────────────────────────  User management  ──────────────────────── */

/**
 * Creates a new user. Called from the admin API or the seed script.
 *
 * @param {CreateUserRequest} input - Validated user creation request
 * @returns {Promise<StoredUser>} The newly created user record
 * @throws {Error} If the username is already taken
 */
export const createUser = async (
  input: CreateUserRequest,
): Promise<StoredUser> => {
  const user: StoredUser = {
    id: crypto.randomUUID(),
    username: input.username,
    passwordHash: hashPassword(input.password),
    role: input.role ?? 'editor',
    createdAt: new Date().toISOString(),
  };

  await adapter.create(user);
  log.message('User created', { username: user.username, role: user.role });
  return user;
};

/**
 * Extracts a SessionPayload from a Bearer token on an incoming request.
 * Returns null if the token is missing, malformed, or invalid.
 *
 * @param {string | null} authHeader - Raw Authorization header value
 * @returns {Promise<SessionPayload | null>} Session payload or null
 */
export const extractSession = async (
  authHeader: string | null,
): Promise<SessionPayload | null> => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const result = await validateSessionToken(token);
  return result.valid && result.session ? result.session : null;
};
