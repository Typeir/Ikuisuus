/**
 * @fileoverview Auth Module — Public Barrel Export
 * @description Re-exports the public API surface for the authentication system.
 * Import from `@/lib/db/auth` instead of reaching into individual files.
 *
 * @module lib/db/auth
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

export {
    createSessionToken,
    createUser,
    extractSession,
    getUserAdapter,
    hashPassword,
    login,
    setUserAdapter,
    validateSessionToken,
    verifyPassword
} from './authService';

export type {
    CreateUserRequest,
    LoginRequest,
    LoginResponse,
    SessionPayload,
    StoredUser,
    UserRole,
    ValidateResponse
} from './schemas';

export {
    CreateUserRequestSchema,
    LoginRequestSchema,
    LoginResponseSchema,
    SessionPayloadSchema,
    StoredUserSchema,
    ValidateResponseSchema
} from './schemas';

export type { UserAdapter } from './userAdapter';
