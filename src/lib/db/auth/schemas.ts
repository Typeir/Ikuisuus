/**
 * @fileoverview Auth Zod Schemas & DTOs
 * @description Validation schemas and TypeScript types for the user auth
 * system. Zod for runtime validation and type inference.
 *
 * @module lib/db/auth/schemas
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { z } from 'zod';

/* ────────────────────────────  User Role  ──────────────────────────── */

/**
 * Allowed user roles.
 *
 * @property {'admin'} admin - Full access (can manage users, merge PRs, etc.)
 * @property {'editor'} editor - Can submit corrections and new pages
 */
export const UserRole = z.enum(['admin', 'editor']);

/** Inferred TypeScript type for user roles. */
export type UserRole = z.infer<typeof UserRole>;

/* ────────────────────────────  Stored User  ─────────────────────────── */

/**
 * User record as persisted in the storage backend.
 * Passwords stored as SHA-256 hex digests.
 *
 * @property {string} id - Unique identifier (UUID v4 or similar)
 * @property {string} username - Display / login name (3-32 chars, alphanumeric + hyphens)
 * @property {string} passwordHash - SHA-256 hex digest of the plain-text password
 * @property {UserRole} role - Access level
 * @property {string} createdAt - ISO-8601 creation timestamp
 * @property {string} [lastLoginAt] - ISO-8601 timestamp of most recent login
 */
export const StoredUserSchema = z.object({
  id: z.string().min(1),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username must be alphanumeric with hyphens or underscores',
    ),
  passwordHash: z.string().min(64).max(64),
  role: UserRole,
  createdAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().optional(),
});

/** Inferred TypeScript type for a stored user. */
export type StoredUser = z.infer<typeof StoredUserSchema>;

/* ─────────────────────────  Login Request  ──────────────────────────── */

/**
 * Payload sent by the client to log in.
 *
 * @property {string} username - Login name
 * @property {string} password - Plain-text password (validated server-side, never stored)
 */
export const LoginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

/** Inferred TypeScript type for a login request body. */
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/* ─────────────────────────  Login Response  ─────────────────────────── */

/**
 * Successful login response returned to the client.
 * Contains a non-expiring session token and public user info.
 *
 * @property {string} token - Opaque session token (SHA-256 of server secret + user id)
 * @property {object} user - Public user info
 * @property {string} user.id - User ID
 * @property {string} user.username - Display name
 * @property {UserRole} user.role - Access level
 */
export const LoginResponseSchema = z.object({
  token: z.string().min(1),
  user: z.object({
    id: z.string(),
    username: z.string(),
    role: UserRole,
  }),
});

/** Inferred TypeScript type for a login response body. */
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/* ────────────────────────  Create User Request  ─────────────────────── */

/**
 * Payload for creating a new user (admin-only operation).
 *
 * @property {string} username - Desired login name
 * @property {string} password - Plain-text password (will be hashed before storage)
 * @property {UserRole} [role] - Role (defaults to 'editor')
 */
export const CreateUserRequestSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username must be alphanumeric with hyphens or underscores',
    ),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be at most 128 characters'),
  role: UserRole.default('editor'),
});

/** Inferred TypeScript type for a create-user request body. */
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

/* ────────────────────────  Session Payload  ──────────────────────────── */

/**
 * Decoded information from a session token.
 *
 * @property {string} userId - Authenticated user's ID
 * @property {string} username - Authenticated user's display name
 * @property {UserRole} role - Authenticated user's role
 */
export const SessionPayloadSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1),
  role: UserRole,
});

/** Inferred TypeScript type for a decoded session payload. */
export type SessionPayload = z.infer<typeof SessionPayloadSchema>;

/* ──────────────────────────  Validate Response  ─────────────────────── */

/**
 * Response from the /api/auth/validate endpoint.
 *
 * @property {boolean} valid - Whether the session token is still valid
 * @property {SessionPayload} [session] - Session details when valid
 * @property {string} [error] - Error message when invalid
 */
export const ValidateResponseSchema = z.object({
  valid: z.boolean(),
  session: SessionPayloadSchema.optional(),
  error: z.string().optional(),
});

/** Inferred TypeScript type for a validate response body. */
export type ValidateResponse = z.infer<typeof ValidateResponseSchema>;
