/**
 * @fileoverview Auth Module — Barrel Export
 * @description Re-exports the auth service, schema types/validators, and the
 * user adapter type. Import from `@/lib/db/auth`.
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
