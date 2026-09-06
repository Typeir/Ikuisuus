/**
 * @fileoverview Client IP Extraction Utility
 * @description Provider-agnostic helper that extracts the true client IP from
 * common proxy/load-balancer headers.
 *
 * @module lib/security/getClientIp
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { NextRequest } from 'next/server';

/**
 * Extracts the client IP address from an incoming request.
 *
 * @param {NextRequest} req - Incoming Next.js request
 * @returns {string} Client IP address or `'unknown'`
 */
export const getClientIp = (req: NextRequest): string =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  req.headers.get('x-real-ip') ??
  'unknown';
