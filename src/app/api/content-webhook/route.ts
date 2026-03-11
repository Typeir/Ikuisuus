/**
 * @fileoverview Content Repo Webhook API
 * @description Receives webhook calls from the content repo's GitHub Actions.
 * Currently supports banning IPs when the profanity filter catches content
 * that bypassed the corrections API's server-side check.
 *
 * Protected by the CONTENT_WEBHOOK_SECRET env var.
 *
 * @module app/api/content-webhook/route
 */

import { logger } from '@/lib/logging/logger';
import { banIp } from '@/lib/security/bannedIps';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:ContentWebhook' });

/**
 * POST /api/content-webhook
 *
 * @description Handles webhook events from the content repo's CI.
 *
 * Body: `{ action: "ban-ip", ip: string, reason: string }`
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CONTENT_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: 'Content webhook is not configured' },
      { status: 503 },
    );
  }

  const provided = req.headers.get('x-webhook-secret');
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  let body: { action?: string; ip?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { action, ip, reason } = body;

  if (action === 'ban-ip') {
    if (!ip || typeof ip !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid: ip' },
        { status: 400 },
      );
    }

    /** Validate IPv4/IPv6 format loosely before passing to banIp */
    if (!/^[\d.:a-fA-F]+$/.test(ip)) {
      return NextResponse.json(
        { error: 'Malformed IP address' },
        { status: 400 },
      );
    }

    const banReason =
      typeof reason === 'string' && reason.length > 0
        ? reason
        : 'Profanity detected by content repo CI';

    try {
      const entry = await banIp(ip, banReason);

      log.message('IP banned via content webhook', {
        ip,
        range: entry.range,
        reason: banReason,
      });

      return NextResponse.json(
        { banned: true, range: entry.range },
        { status: 200 },
      );
    } catch (err) {
      log.error('Failed to ban IP via content webhook', {
        ip,
        error: err instanceof Error ? err.message : String(err),
      });

      return NextResponse.json(
        { error: 'Failed to ban IP' },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
